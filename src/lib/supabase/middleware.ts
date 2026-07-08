import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";

import { getSupabasePublicKey, getSupabaseUrl } from "@/lib/supabase/env";
import type { SupabaseAuthAudience } from "@/lib/supabase/session";
import { getSupabaseCookieOptions } from "@/lib/supabase/session";

export function createSupabaseMiddlewareClient(
  request: NextRequest,
  response: NextResponse,
  audience: SupabaseAuthAudience,
) {
  return createServerClient(
    getSupabaseUrl(),
    getSupabasePublicKey(),
    {
      cookieOptions: getSupabaseCookieOptions(audience),
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );
}
