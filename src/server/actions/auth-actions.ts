"use server";

import { UserRole, UserStatus } from "@prisma/client";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db/prisma";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loginSchema, registerSchema } from "@/server/auth/schemas";
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

  let appUser: {
    id: string;
    role: UserRole;
    status: UserStatus;
    accessExpiresAt: Date | null;
  } | null;

  try {
    appUser = await prisma.user.findFirst({
      where: {
        OR: [{ authUserId: data.user.id }, { email: data.user.email }],
      },
      select: {
        id: true,
        role: true,
        status: true,
        accessExpiresAt: true,
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

  if (appUser.accessExpiresAt && appUser.accessExpiresAt <= new Date()) {
    await supabase.auth.signOut();
    redirect(`${loginPath}?error=inactive`);
  }

  await prisma.user.updateMany({
    where: { id: appUser.id },
    data: { lastLoginAt: new Date() },
  });

  if (audience === "admin" && appUser.role !== "ADMIN" && appUser.role !== "PRODUCER") {
    await supabase.auth.signOut();
    redirect("/login/admin?error=forbidden");
  }

  if (audience === "client") {
    redirect("/app");
  }

  redirect(getDefaultPathForRole(appUser.role));
}

export async function logoutAction() {
  const supabase = createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login/client");
}

export async function registerAction(formData: FormData) {
  const audience = parseAudience(formData.get("audience"));
  const role = audience === "admin" ? UserRole.PRODUCER : UserRole.STUDENT;
  const registerPath = audience === "admin" ? "/login/admin/register" : "/login/client/register";

  if (audience === "admin") {
    redirect("/login/admin?error=forbidden");
  }

  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    document: formData.get("document"),
  });

  if (!parsed.success) {
    redirect(`${registerPath}?error=invalid_input`);
  }

  const supabaseAdmin = createSupabaseAdminClient();
  const authResult = await supabaseAdmin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: {
      name: parsed.data.name,
      role,
    },
  });

  if (authResult.error || !authResult.data.user?.id) {
    redirect(`${registerPath}?error=conflict`);
  }

  const authUserId = authResult.data.user.id;

  try {
    const organization = await prisma.organization.create({
      data: {
        name: `Organizacao ${parsed.data.name}`,
      },
      select: { id: true },
    });

    await prisma.user.create({
      data: {
        organizationId: organization.id,
        authUserId,
        email: parsed.data.email,
        name: parsed.data.name,
        role,
        status: UserStatus.ACTIVE,
        ...(role === UserRole.STUDENT
          ? {
              studentProfile: {
                create: {
                  document: parsed.data.document,
                },
              },
            }
          : {}),
      },
    });
  } catch (error) {
    await supabaseAdmin.auth.admin.deleteUser(authUserId);
    console.error("Failed to persist newly registered user.", error);
    redirect(`${registerPath}?error=server`);
  }

  const supabase = createSupabaseServerClient();
  const signIn = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (signIn.error) {
    redirect("/login/client?error=invalid_credentials");
  }

  redirect(getDefaultPathForRole(role));
}

function parseAudience(value: FormDataEntryValue | null) {
  return value === "admin" ? "admin" : "client";
}
