import { createClient } from "@supabase/supabase-js";

import { getSupabaseUrl } from "@/lib/supabase/env";

export function createSupabaseAdminClient() {
  return createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function getSupabaseServiceRoleKey() {
  const value = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!value) {
    throw new Error("Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY");
  }

  assertServiceRoleKey(value);

  return value;
}

function assertServiceRoleKey(value: string) {
  const [, payload] = value.split(".");

  // Chaves secretas novas do Supabase nao sao JWTs. Quando a chave e um JWT,
  // entretanto, validar o role evita configurar por engano a chave publica no
  // backend e receber falhas identicas em Storage e Auth administrativo.
  if (!payload) {
    return;
  }

  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(Buffer.from(normalized, "base64").toString("utf8")) as {
      role?: unknown;
    };

    if (decoded.role !== "service_role") {
      throw new Error(
        "SUPABASE_SERVICE_ROLE_KEY must contain a service_role key, not a public/anon key",
      );
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("must contain a service_role key")) {
      throw error;
    }

    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not a valid Supabase service role key", {
      cause: error,
    });
  }
}
