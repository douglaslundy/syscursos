import { beforeEach, describe, expect, it, vi } from "vitest";

const { countMock, createMock, deleteManyMock } = vi.hoisted(() => ({
  countMock: vi.fn(),
  createMock: vi.fn(),
  deleteManyMock: vi.fn(),
}));

vi.mock("next/headers", () => ({ headers: vi.fn() }));
vi.mock("@/lib/db/prisma", () => ({
  prisma: { rateLimitEvent: { count: countMock, create: createMock, deleteMany: deleteManyMock } },
}));

import { hitGlobal, resetRateLimits } from "@/server/security/rate-limit";

describe("hitGlobal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetRateLimits();
  });

  it("registra a tentativa quando esta abaixo do limite", async () => {
    countMock.mockResolvedValue(2);

    expect(await hitGlobal("k", 3, 60_000)).toBe(true);
    expect(createMock).toHaveBeenCalledWith({ data: { key: "k" } });
  });

  it("bloqueia sem registrar quando o limite foi atingido", async () => {
    countMock.mockResolvedValue(3);

    expect(await hitGlobal("k", 3, 60_000)).toBe(false);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("cai no contador em memoria se o banco falhar", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    countMock.mockRejectedValue(new Error("db"));

    expect(await hitGlobal("m", 1, 60_000)).toBe(true);
    expect(await hitGlobal("m", 1, 60_000)).toBe(false);
  });
});
