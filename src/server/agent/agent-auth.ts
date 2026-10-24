import { createHash, timingSafeEqual } from "node:crypto";

import { hitGlobal } from "@/server/security/rate-limit";

export type GatewayAuth = { ok: true } | { ok: false; status: 401 | 429 | 503; error: string };

const MIN_TOKEN_LENGTH = 32;
const MAX_CALLS_PER_MINUTE = 300;
const digest = (value: string) => createHash("sha256").update(value).digest();

// Quem chama /api/mcp é a gateway do OpenClaw (token único em AGENT_API_TOKEN). O aluno é identificado depois, pelo telefone vinculado.
export async function authenticateGateway(request: Request): Promise<GatewayAuth> {
  const token = process.env.AGENT_API_TOKEN ?? "";

  if (token.length < MIN_TOKEN_LENGTH) return { ok: false, status: 503, error: "Agent API not configured" };

  const sent = /^Bearer (.+)$/.exec(request.headers.get("authorization") ?? "")?.[1] ?? "";

  if (!timingSafeEqual(digest(sent), digest(token))) return { ok: false, status: 401, error: "Unauthorized" };
  if (!(await hitGlobal("agent-mcp", MAX_CALLS_PER_MINUTE, 60_000))) return { ok: false, status: 429, error: "Too many requests" };

  return { ok: true };
}
