import { Prisma, UserRole, UserStatus } from "@prisma/client";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { prisma } from "@/lib/db/prisma";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { StudentInput } from "@/server/validators/admin";
import { PageArgs, ActorRole, StudentMutationError, StudentLookupResult, offset, pageResult, scopedStudentWhere } from "@/server/repositories/admin/shared";

export async function listStudents(
  organizationId: string,
  actorUserId: string,
  actorRole: ActorRole,
  args: PageArgs,
) {
  const where: Prisma.StudentProfileWhereInput = args.query
    ? {
        AND: [
          scopedStudentWhere(organizationId, actorUserId, actorRole),
          {
            user: {
              OR: [
                { name: { contains: args.query, mode: "insensitive" } },
                { email: { contains: args.query, mode: "insensitive" } },
              ],
            },
          },
        ],
      }
    : scopedStudentWhere(organizationId, actorUserId, actorRole);

  const [items, total] = await prisma.$transaction([
    prisma.studentProfile.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: offset(args),
      take: args.pageSize,
      include: {
        user: true,
        _count: { select: { enrollments: true } },
      },
    }),
    prisma.studentProfile.count({ where }),
  ]);

  return pageResult(items, total, args);
}

export async function findStudentByUserId(
  organizationId: string,
  actorUserId: string,
  actorRole: ActorRole,
  userId: string,
) {
  return prisma.studentProfile.findFirst({
    where: {
      userId,
      ...scopedStudentWhere(organizationId, actorUserId, actorRole),
    },
    include: {
      user: true,
    },
  });
}

export async function findStudentByEmailForProducer(
  organizationId: string,
  actorUserId: string,
  actorRole: ActorRole,
  email: string,
): Promise<StudentLookupResult | null> {
  if (actorRole !== UserRole.PRODUCER) {
    throw new Error("Apenas produtores podem consultar alunos por e-mail.");
  }

  const student = await prisma.studentProfile.findFirst({
    where: {
      user: {
        role: UserRole.STUDENT,
        email,
      },
    },
    select: {
      id: true,
      document: true,
      phone: true,
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          status: true,
        },
      },
      producers: {
        where: { producerId: actorUserId },
        select: { id: true },
      },
    },
  });

  if (!student) {
    return null;
  }

  return {
    studentProfileId: student.id,
    userId: student.user.id,
    email: student.user.email,
    name: student.user.name,
    document: student.document,
    phone: student.phone,
    status: student.user.status,
    alreadyLinked: student.producers.length > 0,
  };
}

export async function listStudentOptions(
  organizationId: string,
  actorUserId: string,
  actorRole: ActorRole,
) {
  return prisma.studentProfile.findMany({
    where: scopedStudentWhere(organizationId, actorUserId, actorRole),
    orderBy: { user: { name: "asc" } },
    select: {
      id: true,
      user: { select: { name: true, email: true } },
    },
  });
}

export async function upsertStudent(
  organizationId: string,
  actorUserId: string,
  actorRole: ActorRole,
  input: StudentInput,
) {
  if (actorRole === UserRole.ADMIN) {
    throw new Error("Apenas produtores cadastram alunos.");
  }

  if (input.id && input.studentProfileId) {
    const currentProfile = await prisma.studentProfile.findFirst({
      where: {
        id: input.studentProfileId,
        userId: input.id,
        ...scopedStudentWhere(organizationId, actorUserId, actorRole),
      },
      select: {
        id: true,
        user: {
          select: { authUserId: true },
        },
        producers: {
          where: { producerId: actorUserId },
          select: { id: true },
        },
      },
    });

    if (!currentProfile) {
      throw new StudentMutationError(
        "student_not_found",
        "Aluno nao encontrado para este produtor ou identificadores de edicao inconsistentes.",
      );
    }

    if (currentProfile.producers.length === 0) {
      await prisma.producerStudent.upsert({
        where: {
          producerId_studentId: {
            producerId: actorUserId,
            studentId: currentProfile.id,
          },
        },
        update: {},
        create: {
          producerId: actorUserId,
          studentId: currentProfile.id,
        },
      });
    }

    const authUserId = await upsertStudentAuthUser({
      authUserId: currentProfile.user.authUserId,
      email: input.email,
      password: input.password,
      name: input.name,
    });

    return prisma.user.update({
      where: { id: input.id },
      data: {
        authUserId,
        email: input.email,
        name: input.name,
        status: input.status,
        studentProfile: {
          update: {
            document: input.document,
            phone: input.phone,
          },
        },
      },
    });
  }

  const existingStudent = await prisma.studentProfile.findFirst({
    where: {
      user: {
        organizationId,
        role: UserRole.STUDENT,
        OR: [{ email: input.email }, ...(input.document ? [{ studentProfile: { document: input.document } }] : [])],
      },
    },
    include: { user: true },
  });

  if (existingStudent) {
    const existingLink = await prisma.producerStudent.findUnique({
      where: {
        producerId_studentId: {
          producerId: actorUserId,
          studentId: existingStudent.id,
        },
      },
      select: { id: true },
    });

    if (existingLink) {
      throw new StudentMutationError("student_already_linked", "Este aluno ja esta vinculado a este produtor.");
    }

    await prisma.producerStudent.upsert({
      where: {
        producerId_studentId: {
          producerId: actorUserId,
          studentId: existingStudent.id,
        },
      },
      update: {},
      create: {
        producerId: actorUserId,
        studentId: existingStudent.id,
      },
    });

    return { linkedExisting: true };
  }

  const supabase = createSupabaseAdminClient();
  const existingAuthUser = await findAuthUserByEmail(supabase, input.email);

  if (existingAuthUser) {
    const existingStudentByAuth = await prisma.studentProfile.findFirst({
      where: {
        user: {
          organizationId,
          role: UserRole.STUDENT,
          authUserId: existingAuthUser.id,
        },
      },
      select: { id: true },
    });

    if (existingStudentByAuth) {
      const existingLink = await prisma.producerStudent.findUnique({
        where: {
          producerId_studentId: {
            producerId: actorUserId,
            studentId: existingStudentByAuth.id,
          },
        },
        select: { id: true },
      });

      if (existingLink) {
        throw new StudentMutationError("student_already_linked", "Este aluno ja esta vinculado a este produtor.");
      }

      await prisma.producerStudent.upsert({
        where: {
          producerId_studentId: {
            producerId: actorUserId,
            studentId: existingStudentByAuth.id,
          },
        },
        update: {},
        create: {
          producerId: actorUserId,
          studentId: existingStudentByAuth.id,
        },
      });

      return { linkedExisting: true };
    }
  }

  const authUserId = await upsertStudentAuthUser({
    authUserId: null,
    email: input.email,
    password: input.password,
    name: input.name,
    existingAuthUserId: existingAuthUser?.id ?? null,
  });

  const created = await prisma.user.create({
    data: {
      organizationId,
      authUserId,
      email: input.email,
      name: input.name,
      role: UserRole.STUDENT,
      status: input.status ?? UserStatus.ACTIVE,
      studentProfile: {
        create: {
          document: input.document,
          phone: input.phone,
        },
      },
    },
    include: { studentProfile: true },
  });

  if (created.studentProfile) {
    await prisma.producerStudent.create({
      data: {
        producerId: actorUserId,
        studentId: created.studentProfile.id,
      },
    });
  }

  return { linkedExisting: false };
}

export async function linkStudentToProducer(
  organizationId: string,
  actorUserId: string,
  actorRole: ActorRole,
  studentProfileId: string,
) {
  if (actorRole !== UserRole.PRODUCER) {
    throw new Error("Apenas produtores podem vincular alunos.");
  }

  const student = await prisma.studentProfile.findFirst({
    where: {
      id: studentProfileId,
      user: {
        role: UserRole.STUDENT,
      },
    },
    select: { id: true },
  });

  if (!student) {
    throw new StudentMutationError("student_not_found", "Aluno nao encontrado para este produtor.");
  }

  const existingLink = await prisma.producerStudent.findUnique({
    where: {
      producerId_studentId: {
        producerId: actorUserId,
        studentId: student.id,
      },
    },
    select: { id: true },
  });

  if (existingLink) {
    throw new StudentMutationError("student_already_linked", "Este aluno ja esta vinculado a este produtor.");
  }

  return prisma.producerStudent.create({
    data: {
      producerId: actorUserId,
      studentId: student.id,
    },
  });
}

export async function deleteStudent(
  organizationId: string,
  actorUserId: string,
  actorRole: ActorRole,
  userId: string,
) {
  if (actorRole === UserRole.ADMIN) {
    throw new Error("Apenas produtores removem vinculo de alunos.");
  }

  const profile = await prisma.studentProfile.findFirst({
    where: {
      userId,
      user: { role: UserRole.STUDENT },
    },
    select: { id: true },
  });

  if (!profile) {
    throw new StudentMutationError(
      "student_not_found",
      "Aluno nao encontrado para este produtor.",
    );
  }

  const deleted = await prisma.producerStudent.deleteMany({
    where: {
      producerId: actorUserId,
      studentId: profile.id,
    },
  });

  if (deleted.count === 0) {
    throw new StudentMutationError("student_not_found", "Aluno nao encontrado para este produtor.");
  }

  return deleted;
}

export async function deleteStudentHard(organizationId: string, userId: string) {
  const user = await prisma.user.findFirst({
    where: { id: userId, organizationId, role: UserRole.STUDENT },
    select: { authUserId: true },
  });
  const deletedUser = await prisma.user.deleteMany({
    where: { id: userId, organizationId, role: UserRole.STUDENT },
  });

  if (user?.authUserId) {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.auth.admin.deleteUser(user.authUserId);

    if (error) {
      console.error("Failed to delete Supabase Auth student user.", error);
    }
  }

  return deletedUser;
}

export async function upsertStudentAuthUser(input: {
  authUserId: string | null;
  email: string;
  password: string | null;
  name: string;
  role?: UserRole;
  existingAuthUserId?: string | null;
}) {
  const supabase = createSupabaseAdminClient();

  if (input.authUserId) {
    const { data, error } = await supabase.auth.admin.updateUserById(input.authUserId, {
      email: input.email,
      ...(input.password ? { password: input.password } : {}),
      email_confirm: true,
      user_metadata: {
        name: input.name,
        role: input.role ?? UserRole.STUDENT,
      },
    });

    if (error) {
      throw new Error(`Erro ao atualizar acesso do aluno: ${error.message}`);
    }

    return data.user.id;
  }

  const existing = input.existingAuthUserId
    ? { id: input.existingAuthUserId }
    : await findAuthUserByEmail(supabase, input.email);

  if (existing) {
    const { data, error } = await supabase.auth.admin.updateUserById(existing.id, {
      ...(input.password ? { password: input.password } : {}),
      email_confirm: true,
      user_metadata: {
        name: input.name,
        role: input.role ?? UserRole.STUDENT,
      },
    });

    if (error) {
      throw new Error(`Erro ao atualizar acesso existente do aluno: ${error.message}`);
    }

    return data.user.id;
  }

  const generatedPassword = input.password ?? `${crypto.randomUUID()}Aa1!`;

  const { data, error } = await supabase.auth.admin.createUser({
    email: input.email,
    password: generatedPassword,
    email_confirm: true,
    user_metadata: {
      name: input.name,
      role: input.role ?? UserRole.STUDENT,
    },
  });

  if (error) {
    throw new Error(`Erro ao criar acesso do aluno: ${error.message}`);
  }

  return data.user.id;
}

export async function findAuthUserByEmail(supabase: SupabaseClient, email: string): Promise<User | null> {
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
