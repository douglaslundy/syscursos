import { afterEach, describe, expect, it } from "vitest";

import { getSupabasePublicKey, getSupabaseUrl } from "@/lib/supabase/env";

const originalEnv = process.env;

describe("Supabase environment helpers", () => {
  afterEach(() => {
    process.env = originalEnv;
  });

  it("uses the anon key when it is configured", () => {
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publishable-key",
    };

    expect(getSupabasePublicKey()).toBe("anon-key");
  });

  it("falls back to the publishable key", () => {
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: undefined,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publishable-key",
    };

    expect(getSupabasePublicKey()).toBe("publishable-key");
  });

  it("requires the Supabase URL", () => {
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: undefined,
    };

    expect(() => getSupabaseUrl()).toThrow("NEXT_PUBLIC_SUPABASE_URL");
  });
});
