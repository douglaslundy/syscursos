import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware";
import { getSupabaseAudienceForPath } from "@/lib/supabase/session";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request,
  });
  const audience = getSupabaseAudienceForPath(request.nextUrl.pathname);

  try {
    const supabase = createSupabaseMiddlewareClient(request, response, audience);
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session && isProtectedPath(request.nextUrl.pathname)) {
      return redirectToLogin(request);
    }
  } catch (error) {
    console.error("Failed to resolve Supabase middleware session.", error);
    return handleMiddlewareFailure(request, response);
  }

  return response;
}

function isProtectedPath(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/") || pathname === "/app" || pathname.startsWith("/app/");
}

function redirectToLogin(request: NextRequest) {
  const loginPath = request.nextUrl.pathname.startsWith("/admin") ? "/login/admin" : "/login/client";
  const url = new URL(loginPath, request.url);
  url.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

function handleMiddlewareFailure(request: NextRequest, response: NextResponse) {
  if (!isProtectedPath(request.nextUrl.pathname)) {
    return response;
  }

  const loginPath = request.nextUrl.pathname.startsWith("/admin") ? "/login/admin" : "/login/client";
  return NextResponse.redirect(new URL(`${loginPath}?error=server`, request.url));
}

export const config = {
  matcher: ["/login/:path*", "/admin/:path*", "/app/:path*"],
};
