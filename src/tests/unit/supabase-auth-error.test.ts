import { describe, expect, it } from "vitest";

import { isUnauthenticatedAuthError } from "@/lib/supabase/auth-error";

describe("isUnauthenticatedAuthError", () => {
  it("classifies an absent or expired session as unauthenticated", () => {
    expect(
      isUnauthenticatedAuthError({
        name: "AuthSessionMissingError",
        message: "Auth session missing!",
        status: 400,
      }),
    ).toBe(true);
    expect(isUnauthenticatedAuthError({ message: "JWT expired", status: 401 })).toBe(true);
    expect(isUnauthenticatedAuthError({ code: "refresh_token_not_found", status: 400 })).toBe(true);
  });

  it("does not turn Supabase infrastructure failures into logout", () => {
    expect(isUnauthenticatedAuthError({ message: "upstream timeout", status: 504 })).toBe(false);
    expect(isUnauthenticatedAuthError({ message: "database unavailable", status: 500 })).toBe(false);
    expect(isUnauthenticatedAuthError({ message: "Invalid API key", status: 401 })).toBe(false);
    expect(isUnauthenticatedAuthError(new TypeError("fetch failed"))).toBe(false);
  });
});
