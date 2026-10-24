import { handleMcpPost } from "@/server/agent/mcp-handler";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Servidor MCP (Streamable HTTP, stateless) para o agente do OpenClaw. Autenticação: Bearer AGENT_API_TOKEN.
export const POST = handleMcpPost;

// Sem stream SSE: o cliente MCP trata 405 no GET como "só POST".
export const GET = () => new Response(null, { status: 405, headers: { Allow: "POST" } });
