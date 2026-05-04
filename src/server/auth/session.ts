import { cache } from "react";

import { prisma } from "@/lib/db/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AuthenticatedUser, AuthResult } from "@/server/auth/types";

export const getCurrentUser = cache(async (): Promise<AuthResult> => {
  const supabase = createSupabaseServerClient();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  if (!supabaseUser) {
    return { ok: false, reason: "UNAUTHENTICATED" };
  }

  const appUser = await prisma.user.findFirst({
    where: {
      OR: [{ authUserId: supabaseUser.id }, { email: supabaseUser.email ?? "" }],
    },
    select: {
      id: true,
      authUserId: true,
      email: true,
      name: true,
      role: true,
      status: true,
      studentProfile: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!appUser) {
    return { ok: false, reason: "USER_NOT_FOUND" };
  }

  if (appUser.status !== "ACTIVE") {
    return { ok: false, reason: "INACTIVE" };
  }

  return {
    ok: true,
    user: {
      id: appUser.id,
      authUserId: appUser.authUserId,
      email: appUser.email,
      name: appUser.name,
      role: appUser.role,
      status: appUser.status,
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
