"use server";

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
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error || !data.user?.email) {
    redirect("/login?error=invalid_credentials");
  }

  const appUser = await prisma.user.findFirst({
    where: {
      OR: [{ authUserId: data.user.id }, { email: data.user.email }],
    },
    select: {
      id: true,
      role: true,
      status: true,
    },
  });

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
