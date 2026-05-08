import { cache } from "react";

import { prisma } from "@/lib/db/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { withDbRetry } from "@/server/db/retry";
import type { AuthenticatedUser, AuthResult } from "@/server/auth/types";

export const getCurrentUser = cache(async (): Promise<AuthResult> => {
  const supabase = createSupabaseServerClient();
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
    appUser = await withDbRetry(() =>
      prisma.user.findFirst({
        where: {
          OR: [{ authUserId: supabaseUser.id }, { email: supabaseUser.email ?? "" }],
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
    );
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
