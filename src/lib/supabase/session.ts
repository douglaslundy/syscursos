export type SupabaseAuthAudience = "admin" | "client";

const FIFTEEN_DAYS_IN_SECONDS = 15 * 24 * 60 * 60;

const cookieNames: Record<SupabaseAuthAudience, string> = {
  admin: "syscursos-admin-auth",
  client: "syscursos-client-auth",
};

export function getSupabaseCookieOptions(audience: SupabaseAuthAudience) {
  return {
    name: cookieNames[audience],
    path: "/",
    sameSite: "lax" as const,
    maxAge: FIFTEEN_DAYS_IN_SECONDS,
  };
}

export function getSupabaseAudienceForPath(pathname: string): SupabaseAuthAudience {
  return pathname === "/admin" || pathname.startsWith("/admin/") || pathname.startsWith("/login/admin")
    ? "admin"
    : "client";
}
