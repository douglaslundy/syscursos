import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabasePublicKey, getSupabaseUrl } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export async function GET() {
  const url = getSupabaseUrl();
  const key = getSupabasePublicKey();

  const supabase = createSupabaseServerClient("client");

  let authResult: Record<string, unknown>;
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: "douglaslundy100@gmail.com",
      password: "12345678",
    });
    authResult = {
      hasUser: Boolean(data.user),
      userEmail: data.user?.email ?? null,
      error: error
        ? { message: error.message, status: error.status, code: error.code, name: error.name }
        : null,
    };
  } catch (err) {
    const e = err as Error;
    authResult = { thrown: true, name: e.name, message: e.message, stack: e.stack };
  }

  return Response.json({
    supabaseUrl: url,
    supabaseKeyPreview: `${key.slice(0, 20)}...${key.slice(-15)}`,
    supabaseKeyLength: key.length,
    authResult,
  });
}
