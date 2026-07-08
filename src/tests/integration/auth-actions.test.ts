import { beforeEach, describe, expect, it, vi } from "vitest";

const redirectMock = vi.hoisted(() =>
  vi.fn((url: string): never => {
    throw new Error(`REDIRECT:${url}`);
  }),
);

const createSupabaseServerClientMock = vi.hoisted(() => vi.fn());
const signInWithPasswordMock = vi.hoisted(() => vi.fn());
const signOutMock = vi.hoisted(() => vi.fn());
const findFirstMock = vi.hoisted(() => vi.fn());
const updateManyMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: (audience?: string) => {
    createSupabaseServerClientMock(audience);
    return {
      auth: {
        signInWithPassword: signInWithPasswordMock,
        signOut: signOutMock,
      },
    };
  },
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: {
      findFirst: findFirstMock,
      updateMany: updateManyMock,
    },
  },
}));

describe("loginAction", () => {
  beforeEach(() => {
    redirectMock.mockClear();
    createSupabaseServerClientMock.mockClear();
    signInWithPasswordMock.mockReset();
    signOutMock.mockReset();
    findFirstMock.mockReset();
    updateManyMock.mockReset();
    updateManyMock.mockResolvedValue({ count: 1 });
  });

  it("redirects an active admin to the admin area", async () => {
    const { loginAction } = await import("@/server/actions/auth-actions");
    signInWithPasswordMock.mockResolvedValue({
      data: { user: { id: "auth-admin", email: "admin@example.com" } },
      error: null,
    });
    findFirstMock.mockResolvedValue({
      id: "user-admin",
      role: "ADMIN",
      status: "ACTIVE",
      accessExpiresAt: null,
    });

    await expect(loginAction(loginForm("admin@example.com", "admin"))).rejects.toThrow(
      "REDIRECT:/admin",
    );
    expect(createSupabaseServerClientMock).toHaveBeenCalledWith("admin");
    expect(signInWithPasswordMock).toHaveBeenCalledWith({
      email: "admin@example.com",
      password: "password123",
    });
  });

  it("redirects an active producer to the admin area", async () => {
    const { loginAction } = await import("@/server/actions/auth-actions");
    signInWithPasswordMock.mockResolvedValue({
      data: { user: { id: "auth-producer", email: "producer@example.com" } },
      error: null,
    });
    findFirstMock.mockResolvedValue({
      id: "user-producer",
      role: "PRODUCER",
      status: "ACTIVE",
      accessExpiresAt: null,
    });

    await expect(loginAction(loginForm("producer@example.com", "admin"))).rejects.toThrow(
      "REDIRECT:/admin",
    );
    expect(createSupabaseServerClientMock).toHaveBeenCalledWith("admin");
  });

  it("redirects an active student to the student area", async () => {
    const { loginAction } = await import("@/server/actions/auth-actions");
    signInWithPasswordMock.mockResolvedValue({
      data: { user: { id: "auth-student", email: "student@example.com" } },
      error: null,
    });
    findFirstMock.mockResolvedValue({
      id: "user-student",
      role: "STUDENT",
      status: "ACTIVE",
      accessExpiresAt: null,
    });

    await expect(loginAction(loginForm("student@example.com"))).rejects.toThrow("REDIRECT:/app");
    expect(createSupabaseServerClientMock).toHaveBeenCalledWith("client");
  });

  it("blocks admin area login when authenticated user is student", async () => {
    const { loginAction } = await import("@/server/actions/auth-actions");
    signInWithPasswordMock.mockResolvedValue({
      data: { user: { id: "auth-student", email: "student@example.com" } },
      error: null,
    });
    findFirstMock.mockResolvedValue({
      id: "user-student",
      role: "STUDENT",
      status: "ACTIVE",
      accessExpiresAt: null,
    });

    await expect(loginAction(loginForm("student@example.com", "admin"))).rejects.toThrow(
      "REDIRECT:/login/admin?error=forbidden",
    );
    expect(createSupabaseServerClientMock).toHaveBeenCalledWith("admin");
    expect(signOutMock).toHaveBeenCalledOnce();
  });

  it("blocks admin when trying to login through client area", async () => {
    const { loginAction } = await import("@/server/actions/auth-actions");
    signInWithPasswordMock.mockResolvedValue({
      data: { user: { id: "auth-admin", email: "admin@example.com" } },
      error: null,
    });
    findFirstMock.mockResolvedValue({
      id: "user-admin",
      role: "ADMIN",
      status: "ACTIVE",
      accessExpiresAt: null,
    });

    await expect(loginAction(loginForm("admin@example.com", "client"))).rejects.toThrow(
      "REDIRECT:/login/client?error=forbidden",
    );
    expect(createSupabaseServerClientMock).toHaveBeenCalledWith("client");
    expect(signOutMock).toHaveBeenCalledOnce();
  });

  it("blocks inactive application users after Supabase authentication", async () => {
    const { loginAction } = await import("@/server/actions/auth-actions");
    signInWithPasswordMock.mockResolvedValue({
      data: { user: { id: "auth-inactive", email: "inactive@example.com" } },
      error: null,
    });
    findFirstMock.mockResolvedValue({
      id: "user-inactive",
      role: "STUDENT",
      status: "INACTIVE",
      accessExpiresAt: null,
    });

    await expect(loginAction(loginForm("inactive@example.com"))).rejects.toThrow(
      "REDIRECT:/login/client?error=forbidden",
    );
    expect(signOutMock).toHaveBeenCalledOnce();
  });

  it("signs out only the requested admin audience", async () => {
    const { logoutAction } = await import("@/server/actions/auth-actions");
    const formData = new FormData();
    formData.set("audience", "admin");

    await expect(logoutAction(formData)).rejects.toThrow("REDIRECT:/login/admin");

    expect(createSupabaseServerClientMock).toHaveBeenCalledWith("admin");
    expect(signOutMock).toHaveBeenCalledOnce();
  });

  it("signs out only the requested client audience", async () => {
    const { logoutAction } = await import("@/server/actions/auth-actions");
    const formData = new FormData();
    formData.set("audience", "client");

    await expect(logoutAction(formData)).rejects.toThrow("REDIRECT:/login/client");

    expect(createSupabaseServerClientMock).toHaveBeenCalledWith("client");
    expect(signOutMock).toHaveBeenCalledOnce();
  });

  it("redirects to a controlled login error when the application database is unavailable", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { loginAction } = await import("@/server/actions/auth-actions");
    signInWithPasswordMock.mockResolvedValue({
      data: { user: { id: "auth-admin", email: "admin@example.com" } },
      error: null,
    });
    findFirstMock.mockRejectedValue(new Error("database unavailable"));

    await expect(loginAction(loginForm("admin@example.com"))).rejects.toThrow(
      "REDIRECT:/login/client?error=server",
    );
    expect(signOutMock).toHaveBeenCalledOnce();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to load application user during login.",
      expect.any(Error),
    );
    consoleErrorSpy.mockRestore();
  });
});

function loginForm(email: string, audience: "admin" | "client" = "client") {
  const formData = new FormData();
  formData.set("audience", audience);
  formData.set("email", email);
  formData.set("password", "password123");
  return formData;
}
