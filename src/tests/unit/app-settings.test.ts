import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  findUnique: vi.fn(),
  upsert: vi.fn(),
  deleteMany: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({ prisma: { appSetting: db } }));

import { appSettings } from "@/server/services/app-settings";

describe("appSettings cache", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    db.upsert.mockResolvedValue({});
    await appSettings.upsert({ where: { key: "x" }, create: { key: "x", value: "" }, update: {} });
    db.findUnique.mockResolvedValue({ value: "a" });
  });

  it("reads the database once within the TTL", async () => {
    await appSettings.findUnique({ where: { key: "k" } });
    await appSettings.findUnique({ where: { key: "k" } });

    expect(db.findUnique).toHaveBeenCalledTimes(1);
  });

  it("clears the cache after a write", async () => {
    await appSettings.findUnique({ where: { key: "k" } });
    await appSettings.upsert({ where: { key: "k" }, create: { key: "k", value: "b" }, update: { value: "b" } });
    await appSettings.findUnique({ where: { key: "k" } });

    expect(db.findUnique).toHaveBeenCalledTimes(2);
  });
});
