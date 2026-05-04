import { describe, expect, it } from "vitest";

import { loginSchema } from "@/server/auth/schemas";

describe("loginSchema", () => {
  it("accepts a valid email and password", () => {
    const result = loginSchema.safeParse({
      email: "aluno@syscursos.local",
      password: "12345678",
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid input", () => {
    const result = loginSchema.safeParse({
      email: "invalid",
      password: "123",
    });

    expect(result.success).toBe(false);
  });
});
