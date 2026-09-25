import { beforeEach, describe, expect, it, vi } from "vitest";

const getUserMock = vi.hoisted(() => vi.fn());
const findFirstMock = vi.hoisted(() => vi.fn());

vi.mock("react", () => ({
  cache: <TFunction extends (...args: never[]) => unknown>(callback: TFunction) => callback,
}));

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
  unstable_cache: <TFunction extends (...args: never[]) => unknown>(callback: TFunction) => callback,
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: () => ({
    auth: { getUser: getUserMock },
  }),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: { findFirst: findFirstMock },
  },
}));

vi.mock("@/server/db/retry", () => ({
  withDbRetry: <TResult>(operation: () => Promise<TResult>) => operation(),
}));

describe("getCurrentUser", () => {
  beforeEach(() => {
    getUserMock.mockReset();
    findFirstMock.mockReset();
  });

  it("keeps the session path active when Supabase returns an infrastructure error", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { getCurrentUser } = await import("@/server/auth/session");
    getUserMock.mockResolvedValue({
      data: { user: null },
      error: { message: "upstream timeout", status: 504 },
    });

    await expect(getCurrentUser("admin")).resolves.toEqual({ ok: false, reason: "SERVER_ERROR" });
    expect(findFirstMock).not.toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it("returns unauthenticated only for a genuinely missing session", async () => {
    const { getCurrentUser } = await import("@/server/auth/session");
    getUserMock.mockResolvedValue({
      data: { user: null },
      error: { name: "AuthSessionMissingError", message: "Auth session missing!", status: 400 },
    });

    await expect(getCurrentUser("client")).resolves.toEqual({
      ok: false,
      reason: "UNAUTHENTICATED",
    });
    expect(findFirstMock).not.toHaveBeenCalled();
  });
});
