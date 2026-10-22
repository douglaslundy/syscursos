import { beforeEach, describe, expect, it, vi } from "vitest";

const settings = vi.hoisted(() => ({ findUnique: vi.fn(), upsert: vi.fn() }));

vi.mock("@/lib/db/prisma", () => ({ prisma: {} }));
vi.mock("@/server/services/app-settings", () => ({ appSettings: settings }));
vi.mock("@/server/auth/guards", () => ({ requireRole: vi.fn() }));
vi.mock("@/server/security/secret-box", () => ({ decryptSecret: (value: string) => value, encryptSecret: (value: string) => value }));

import { getPlayerMode, savePlayerMode } from "@/server/services/settings-service";

const stored = (values: Record<string, string>) =>
  settings.findUnique.mockImplementation(async ({ where }: { where: { key: string } }) => (where.key in values ? { value: values[where.key] } : null));

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("GOOGLE_API_KEY", "");
});

describe("player mode", () => {
  it("defaults to the Google window", async () => {
    stored({});

    expect(await getPlayerMode()).toBe("embed");
  });

  it("uses the own player only when the Google key is available", async () => {
    stored({ player_mode: "own" });
    expect(await getPlayerMode()).toBe("embed");

    stored({ player_mode: "own", google_api_key: "k".repeat(30) });
    expect(await getPlayerMode()).toBe("own");
  });

  it("refuses to enable the own player without the key", async () => {
    stored({});

    expect(await savePlayerMode("own")).toBe("need_key");
    expect(settings.upsert).not.toHaveBeenCalled();
  });

  it("saves the choice when the key exists, and always lets the admin go back", async () => {
    stored({ google_api_key: "k".repeat(30) });
    expect(await savePlayerMode("own")).toBe("saved");

    stored({});
    expect(await savePlayerMode("embed")).toBe("saved");
    expect(settings.upsert).toHaveBeenCalledTimes(2);
  });
});
