import { randomBytes } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { PrismaClient, UserRole } from "@prisma/client";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

type ProvisionTarget = {
  email: string;
  password: string;
  passwordGenerated: boolean;
  role: UserRole;
};

const prisma = new PrismaClient();

async function main() {
  loadLocalEnv();

  const supabase = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  const organization = await prisma.organization.upsert({
    where: { id: "11111111-1111-1111-1111-111111111111" },
    update: { name: "SysCursos Tenant Demo" },
    create: { id: "11111111-1111-1111-1111-111111111111", name: "SysCursos Tenant Demo" },
  });

  const targets: ProvisionTarget[] = [
    {
      email: process.env.ADMIN_EMAIL || "admin@syscursos.local",
      ...passwordFromEnv("ADMIN_INITIAL_PASSWORD"),
      role: UserRole.ADMIN,
    },
    {
      email: process.env.STUDENT_EMAIL || "aluno@syscursos.local",
      ...passwordFromEnv("STUDENT_INITIAL_PASSWORD"),
      role: UserRole.STUDENT,
    },
  ];

  for (const target of targets) {
    const authUser = await upsertAuthUser(supabase, target.email, target.password);

    const appUser = await prisma.user.upsert({
      where: { email: target.email },
      create: {
        organizationId: organization.id,
        authUserId: authUser.id,
        email: target.email,
        name: target.role === UserRole.ADMIN ? "Admin SysCursos" : "Aluno Demonstracao",
        role: target.role,
        status: "ACTIVE",
      },
      update: {
        organizationId: organization.id,
        authUserId: authUser.id,
        name: target.role === UserRole.ADMIN ? "Admin SysCursos" : "Aluno Demonstracao",
        role: target.role,
        status: "ACTIVE",
      },
    });

    if (target.role === UserRole.STUDENT) {
      await prisma.studentProfile.upsert({
        where: { userId: appUser.id },
        update: {},
        create: { userId: appUser.id },
      });
    }

    console.log(
      `${target.role}: ${target.email} vinculado ao auth_user_id ${authUser.id}${
        target.passwordGenerated ? ` | senha gerada: ${target.password}` : ""
      }`,
    );
  }
}

async function upsertAuthUser(supabase: SupabaseClient, email: string, password: string) {
  const existing = await findAuthUserByEmail(supabase, email);

  if (existing) {
    const { data, error } = await supabase.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: {
        provisioned_by: "syscursos",
      },
    });

    if (error) {
      throw new Error(`Erro ao atualizar usuario Auth ${email}: ${error.message}`);
    }

    return data.user;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      provisioned_by: "syscursos",
    },
  });

  if (error) {
    throw new Error(`Erro ao criar usuario Auth ${email}: ${error.message}`);
  }

  return data.user;
}

async function findAuthUserByEmail(supabase: SupabaseClient, email: string): Promise<User | null> {
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 100,
    });

    if (error) {
      throw new Error(`Erro ao listar usuarios Auth: ${error.message}`);
    }

    const user = data.users.find((candidate) => candidate.email === email);

    if (user) {
      return user;
    }

    if (data.users.length < 100) {
      return null;
    }

    page += 1;
  }
}

function loadLocalEnv() {
  const envPath = resolve(process.cwd(), ".env");

  if (!existsSync(envPath)) {
    return;
  }

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^["']|["']$/g, "");

    process.env[key] ??= value;
  }
}

function passwordFromEnv(name: "ADMIN_INITIAL_PASSWORD" | "STUDENT_INITIAL_PASSWORD") {
  const password = process.env[name];

  if (password) {
    return {
      password,
      passwordGenerated: false,
    };
  }

  return {
    password: randomBytes(18).toString("base64url"),
    passwordGenerated: true,
  };
}

function requireEnv(
  name: "NEXT_PUBLIC_SUPABASE_URL" | "SUPABASE_SERVICE_ROLE_KEY" | "DATABASE_URL",
) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Variavel obrigatoria ausente: ${name}`);
  }

  return value;
}

main()
  .catch((error: unknown) => {
    console.error("Erro ao provisionar usuarios Auth:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
