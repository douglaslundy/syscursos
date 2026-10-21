import { UserRole, UserStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { ActorRole } from "@/server/repositories/admin/shared";
import { upsertStudentAuthUser } from "@/server/repositories/admin/students";

export async function upsertManagedUser(
  organizationId: string,
  actorUserId: string,
  actorRole: ActorRole,
  input: {
    id?: string;
    studentProfileId?: string;
    role: UserRole;
    email: string;
    name: string;
    password: string | null;
    document: string | null;
    phone: string | null;
    status: UserStatus;
    accessExpiresAt?: Date | null;
  },
) {
  if (actorRole !== UserRole.ADMIN) {
    throw new Error("Somente administrador cadastra produtores.");
  }

  const allowedRole = input.role === UserRole.PRODUCER ? UserRole.PRODUCER : UserRole.STUDENT;

  if (allowedRole === UserRole.STUDENT) {
    throw new Error("Administradores nao cadastram alunos neste fluxo.");
  }

  if (input.id) {
    const currentUser = await prisma.user.findFirstOrThrow({
      where: { id: input.id, organizationId },
      select: { authUserId: true },
    });

    const authUserId = await upsertStudentAuthUser({
      authUserId: currentUser.authUserId,
      email: input.email,
      password: input.password,
      name: input.name,
      role: allowedRole,
    });

    return prisma.user.update({
      where: { id: input.id },
      data: {
        email: input.email,
        name: input.name,
        role: allowedRole,
        status: input.status,
        accessExpiresAt: input.accessExpiresAt ?? null,
        authUserId,
      },
    });
  }

  const authUserId = await upsertStudentAuthUser({
    authUserId: null,
    email: input.email,
    password: input.password,
    name: input.name,
    role: allowedRole,
  });

  return prisma.user.create({
    data: {
      organizationId,
      authUserId,
      email: input.email,
      name: input.name,
      role: allowedRole,
      status: input.status,
      accessExpiresAt: input.accessExpiresAt ?? null,
    },
  });
}

export async function updateAdminProfile(
  organizationId: string,
  userId: string,
  name: string,
  role: ActorRole,
  password?: string | null,
) {
  const user = await prisma.user.findFirstOrThrow({
    where: { id: userId, organizationId, role: { in: [UserRole.ADMIN, UserRole.PRODUCER] } },
    select: { authUserId: true, email: true, role: true },
  });

  if (password) {
    await upsertStudentAuthUser({
      authUserId: user.authUserId,
      email: user.email,
      password,
      name,
      role,
    });
  }

  return prisma.user.updateMany({
    where: { id: userId, organizationId, role: { in: [UserRole.ADMIN, UserRole.PRODUCER] } },
    data: { name },
  });
}

export async function listProducerOptions(organizationId: string) {
  return prisma.user.findMany({
    where: {
      organizationId,
      role: UserRole.PRODUCER,
      status: UserStatus.ACTIVE,
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });
}
