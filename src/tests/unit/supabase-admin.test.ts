import { afterEach, describe, expect, it } from "vitest";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const originalEnvironment = {
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
};

afterEach(() => {
  restoreEnvironmentVariable("SUPABASE_SERVICE_ROLE_KEY", originalEnvironment.serviceRoleKey);
  restoreEnvironmentVariable("NEXT_PUBLIC_SUPABASE_URL", originalEnvironment.supabaseUrl);
});

describe("createSupabaseAdminClient", () => {
  it("rejects a public JWT configured as the service role key", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://supabase.example.com";
    process.env.SUPABASE_SERVICE_ROLE_KEY = testJwt("anon");

    expect(() => createSupabaseAdminClient()).toThrow("must contain a service_role key");
  });

  it("accepts a service_role JWT", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://supabase.example.com";
    process.env.SUPABASE_SERVICE_ROLE_KEY = testJwt("service_role");

    expect(() => createSupabaseAdminClient()).not.toThrow();
  });
});

function testJwt(role: string) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ role })).toString("base64url");
  return `${header}.${payload}.signature`;
}

function restoreEnvironmentVariable(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}
