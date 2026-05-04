import type { UserRole, UserStatus } from "@prisma/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware";
import { decideRouteAccess, getDefaultPathForRole } from "@/server/permissions/rbac";

type UserAccessContext = {
  role: UserRole;
  status: UserStatus;
} | null;

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request,
  });
  const supabase = createSupabaseMiddlewareClient(request, response);
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  const user = await resolveAccessContext(
    supabase,
    supabaseUser?.id ?? null,
    supabaseUser?.email ?? null,
  );

  if (request.nextUrl.pathname === "/login" && user?.status === "ACTIVE") {
    return NextResponse.redirect(new URL(getDefaultPathForRole(user.role), request.url));
  }

  const decision = decideRouteAccess(request.nextUrl.pathname, user);

  if (!decision.allowed) {
    return NextResponse.redirect(new URL(decision.redirectTo, request.url));
  }

  return response;
}

async function resolveAccessContext(
  supabase: SupabaseClient,
  authUserId: string | null,
  email: string | null,
): Promise<UserAccessContext> {
  if (!authUserId && !email) {
    return null;
  }

  const query = authUserId
    ? supabase.from("users").select("role,status").eq("auth_user_id", authUserId)
    : supabase
        .from("users")
        .select("role,status")
        .eq("email", email ?? "");
  const { data: user } = await query.limit(1).maybeSingle();

  return user;
}

export const config = {
  matcher: ["/login", "/admin/:path*", "/app/:path*"],
};
