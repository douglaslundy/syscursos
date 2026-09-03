import { revalidateTag, unstable_cache } from "next/cache";
import { cache } from "react";

import { prisma } from "@/lib/db/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SupabaseAuthAudience } from "@/lib/supabase/session";
import { withDbRetry } from "@/server/db/retry";
import type { AuthenticatedUser, AuthResult } from "@/server/auth/types";

const AUTH_USER_CACHE_TAG = "app-user";

// O registro do usuario no banco muda pouco (nome, status, expiracao). Cachear
// por identidade evita uma consulta ao banco em cada render de pagina/layout de
// area protegida; as acoes de perfil chamam revalidateAuthUser depois de gravar.
function loadAppUserByIdentity(authUserId: string, email: string) {
  return unstable_cache(
    () =>
      withDbRetry(() =>
        prisma.user.findFirst({
          where: {
            OR: [{ authUserId }, { email }],
          },
          select: {
            id: true,
            organizationId: true,
            authUserId: true,
            email: true,
            name: true,
            role: true,
            status: true,
            accessExpiresAt: true,
            lastLoginAt: true,
            studentProfile: {
              select: {
                id: true,
              },
            },
          },
        }),
      ),
    ["app-user", authUserId, email],
    { tags: [AUTH_USER_CACHE_TAG, `${AUTH_USER_CACHE_TAG}:${authUserId}`], revalidate: 120 },
  )();
}

export function revalidateAuthUser() {
  revalidateTag(AUTH_USER_CACHE_TAG);
}

export const getCurrentUser = cache(async (audience: SupabaseAuthAudience = "client"): Promise<AuthResult> => {
  const supabase = createSupabaseServerClient(audience);
  let supabaseUser;

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    supabaseUser = user;
  } catch (error) {
    console.error("Failed to load Supabase user session.", error);
    return { ok: false, reason: "SERVER_ERROR" };
  }

  if (!supabaseUser) {
    return { ok: false, reason: "UNAUTHENTICATED" };
  }

  let appUser;

  try {
    appUser = await loadAppUserByIdentity(supabaseUser.id, supabaseUser.email ?? "");
  } catch (error) {
    console.error("Failed to load application user session.", error);
    return { ok: false, reason: "SERVER_ERROR" };
  }

  if (!appUser) {
    return { ok: false, reason: "USER_NOT_FOUND" };
  }

  if (appUser.status !== "ACTIVE") {
    return { ok: false, reason: "INACTIVE" };
  }

  if (appUser.accessExpiresAt && appUser.accessExpiresAt <= new Date()) {
    return { ok: false, reason: "INACTIVE" };
  }

  return {
    ok: true,
    user: {
      id: appUser.id,
      organizationId: appUser.organizationId,
      authUserId: appUser.authUserId,
      email: appUser.email,
      name: appUser.name,
      role: appUser.role,
      status: appUser.status,
      accessExpiresAt: appUser.accessExpiresAt,
      lastLoginAt: appUser.lastLoginAt,
      studentProfileId: appUser.studentProfile?.id ?? null,
    },
  };
});

export async function requireCurrentUser(): Promise<AuthenticatedUser> {
  const result = await getCurrentUser();

  if (!result.ok) {
    throw new Error(`Authentication required: ${result.reason}`);
  }

  return result.user;
}
