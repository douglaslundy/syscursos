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
    // Falha aqui e tecnica (Auth/rede indisponivel), nao prova de sessao invalida.
    // Deixa a requisicao seguir; a pagina protegida valida a sessao de novo via
    // requireAnyRole e mostra uma tela de "tentar novamente" sem forcar logout.
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

export const config = {
  matcher: ["/login/:path*", "/admin/:path*", "/app/:path*"],
};
