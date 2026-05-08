import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { CourseStatus, PrismaClient, UserRole, UserStatus } from "@prisma/client";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

const prisma = new PrismaClient();

const ADMIN_EMAIL = "dlsistemas100@gmail.com";
const PRODUCER_EMAIL = "douglaslundy@gmail.com";
const STUDENT_EMAIL = "douglaslundy100@gmail.com";
const DEFAULT_PASSWORD = "085452Lundy";

const TARGET_EMAILS = new Set([ADMIN_EMAIL, PRODUCER_EMAIL, STUDENT_EMAIL]);

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

function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Variaveis NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY sao obrigatorias.");
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function findAuthUserByEmail(supabase: SupabaseClient, email: string): Promise<User | null> {
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 });

    if (error) {
      throw new Error(`Erro ao listar usuarios Auth: ${error.message}`);
    }

    const found = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase()) ?? null;

    if (found) {
      return found;
    }

    if (data.users.length < 100) {
      return null;
    }

    page += 1;
  }
}

async function upsertAuthUser(
  supabase: SupabaseClient,
  email: string,
  password: string,
  role: UserRole,
  name: string,
) {
  const existing = await findAuthUserByEmail(supabase, email);

  if (existing) {
    const updated = await supabase.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: { role, name },
    });

    if (updated.error || !updated.data.user) {
      throw new Error(`Erro ao atualizar usuario auth ${email}: ${updated.error?.message ?? "desconhecido"}`);
    }

    return updated.data.user.id;
  }

  const created = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role, name },
  });

  if (created.error || !created.data.user) {
    throw new Error(`Erro ao criar usuario auth ${email}: ${created.error?.message ?? "desconhecido"}`);
  }

  return created.data.user.id;
}

async function deleteAuthUserById(supabase: SupabaseClient, authUserId: string) {
  const result = await supabase.auth.admin.deleteUser(authUserId);
  if (result.error && !result.error.message.toLowerCase().includes("user not found")) {
    throw new Error(`Erro ao excluir usuario auth ${authUserId}: ${result.error.message}`);
  }
}

async function main() {
  loadLocalEnv();
  const supabase = getSupabaseAdmin();

  const organization = await prisma.organization.upsert({
    where: { id: "11111111-1111-1111-1111-111111111111" },
    update: { name: "SysCursos Default Tenant" },
    create: { id: "11111111-1111-1111-1111-111111111111", name: "SysCursos Default Tenant" },
  });

  const adminAuthId = await upsertAuthUser(
    supabase,
    ADMIN_EMAIL,
    DEFAULT_PASSWORD,
    UserRole.ADMIN,
    "Administrador Principal",
  );
  const producerAuthId = await upsertAuthUser(
    supabase,
    PRODUCER_EMAIL,
    DEFAULT_PASSWORD,
    UserRole.PRODUCER,
    "Produtor Principal",
  );
  const studentAuthId = await upsertAuthUser(
    supabase,
    STUDENT_EMAIL,
    DEFAULT_PASSWORD,
    UserRole.STUDENT,
    "Aluno Principal",
  );

  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      organizationId: organization.id,
      authUserId: adminAuthId,
      name: "Administrador Principal",
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      accessExpiresAt: null,
    },
    create: {
      organizationId: organization.id,
      authUserId: adminAuthId,
      email: ADMIN_EMAIL,
      name: "Administrador Principal",
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      accessExpiresAt: null,
    },
  });

  const producer = await prisma.user.upsert({
    where: { email: PRODUCER_EMAIL },
    update: {
      organizationId: organization.id,
      authUserId: producerAuthId,
      name: "Produtor Principal",
      role: UserRole.PRODUCER,
      status: UserStatus.ACTIVE,
      accessExpiresAt: null,
    },
    create: {
      organizationId: organization.id,
      authUserId: producerAuthId,
      email: PRODUCER_EMAIL,
      name: "Produtor Principal",
      role: UserRole.PRODUCER,
      status: UserStatus.ACTIVE,
      accessExpiresAt: null,
    },
  });

  const studentUser = await prisma.user.upsert({
    where: { email: STUDENT_EMAIL },
    update: {
      organizationId: organization.id,
      authUserId: studentAuthId,
      name: "Aluno Principal",
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      accessExpiresAt: null,
    },
    create: {
      organizationId: organization.id,
      authUserId: studentAuthId,
      email: STUDENT_EMAIL,
      name: "Aluno Principal",
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      accessExpiresAt: null,
    },
  });

  const studentProfile = await prisma.studentProfile.upsert({
    where: { userId: studentUser.id },
    update: {},
    create: { userId: studentUser.id },
  });

  await prisma.course.updateMany({
    where: { status: CourseStatus.ACTIVE },
    data: { producerId: producer.id, organizationId: organization.id },
  });

  const allProfiles = await prisma.studentProfile.findMany({
    select: { id: true },
  });
  const oldProfileIds = allProfiles.filter((profile) => profile.id !== studentProfile.id).map((profile) => profile.id);

  const oldEnrollments = await prisma.enrollment.findMany({
    where: { studentId: { in: oldProfileIds } },
    orderBy: { createdAt: "asc" },
  });

  for (const enrollment of oldEnrollments) {
    await prisma.enrollment.upsert({
      where: {
        studentId_courseId: {
          studentId: studentProfile.id,
          courseId: enrollment.courseId,
        },
      },
      update: {
        status: enrollment.status,
        startsAt: enrollment.startsAt,
        expiresAt: enrollment.expiresAt,
      },
      create: {
        studentId: studentProfile.id,
        courseId: enrollment.courseId,
        status: enrollment.status,
        startsAt: enrollment.startsAt,
        expiresAt: enrollment.expiresAt,
      },
    });
  }

  await prisma.producerStudent.deleteMany({});
  await prisma.producerStudent.create({
    data: {
      producerId: producer.id,
      studentId: studentProfile.id,
    },
  });

  await prisma.studentProfile.deleteMany({
    where: {
      userId: {
        not: studentUser.id,
      },
    },
  });

  const existingUsers = await prisma.user.findMany({
    select: { id: true, email: true, authUserId: true },
  });

  const removableUsers = existingUsers.filter((user) => !TARGET_EMAILS.has(user.email.toLowerCase()));

  if (removableUsers.length > 0) {
    await prisma.user.deleteMany({
      where: {
        id: {
          in: removableUsers.map((user) => user.id),
        },
      },
    });
  }

  const removableAuthIds = removableUsers
    .map((user) => user.authUserId)
    .filter((authUserId): authUserId is string => Boolean(authUserId));

  for (const authUserId of removableAuthIds) {
    await deleteAuthUserById(supabase, authUserId);
  }

  console.log("Provisionamento concluido.");
  console.log(`Admin: ${admin.email}`);
  console.log(`Produtor: ${producer.email}`);
  console.log(`Aluno: ${studentUser.email}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
