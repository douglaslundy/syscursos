import { beforeEach, describe, expect, it, vi } from "vitest";

const rate = vi.hoisted(() => ({ hitGlobal: vi.fn() }));

vi.mock("@/server/security/rate-limit", () => ({ hitGlobal: rate.hitGlobal }));

import { authenticateGateway } from "@/server/agent/agent-auth";

const TOKEN = "t".repeat(40);
const request = (authorization?: string) => new Request("http://x/api/mcp", { method: "POST", headers: authorization ? { authorization } : {} });

beforeEach(() => {
  vi.resetAllMocks();
  process.env.AGENT_API_TOKEN = TOKEN;
  rate.hitGlobal.mockResolvedValue(true);
});

describe("authenticateGateway", () => {
  it("503 quando o token não está configurado ou é curto", async () => {
    delete process.env.AGENT_API_TOKEN;
    expect(await authenticateGateway(request(`Bearer ${TOKEN}`))).toMatchObject({ ok: false, status: 503 });
    process.env.AGENT_API_TOKEN = "curto";
    expect(await authenticateGateway(request("Bearer curto"))).toMatchObject({ ok: false, status: 503 });
  });

  it("401 sem header, sem Bearer ou com token errado", async () => {
    expect(await authenticateGateway(request())).toMatchObject({ ok: false, status: 401 });
    expect(await authenticateGateway(request(`Bearer ${"x".repeat(40)}`))).toMatchObject({ ok: false, status: 401 });
    expect(await authenticateGateway(request(TOKEN))).toMatchObject({ ok: false, status: 401 });
  });

  it("429 quando estoura o limite global", async () => {
    rate.hitGlobal.mockResolvedValue(false);
    expect(await authenticateGateway(request(`Bearer ${TOKEN}`))).toMatchObject({ ok: false, status: 429 });
  });

  it("ok com o token certo", async () => {
    expect(await authenticateGateway(request(`Bearer ${TOKEN}`))).toEqual({ ok: true });
  });
});
