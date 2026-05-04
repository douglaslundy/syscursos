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

    await expect(loginAction(loginForm("admin@example.com"))).rejects.toThrow("REDIRECT:/admin");
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
      "REDIRECT:/login?error=forbidden",
    );
    expect(signOutMock).toHaveBeenCalledOnce();
  });
});

function loginForm(email: string) {
  const formData = new FormData();
  formData.set("email", email);
  formData.set("password", "password123");
  return formData;
}
