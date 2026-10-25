import { z } from "zod";

import { authenticateGateway } from "@/server/agent/agent-auth";
import { AGENT_TOOLS, callAgentTool } from "@/server/agent/agent-tools";
import { runAsAgentStudent } from "@/server/auth/agent-context";
import { getDisabledFeatures, isFeatureEnabled } from "@/server/services/feature-service";
import { collectDueAgentReminders } from "@/server/services/reminder-config-service";
import { hitGlobal } from "@/server/security/rate-limit";
import { findStudentByPhone, linkWhatsappByCode } from "@/server/services/whatsapp-link-service";

// MCP sobre Streamable HTTP, modo stateless e só JSON (sem SSE): cada POST traz uma mensagem JSON-RPC.
const SUPPORTED = ["2025-06-18", "2025-03-26", "2024-11-05"];
const MAX_BODY_BYTES = 200_000;
const MAX_CALLS_PER_PHONE_PER_MINUTE = 60;
const message = z.object({ jsonrpc: z.literal("2.0"), id: z.union([z.string(), z.number()]).optional(), method: z.string(), params: z.unknown().optional() });
const callParams = z.object({ name: z.string(), arguments: z.unknown().optional() });
const linkArgs = z.object({ phone: z.string().min(1).max(64), code: z.string().min(1).max(32) });
const phoneProperty = { type: "string", description: "Telefone do remetente, exatamente como o canal do WhatsApp informa (ex.: 5511999998888). Nunca use outro número." };

const LINK_TOOL = {
  name: "link_whatsapp",
  description: "Vincula o WhatsApp do remetente à conta do aluno com o código que ele gerou no site (Meus dados > WhatsApp). Use quando outra tool devolver not_linked.",
  inputSchema: { type: "object", properties: { phone: phoneProperty, code: { type: "string", description: "Código de 8 caracteres gerado no site." } }, required: ["phone", "code"] },
};

const REMINDERS_TOOL = {
  name: "due_reminders",
  description: "Para o agendamento do gateway (NÃO é para o aluno): devolve os lembretes de estudo que vencem agora como lista de { phone, text }. Cada item já sai marcado como enviado: envie cada text ao WhatsApp do phone indicado. Não precisa de phone na chamada.",
  inputSchema: { type: "object", properties: {} },
};

const json = (body: unknown, status = 200) => Response.json(body, { status });
const rpcError = (id: string | number | null, code: number, text: string, status = 200) => json({ jsonrpc: "2.0", id, error: { code, message: text } }, status);
const toolResult = (id: string | number, payload: unknown, isError: boolean) => json({ jsonrpc: "2.0", id, result: { isError, content: [{ type: "text", text: JSON.stringify(payload) }] } });

// Toda tool recebe o telefone do remetente; ele é removido antes de a tool validar a própria entrada.
const withPhone = (tool: { name: string; description: string; inputSchema: { type: "object"; properties: Record<string, unknown>; required?: string[] } }) => ({
  name: tool.name,
  description: tool.description,
  inputSchema: { ...tool.inputSchema, properties: { phone: phoneProperty, ...tool.inputSchema.properties }, required: ["phone", ...(tool.inputSchema.required ?? [])] },
});

async function callTool(id: string | number, name: string, rawArgs: unknown) {
  const args = rawArgs && typeof rawArgs === "object" ? (rawArgs as Record<string, unknown>) : {};
  const { phone, ...rest } = args;
  const phoneText = typeof phone === "string" ? phone : "";

  if (name === "due_reminders") {
    if (!(await isFeatureEnabled("agent:due_reminders"))) return toolResult(id, { error: "disabled" }, true);

    return toolResult(id, { reminders: await collectDueAgentReminders() }, false);
  }

  if (name === "link_whatsapp") {
    const parsed = linkArgs.safeParse(args);

    if (!parsed.success) return toolResult(id, { error: "invalid_input" }, true);

    const result = await linkWhatsappByCode(parsed.data.phone, parsed.data.code);

    return result.ok ? toolResult(id, { linked: true }, false) : toolResult(id, { error: result.error }, true);
  }

  const studentId = phoneText ? await findStudentByPhone(phoneText) : null;

  if (!studentId) return toolResult(id, { error: "not_linked", hint: "Peça ao aluno o código gerado no site (Meus dados > WhatsApp) e use link_whatsapp." }, true);
  if (!(await hitGlobal(`agent-phone:${studentId}`, MAX_CALLS_PER_PHONE_PER_MINUTE, 60_000))) return toolResult(id, { error: "rate_limited" }, true);

  const result = await runAsAgentStudent(studentId, () => callAgentTool(name, rest));

  return toolResult(id, result.ok ? result.data : { error: result.error, ...(result.details ? { details: result.details } : {}) }, !result.ok);
}

export async function handleMcpPost(request: Request): Promise<Response> {
  const auth = await authenticateGateway(request);

  if (!auth.ok) return json({ error: auth.error }, auth.status);

  const raw = await request.text();

  if (raw.length > MAX_BODY_BYTES) return rpcError(null, -32600, "Request too large", 413);

  let body: unknown;

  try {
    body = JSON.parse(raw);
  } catch {
    return rpcError(null, -32700, "Parse error", 400);
  }

  const parsed = message.safeParse(body);

  if (!parsed.success) return rpcError(null, -32600, "Invalid request (batches are not supported)");

  const { id, method, params } = parsed.data;

  if (id === undefined) return new Response(null, { status: 202 });

  switch (method) {
    case "initialize": {
      const asked = (params as { protocolVersion?: unknown } | undefined)?.protocolVersion;
      const protocolVersion = typeof asked === "string" && SUPPORTED.includes(asked) ? asked : SUPPORTED[0];

      return json({ jsonrpc: "2.0", id, result: { protocolVersion, capabilities: { tools: {} }, serverInfo: { name: "syscursos", version: "1.1.0" } } });
    }
    case "ping":
      return json({ jsonrpc: "2.0", id, result: {} });
    case "tools/list": {
      const disabled = await getDisabledFeatures();

      return json({ jsonrpc: "2.0", id, result: { tools: [LINK_TOOL, ...(disabled.has("agent:due_reminders") ? [] : [REMINDERS_TOOL]), ...AGENT_TOOLS.filter((tool) => !disabled.has(`agent:${tool.name}`)).map(withPhone)] } });
    }
    case "tools/call": {
      const call = callParams.safeParse(params);

      return call.success ? callTool(id, call.data.name, call.data.arguments) : rpcError(id, -32602, "Invalid params");
    }
    default:
      return rpcError(id, -32601, "Method not found");
  }
}
