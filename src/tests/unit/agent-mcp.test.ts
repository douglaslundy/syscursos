import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({ authenticateGateway: vi.fn() }));
const tools = vi.hoisted(() => ({ callAgentTool: vi.fn(), AGENT_TOOLS: [{ name: "list_courses", description: "d", inputSchema: { type: "object", properties: { includeFinished: { type: "boolean" } } } }] }));
const link = vi.hoisted(() => ({ findStudentByPhone: vi.fn(), linkWhatsappByCode: vi.fn() }));
const rate = vi.hoisted(() => ({ hitGlobal: vi.fn() }));
const seen: Array<string | null> = [];

vi.mock("@/server/agent/agent-auth", () => auth);
vi.mock("@/server/agent/agent-tools", () => tools);
vi.mock("@/server/services/whatsapp-link-service", () => link);
vi.mock("@/server/security/rate-limit", () => rate);
vi.mock("@/server/auth/agent-context", async () => {
  const { AsyncLocalStorage } = await import("node:async_hooks");
  const store = new AsyncLocalStorage<string>();

  return { runAsAgentStudent: <T,>(id: string, run: () => Promise<T>) => store.run(id, run), getAgentStudentId: () => store.getStore() ?? null };
});

import { getAgentStudentId } from "@/server/auth/agent-context";
import { handleMcpPost } from "@/server/agent/mcp-handler";

const post = (body: unknown) => new Request("http://x/api/mcp", { method: "POST", headers: { "content-type": "application/json", authorization: "Bearer t" }, body: typeof body === "string" ? body : JSON.stringify(body) });
const rpc = (method: string, params?: unknown, id: number | null = 1) => ({ jsonrpc: "2.0", ...(id === null ? {} : { id }), method, params });
const call = (name: string, args: unknown) => post(rpc("tools/call", { name, arguments: args }));
const PHONE = "+55 11 99999-8888";

beforeEach(() => {
  vi.resetAllMocks();
  seen.length = 0;
  auth.authenticateGateway.mockResolvedValue({ ok: true });
  rate.hitGlobal.mockResolvedValue(true);
  link.findStudentByPhone.mockResolvedValue("stu-1");
});

describe("mcp handler", () => {
  it("devolve o status da autenticação sem processar nada", async () => {
    auth.authenticateGateway.mockResolvedValue({ ok: false, status: 401, error: "Unauthorized" });

    const response = await handleMcpPost(post(rpc("tools/list")));

    expect(response.status).toBe(401);
    expect(tools.callAgentTool).not.toHaveBeenCalled();
  });

  it("initialize negocia a versão e anuncia tools; versão desconhecida cai na mais recente", async () => {
    const ok = await (await handleMcpPost(post(rpc("initialize", { protocolVersion: "2025-03-26" })))).json();
    const old = await (await handleMcpPost(post(rpc("initialize", { protocolVersion: "1999-01-01" })))).json();

    expect(ok.result).toMatchObject({ protocolVersion: "2025-03-26", capabilities: { tools: {} }, serverInfo: { name: "syscursos" } });
    expect(old.result.protocolVersion).toBe("2025-06-18");
  });

  it("notificação responde 202 sem corpo", async () => {
    expect((await handleMcpPost(post(rpc("notifications/initialized", undefined, null)))).status).toBe(202);
  });

  it("tools/list exige phone em toda tool e inclui link_whatsapp", async () => {
    const { result } = await (await handleMcpPost(post(rpc("tools/list")))).json();
    const byName = Object.fromEntries(result.tools.map((tool: { name: string }) => [tool.name, tool]));

    expect(byName.list_courses.inputSchema.required).toContain("phone");
    expect(byName.list_courses.inputSchema.properties).toMatchObject({ phone: { type: "string" }, includeFinished: { type: "boolean" } });
    expect(byName.link_whatsapp.inputSchema.required).toEqual(["phone", "code"]);
  });

  it("tools/call identifica o aluno pelo telefone e roda no contexto dele, sem repassar o phone à tool", async () => {
    tools.callAgentTool.mockImplementation(async () => {
      seen.push(getAgentStudentId());
      return { ok: true, data: { courses: [] } };
    });

    const body = await (await handleMcpPost(call("list_courses", { phone: PHONE, includeFinished: true }))).json();

    expect(link.findStudentByPhone).toHaveBeenCalledWith(PHONE);
    expect(seen).toEqual(["stu-1"]);
    expect(tools.callAgentTool).toHaveBeenCalledWith("list_courses", { includeFinished: true });
    expect(body.result).toMatchObject({ isError: false, content: [{ type: "text", text: JSON.stringify({ courses: [] }) }] });
  });

  it("telefone ausente, inválido ou sem vínculo dá not_linked e não executa a tool", async () => {
    link.findStudentByPhone.mockResolvedValue(null);

    for (const args of [{}, { phone: "abc" }, { phone: PHONE }]) {
      const body = await (await handleMcpPost(call("list_courses", args))).json();

      expect(body.result.isError).toBe(true);
      expect(JSON.parse(body.result.content[0].text).error).toBe("not_linked");
    }

    expect(tools.callAgentTool).not.toHaveBeenCalled();
  });

  it("limite por telefone", async () => {
    rate.hitGlobal.mockResolvedValue(false);

    const body = await (await handleMcpPost(call("list_courses", { phone: PHONE }))).json();

    expect(JSON.parse(body.result.content[0].text).error).toBe("rate_limited");
    expect(tools.callAgentTool).not.toHaveBeenCalled();
  });

  it("erro de tool vira isError true, não erro de protocolo", async () => {
    tools.callAgentTool.mockResolvedValue({ ok: false, error: "none_pending" });

    const body = await (await handleMcpPost(call("start_session", { phone: PHONE }))).json();

    expect(body.result).toMatchObject({ isError: true, content: [{ type: "text", text: JSON.stringify({ error: "none_pending" }) }] });
  });

  it("link_whatsapp vincula sem exigir vínculo prévio", async () => {
    link.linkWhatsappByCode.mockResolvedValue({ ok: true });

    const body = await (await handleMcpPost(call("link_whatsapp", { phone: PHONE, code: "ABCD2345" }))).json();

    expect(link.linkWhatsappByCode).toHaveBeenCalledWith(PHONE, "ABCD2345");
    expect(link.findStudentByPhone).not.toHaveBeenCalled();
    expect(body.result).toMatchObject({ isError: false, content: [{ text: JSON.stringify({ linked: true }) }] });
  });

  it("link_whatsapp repassa o erro e valida os campos", async () => {
    link.linkWhatsappByCode.mockResolvedValue({ ok: false, error: "invalid_code" });

    const bad = await (await handleMcpPost(call("link_whatsapp", { phone: PHONE, code: "ABCD2345" }))).json();
    const empty = await (await handleMcpPost(call("link_whatsapp", { phone: PHONE }))).json();

    expect(bad.result).toMatchObject({ isError: true, content: [{ text: JSON.stringify({ error: "invalid_code" }) }] });
    expect(JSON.parse(empty.result.content[0].text).error).toBe("invalid_input");
  });

  it("método desconhecido, JSON inválido e batch dão erro JSON-RPC; ping responde vazio", async () => {
    expect((await (await handleMcpPost(post(rpc("foo")))).json()).error.code).toBe(-32601);

    const bad = await handleMcpPost(post("{nao json"));

    expect(bad.status).toBe(400);
    expect((await bad.json()).error.code).toBe(-32700);
    expect((await (await handleMcpPost(post([rpc("ping")]))).json()).error.code).toBe(-32600);
    expect((await (await handleMcpPost(post(rpc("ping")))).json()).result).toEqual({});
  });
});
