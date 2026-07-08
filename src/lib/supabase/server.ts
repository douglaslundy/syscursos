import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getSupabasePublicKey, getSupabaseUrl } from "@/lib/supabase/env";
import type { SupabaseAuthAudience } from "@/lib/supabase/session";
import { getSupabaseCookieOptions } from "@/lib/supabase/session";

export function createSupabaseServerClient(audience: SupabaseAuthAudience = "client") {
  const cookieStore = cookies();

  return createServerClient(
    getSupabaseUrl(),
    getSupabasePublicKey(),
    {
      cookieOptions: getSupabaseCookieOptions(audience),
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components cannot write cookies; middleware refreshes the session.
          }
        },
      },
    },
  );
}
