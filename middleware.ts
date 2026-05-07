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
  let supabase;
  let supabaseUser;

  try {
    supabase = createSupabaseMiddlewareClient(request, response);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    supabaseUser = user;
  } catch (error) {
    console.error("Failed to resolve Supabase middleware session.", error);
    return handleMiddlewareFailure(request, response);
  }

  const user = await resolveAccessContext(
    supabase,
    supabaseUser?.id ?? null,
    supabaseUser?.email ?? null,
  );

  const isLoginPath =
    request.nextUrl.pathname === "/login" ||
    request.nextUrl.pathname === "/login/client" ||
    request.nextUrl.pathname === "/login/admin";

  if (isLoginPath && user?.status === "ACTIVE") {
    return NextResponse.redirect(new URL(getDefaultPathForRole(user.role), request.url));
  }

  const decision = decideRouteAccess(request.nextUrl.pathname, user);

  if (!decision.allowed) {
    return NextResponse.redirect(new URL(decision.redirectTo, request.url));
  }

  return response;
}

function handleMiddlewareFailure(request: NextRequest, response: NextResponse) {
  const isLoginPath =
    request.nextUrl.pathname === "/login" ||
    request.nextUrl.pathname === "/login/client" ||
    request.nextUrl.pathname === "/login/admin";

  if (isLoginPath) {
    return response;
  }

  return NextResponse.redirect(new URL("/login/client?error=server", request.url));
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
  const { data: user, error } = await query.limit(1).maybeSingle();

  if (error) {
    console.error("Failed to resolve middleware access context.", error);
    return null;
  }

  return user;
}

export const config = {
  matcher: ["/login/:path*", "/admin/:path*", "/app/:path*"],
};
