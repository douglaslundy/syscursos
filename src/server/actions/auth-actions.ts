"use server";

import type { UserRole, UserStatus } from "@prisma/client";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loginSchema } from "@/server/auth/schemas";
import { getDefaultPathForRole } from "@/server/permissions/rbac";

export async function loginAction(formData: FormData) {
  const audience = parseAudience(formData.get("audience"));
  const loginPath = audience === "admin" ? "/login/admin" : "/login/client";
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect(`${loginPath}?error=invalid_input`);
  }

  const supabase = createSupabaseServerClient();
  let authResult;

  try {
    authResult = await supabase.auth.signInWithPassword(parsed.data);
  } catch (error) {
    console.error("Failed to authenticate with Supabase.", error);
    redirect(`${loginPath}?error=server`);
  }

  const { data, error } = authResult;

  if (error || !data.user?.email) {
    redirect(`${loginPath}?error=invalid_credentials`);
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
    redirect(`${loginPath}?error=server`);
  }

  if (!appUser || appUser.status !== "ACTIVE") {
    await supabase.auth.signOut();
    redirect(`${loginPath}?error=forbidden`);
  }

  if (audience === "admin" && appUser.role !== "ADMIN") {
    await supabase.auth.signOut();
    redirect("/login/admin?error=forbidden");
  }

  if (audience === "client" && appUser.role !== "STUDENT") {
    await supabase.auth.signOut();
    redirect("/login/client?error=forbidden");
  }

  redirect(getDefaultPathForRole(appUser.role));
}

export async function logoutAction() {
  const supabase = createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login/client");
}

function parseAudience(value: FormDataEntryValue | null) {
  return value === "admin" ? "admin" : "client";
}
