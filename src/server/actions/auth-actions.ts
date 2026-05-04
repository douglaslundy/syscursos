"use server";

import type { UserRole, UserStatus } from "@prisma/client";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loginSchema } from "@/server/auth/schemas";
import { getDefaultPathForRole } from "@/server/permissions/rbac";

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect("/login?error=invalid_input");
  }

  const supabase = createSupabaseServerClient();
  let authResult;

  try {
    authResult = await supabase.auth.signInWithPassword(parsed.data);
  } catch (error) {
    console.error("Failed to authenticate with Supabase.", error);
    redirect("/login?error=server");
  }

  const { data, error } = authResult;

  if (error || !data.user?.email) {
    redirect("/login?error=invalid_credentials");
  }

  let appUser: { id: string; role: UserRole; status: UserStatus } | null;

  try {
    appUser = await prisma.user.findFirst({
      where: {
        OR: [{ authUserId: data.user.id }, { email: data.user.email }],
      },
      select: {
        id: true,
        role: true,
        status: true,
      },
    });
  } catch (error) {
    console.error("Failed to load application user during login.", error);
    await supabase.auth.signOut();
    redirect("/login?error=server");
  }

  if (!appUser || appUser.status !== "ACTIVE") {
    await supabase.auth.signOut();
    redirect("/login?error=forbidden");
  }

  redirect(getDefaultPathForRole(appUser.role));
}

export async function logoutAction() {
  const supabase = createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
