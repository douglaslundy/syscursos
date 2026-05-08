import { PrismaClient, UserRole, UserStatus } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();

const adminEmail = "douglaslundy@gmail.com";
const adminPassword = "123456Lu";
const producerFallbackEmail = "douglaslundy+producer@gmail.com";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Variaveis NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY sao obrigatorias.");
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function upsertAuthUser(email: string, password: string, role: UserRole, name: string) {
  const supabase = getSupabaseAdmin();

  const users = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });

  if (users.error) {
    throw new Error(`Erro ao listar usuarios auth: ${users.error.message}`);
  }

  const existing = users.data.users.find((item) => item.email?.toLowerCase() === email.toLowerCase());

  if (existing) {
    const updated = await supabase.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: { role, name },
    });

    if (updated.error) {
      throw new Error(`Erro ao atualizar usuario auth ${email}: ${updated.error.message}`);
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

async function main() {
  const org = await prisma.organization.upsert({
    where: { id: "11111111-1111-1111-1111-111111111111" },
    update: { name: "Douglas SysCursos" },
    create: { id: "11111111-1111-1111-1111-111111111111", name: "Douglas SysCursos" },
  });

  const adminAuthUserId = await upsertAuthUser(adminEmail, adminPassword, UserRole.ADMIN, "Douglas Lundy");

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      organizationId: org.id,
      authUserId: adminAuthUserId,
      name: "Douglas Lundy",
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      accessExpiresAt: null,
    },
    create: {
      organizationId: org.id,
      authUserId: adminAuthUserId,
      email: adminEmail,
      name: "Douglas Lundy",
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      accessExpiresAt: null,
    },
  });

  let producer = await prisma.user.findFirst({
    where: { organizationId: org.id, role: UserRole.PRODUCER },
    orderBy: { createdAt: "asc" },
  });

  if (!producer) {
    const producerEmail = producerFallbackEmail;
    const producerAuthUserId = await upsertAuthUser(producerEmail, adminPassword, UserRole.PRODUCER, "Produtor Principal");

    producer = await prisma.user.create({
      data: {
        organizationId: org.id,
        authUserId: producerAuthUserId,
        email: producerEmail,
        name: "Produtor Principal",
        role: UserRole.PRODUCER,
        status: UserStatus.ACTIVE,
        accessExpiresAt: null,
      },
    });
  }

  await prisma.user.updateMany({
    where: { role: UserRole.PRODUCER },
    data: { organizationId: admin.organizationId },
  });

  const producerIds = (
    await prisma.user.findMany({
      where: { organizationId: admin.organizationId, role: UserRole.PRODUCER },
      select: { id: true },
    })
  ).map((item) => item.id);

  const studentProfiles = await prisma.studentProfile.findMany({ select: { id: true } });

  for (const producerId of producerIds) {
    for (const student of studentProfiles) {
      await prisma.producerStudent.upsert({
        where: {
          producerId_studentId: {
            producerId,
            studentId: student.id,
          },
        },
        update: {},
        create: {
          producerId,
          studentId: student.id,
        },
      });
    }

    await prisma.course.updateMany({
      where: { organizationId: admin.organizationId, producerId: producerId },
      data: {},
    });
  }

  if (studentProfiles.length > 0) {
    await prisma.course.updateMany({
      where: { organizationId: admin.organizationId },
      data: { producerId: producer.id },
    });
  }

  console.log("Provisionamento concluido.");
  console.log(`Admin: ${admin.email}`);
  console.log(`Produtor principal: ${producer.email}`);
  console.log(`Produtores vinculados ao admin: ${producerIds.length}`);
  console.log(`Alunos vinculados ao produtor principal: ${studentProfiles.length}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
