import { beforeEach, describe, expect, it, vi } from "vitest";

const redirectMock = vi.hoisted(() =>
  vi.fn((url: string): never => {
    throw new Error(`REDIRECT:${url}`);
  }),
);

const signInWithPasswordMock = vi.hoisted(() => vi.fn());
const signOutMock = vi.hoisted(() => vi.fn());
const findFirstMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: () => ({
    auth: {
      signInWithPassword: signInWithPasswordMock,
      signOut: signOutMock,
    },
  }),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: {
      findFirst: findFirstMock,
    },
  },
}));

describe("loginAction", () => {
  beforeEach(() => {
    redirectMock.mockClear();
    signInWithPasswordMock.mockReset();
    signOutMock.mockReset();
    findFirstMock.mockReset();
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
    });

    await expect(loginAction(loginForm("admin@example.com", "admin"))).rejects.toThrow(
      "REDIRECT:/admin",
    );
    expect(signInWithPasswordMock).toHaveBeenCalledWith({
      email: "admin@example.com",
      password: "password123",
    });
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
    });

    await expect(loginAction(loginForm("student@example.com"))).rejects.toThrow("REDIRECT:/app");
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
    });

    await expect(loginAction(loginForm("student@example.com", "admin"))).rejects.toThrow(
      "REDIRECT:/login/admin?error=forbidden",
    );
    expect(signOutMock).toHaveBeenCalledOnce();
  });

  it("allows client-area login for admin and redirects to app", async () => {
    const { loginAction } = await import("@/server/actions/auth-actions");
    signInWithPasswordMock.mockResolvedValue({
      data: { user: { id: "auth-admin", email: "admin@example.com" } },
      error: null,
    });
    findFirstMock.mockResolvedValue({
      id: "user-admin",
      role: "ADMIN",
      status: "ACTIVE",
    });

    await expect(loginAction(loginForm("admin@example.com", "client"))).rejects.toThrow(
      "REDIRECT:/app",
    );
    expect(signOutMock).not.toHaveBeenCalled();
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
    });

    await expect(loginAction(loginForm("inactive@example.com"))).rejects.toThrow(
      "REDIRECT:/login/client?error=forbidden",
    );
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
