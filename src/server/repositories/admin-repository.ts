import {
  CourseStatus,
  EnrollmentStatus,
  LessonStatus,
  ModuleStatus,
  Prisma,
  UserRole,
  UserStatus,
} from "@prisma/client";
import type { SupabaseClient, User } from "@supabase/supabase-js";

import { prisma } from "@/lib/db/prisma";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  CourseInput,
  EnrollmentInput,
  LessonInput,
  ModuleInput,
  RenewEnrollmentInput,
  StudentInput,
} from "@/server/validators/admin";

export type PageResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

type PageArgs = {
  page: number;
  pageSize: number;
  query?: string;
};

type ActorRole = "ADMIN" | "PRODUCER";
type DashboardFilters = {
  producerId?: string | null;
  studentId?: string | null;
};

export class StudentMutationError extends Error {
  constructor(readonly status: string, message: string) {
    super(message);
    this.name = "StudentMutationError";
  }
}

export type StudentLookupResult = {
  studentProfileId: string;
  userId: string;
  email: string;
  name: string;
  document: string | null;
  phone: string | null;
  status: UserStatus;
  alreadyLinked: boolean;
};

export async function getAdminDashboardStats(
  organizationId: string,
  actorUserId: string,
  actorRole: ActorRole,
  filters?: DashboardFilters,
) {
  const courseWhere = scopedCourseWhereWithFilters(organizationId, actorUserId, actorRole, filters);
  const studentWhere = scopedStudentWhereWithFilters(organizationId, actorUserId, actorRole, filters);
  const [courses, students, enrollments, lessons, activeLessons, inactiveLessons, producers] = await prisma.$transaction([
    prisma.course.count({ where: courseWhere }),
    prisma.studentProfile.count({ where: studentWhere }),
    prisma.enrollment.count({
      where: { status: EnrollmentStatus.ACTIVE, course: courseWhere, student: studentWhere },
    }),
    prisma.lesson.count({ where: { module: { course: courseWhere } } }),
    prisma.lesson.count({ where: { status: LessonStatus.ACTIVE, module: { course: courseWhere } } }),
    prisma.lesson.count({ where: { status: LessonStatus.INACTIVE, module: { course: courseWhere } } }),
    prisma.user.count({
      where:
        actorRole === UserRole.ADMIN
          ? { organizationId, role: UserRole.PRODUCER, status: UserStatus.ACTIVE }
          : { id: actorUserId, role: UserRole.PRODUCER, status: UserStatus.ACTIVE },
    }),
  ]);

  const [completedLessons] = await Promise.all([
    prisma.lessonProgress.count({
      where: {
        status: "COMPLETED",
        student: studentWhere,
        lesson: { status: LessonStatus.ACTIVE, module: { course: courseWhere } },
      },
    }),
  ]);

  const pendingLessons = Math.max(0, enrollments * activeLessons - completedLessons);

  return {
    courses,
    students,
    enrollments,
    lessons,
    activeLessons,
    inactiveLessons,
    completedLessons,
    pendingLessons,
    producers,
  };
}

export async function listCourses(
  organizationId: string,
  actorUserId: string,
  actorRole: ActorRole,
  args: PageArgs,
) {
  const courseScope = scopedCourseWhere(organizationId, actorUserId, actorRole);
  const where: Prisma.CourseWhereInput = args.query
    ? {
        ...courseScope,
        OR: [
          { title: { contains: args.query, mode: "insensitive" } },
          { slug: { contains: args.query, mode: "insensitive" } },
        ],
      }
    : courseScope;

  const [items, total] = await prisma.$transaction([
    prisma.course.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      skip: offset(args),
      take: args.pageSize,
      include: {
        _count: {
          select: { modules: true, enrollments: true },
        },
      },
    }),
    prisma.course.count({ where }),
  ]);

  return pageResult(items, total, args);
}

export async function listCourseOptions(
  organizationId: string,
  actorUserId: string,
  actorRole: ActorRole,
) {
  return prisma.course.findMany({
    where: scopedCourseWhere(organizationId, actorUserId, actorRole),
    orderBy: { title: "asc" },
    select: { id: true, title: true },
  });
}

export async function upsertCourse(
  organizationId: string,
  actorUserId: string,
  actorRole: ActorRole,
  input: CourseInput,
) {
  const courseScope = scopedCourseWhere(organizationId, actorUserId, actorRole);
  if (input.id) {
    return prisma.course.updateMany({
      where: { id: input.id, ...courseScope },
      data: {
        title: input.title,
        slug: input.slug,
        description: input.description,
        coverImageUrl: input.coverImageUrl,
        status: input.status,
      },
    });
  }

  return prisma.course.create({
    data: {
      organizationId,
      producerId: actorRole === UserRole.PRODUCER ? actorUserId : actorUserId,
      title: input.title,
      slug: input.slug,
      description: input.description,
      coverImageUrl: input.coverImageUrl,
      status: input.status ?? CourseStatus.ACTIVE,
    },
  });
}

export async function deleteCourse(
  organizationId: string,
  actorUserId: string,
  actorRole: ActorRole,
  id: string,
) {
  return prisma.course.deleteMany({ where: { id, ...scopedCourseWhere(organizationId, actorUserId, actorRole) } });
}

export async function listModules(
  organizationId: string,
  actorUserId: string,
  actorRole: ActorRole,
  courseId: string,
  args: PageArgs,
) {
  const courseScope = scopedCourseWhere(organizationId, actorUserId, actorRole);
  const where: Prisma.ModuleWhereInput = {
    courseId,
    course: courseScope,
    ...(args.query ? { title: { contains: args.query, mode: "insensitive" } } : {}),
  };
  const [course, items, total] = await prisma.$transaction([
    prisma.course.findFirstOrThrow({
      where: { id: courseId, ...courseScope },
      select: { id: true, title: true },
    }),
    prisma.module.findMany({
      where,
      orderBy: [{ position: "asc" }],
      skip: offset(args),
      take: args.pageSize,
      include: { _count: { select: { lessons: true } } },
    }),
    prisma.module.count({ where }),
  ]);

  return { course, modules: pageResult(items, total, args) };
}

export async function findModuleById(
  organizationId: string,
  actorUserId: string,
  actorRole: ActorRole,
  courseId: string,
  moduleId: string,
) {
  return prisma.module.findFirst({
    where: {
      id: moduleId,
      courseId,
      course: scopedCourseWhere(organizationId, actorUserId, actorRole),
    },
    select: {
      id: true,
      title: true,
      description: true,
      position: true,
      status: true,
    },
  });
}

export async function upsertModule(
  organizationId: string,
  actorUserId: string,
  actorRole: ActorRole,
  input: ModuleInput,
) {
  const courseScope = scopedCourseWhere(organizationId, actorUserId, actorRole);
  if (input.id) {
    return prisma.module.updateMany({
      where: { id: input.id, course: courseScope },
      data: {
        title: input.title,
        description: input.description,
        position: input.position,
        status: input.status,
      },
    });
  }

  await prisma.course.findFirstOrThrow({
    where: { id: input.courseId, ...courseScope },
    select: { id: true },
  });

  return prisma.module.create({
    data: {
      courseId: input.courseId,
      title: input.title,
      description: input.description,
      position: input.position,
      status: input.status ?? ModuleStatus.ACTIVE,
    },
  });
}

export async function deleteModule(
  organizationId: string,
  actorUserId: string,
  actorRole: ActorRole,
  id: string,
) {
  return prisma.module.deleteMany({ where: { id, course: scopedCourseWhere(organizationId, actorUserId, actorRole) } });
}

export async function listLessons(
  organizationId: string,
  actorUserId: string,
  actorRole: ActorRole,
  moduleId: string,
  args: PageArgs,
) {
  const courseScope = scopedCourseWhere(organizationId, actorUserId, actorRole);
  const where: Prisma.LessonWhereInput = {
    moduleId,
    module: { course: courseScope },
    ...(args.query ? { title: { contains: args.query, mode: "insensitive" } } : {}),
  };
  const [module, items, total] = await prisma.$transaction([
    prisma.module.findFirstOrThrow({
      where: { id: moduleId, course: courseScope },
      select: { id: true, title: true, courseId: true, course: { select: { title: true } } },
    }),
    prisma.lesson.findMany({
      where,
      orderBy: [{ position: "asc" }],
      skip: offset(args),
      take: args.pageSize,
    }),
    prisma.lesson.count({ where }),
  ]);

  return { module, lessons: pageResult(items, total, args) };
}

export async function upsertLesson(
  organizationId: string,
  actorUserId: string,
  actorRole: ActorRole,
  input: LessonInput,
) {
  const courseScope = scopedCourseWhere(organizationId, actorUserId, actorRole);
  if (input.id) {
    return prisma.lesson.updateMany({
      where: { id: input.id, module: { course: courseScope } },
      data: {
        title: input.title,
        description: input.description,
        youtubeUrl: input.youtubeUrl,
        youtubeVideoId: input.youtubeVideoId,
        coverImageUrl: input.coverImageUrl,
        position: input.position,
        status: input.status,
      },
    });
  }

  await prisma.module.findFirstOrThrow({
    where: { id: input.moduleId, course: courseScope },
    select: { id: true },
  });

  return prisma.lesson.create({
    data: {
      moduleId: input.moduleId,
      title: input.title,
      description: input.description,
      youtubeUrl: input.youtubeUrl,
      youtubeVideoId: input.youtubeVideoId,
      coverImageUrl: input.coverImageUrl,
      position: input.position,
      status: input.status ?? LessonStatus.ACTIVE,
    },
  });
}

export async function deleteLesson(
  organizationId: string,
  actorUserId: string,
  actorRole: ActorRole,
  id: string,
) {
  return prisma.lesson.deleteMany({
    where: { id, module: { course: scopedCourseWhere(organizationId, actorUserId, actorRole) } },
  });
}

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
      user: { organizationId, role: UserRole.STUDENT },
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

export async function listEnrollments(
  organizationId: string,
  actorUserId: string,
  actorRole: ActorRole,
  args: PageArgs,
) {
  const courseWhere = scopedCourseWhere(organizationId, actorUserId, actorRole);
  const studentWhere = scopedStudentWhere(organizationId, actorUserId, actorRole);
  const where: Prisma.EnrollmentWhereInput = args.query
    ? {
        course: courseWhere,
        student: studentWhere,
        OR: [
          { course: { title: { contains: args.query, mode: "insensitive" } } },
          { student: { user: { name: { contains: args.query, mode: "insensitive" } } } },
          { student: { user: { email: { contains: args.query, mode: "insensitive" } } } },
        ],
      }
    : { course: courseWhere, student: studentWhere };

  const [items, total] = await prisma.$transaction([
    prisma.enrollment.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      skip: offset(args),
      take: args.pageSize,
      include: {
        course: true,
        student: { include: { user: true } },
      },
    }),
    prisma.enrollment.count({ where }),
  ]);

  return pageResult(items, total, args);
}

export async function upsertEnrollment(
  organizationId: string,
  actorUserId: string,
  actorRole: ActorRole,
  input: EnrollmentInput,
) {
  const courseWhere = scopedCourseWhere(organizationId, actorUserId, actorRole);

  await prisma.course.findFirstOrThrow({
    where: {
      id: input.courseId,
      ...courseWhere,
    },
    select: { id: true },
  });

  await prisma.studentProfile.findFirstOrThrow({
    where: {
      id: input.studentId,
      ...scopedStudentWhere(organizationId, actorUserId, actorRole),
    },
    select: { id: true },
  });

  if (input.id) {
    return prisma.enrollment.updateMany({
      where: { id: input.id, course: courseWhere },
      data: {
        studentId: input.studentId,
        courseId: input.courseId,
        startsAt: input.startsAt,
        expiresAt: input.expiresAt,
        status: input.status,
      },
    });
  }

  return prisma.enrollment.upsert({
    where: {
      studentId_courseId: {
        studentId: input.studentId,
        courseId: input.courseId,
      },
    },
    update: {
      startsAt: input.startsAt,
      expiresAt: input.expiresAt,
      status: input.status,
    },
    create: {
      studentId: input.studentId,
      courseId: input.courseId,
      startsAt: input.startsAt,
      expiresAt: input.expiresAt,
      status: input.status,
    },
  });
}

export async function renewEnrollment(
  organizationId: string,
  actorUserId: string,
  actorRole: ActorRole,
  input: RenewEnrollmentInput,
) {
  return prisma.enrollment.updateMany({
    where: { id: input.id, course: scopedCourseWhere(organizationId, actorUserId, actorRole) },
    data: {
      expiresAt: input.expiresAt,
      status: EnrollmentStatus.ACTIVE,
    },
  });
}

export async function cancelEnrollment(
  organizationId: string,
  actorUserId: string,
  actorRole: ActorRole,
  id: string,
) {
  return prisma.enrollment.updateMany({
    where: { id, course: scopedCourseWhere(organizationId, actorUserId, actorRole) },
    data: { status: EnrollmentStatus.CANCELED },
  });
}

export async function listCoursesByStudent(
  organizationId: string,
  actorUserId: string,
  actorRole: ActorRole,
  studentId: string,
  args: PageArgs,
) {
  const [student, items, total] = await prisma.$transaction([
    prisma.studentProfile.findFirstOrThrow({
      where: { id: studentId, ...scopedStudentWhere(organizationId, actorUserId, actorRole) },
      include: { user: true },
    }),
    prisma.enrollment.findMany({
      where: { studentId, course: scopedCourseWhere(organizationId, actorUserId, actorRole) },
      orderBy: { createdAt: "desc" },
      skip: offset(args),
      take: args.pageSize,
      include: { course: true },
    }),
    prisma.enrollment.count({
      where: { studentId, course: scopedCourseWhere(organizationId, actorUserId, actorRole) },
    }),
  ]);

  return { student, enrollments: pageResult(items, total, args) };
}

export async function listStudentsByCourse(
  organizationId: string,
  actorUserId: string,
  actorRole: ActorRole,
  courseId: string,
  args: PageArgs,
) {
  const [course, items, total] = await prisma.$transaction([
    prisma.course.findFirstOrThrow({
      where: { id: courseId, ...scopedCourseWhere(organizationId, actorUserId, actorRole) },
    }),
    prisma.enrollment.findMany({
      where: { courseId, course: scopedCourseWhere(organizationId, actorUserId, actorRole) },
      orderBy: { createdAt: "desc" },
      skip: offset(args),
      take: args.pageSize,
      include: { student: { include: { user: true } } },
    }),
    prisma.enrollment.count({
      where: { courseId, course: scopedCourseWhere(organizationId, actorUserId, actorRole) },
    }),
  ]);

  return { course, enrollments: pageResult(items, total, args) };
}

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

export async function getAdminConsumptionMetrics(
  organizationId: string,
  actorUserId: string,
  actorRole: ActorRole,
  filters?: DashboardFilters,
) {
  const producerFilter = actorRole === UserRole.ADMIN ? filters?.producerId ?? null : actorUserId;
  const studentFilter = filters?.studentId ?? null;
  const studentScopeForCourse = producerFilter
    ? Prisma.sql`AND EXISTS (
      SELECT 1
      FROM producer_students ps
      WHERE ps.student_id = s.id
      AND ps.producer_id = ${producerFilter}::uuid
    )`
    : Prisma.sql``;
  const studentScope = actorRole === UserRole.ADMIN
    ? Prisma.sql`u.organization_id = ${organizationId}::uuid AND u.role = 'STUDENT'`
    : Prisma.sql`EXISTS (
      SELECT 1
      FROM producer_students ps_scope
      WHERE ps_scope.student_id = s.id
      AND ps_scope.producer_id = ${actorUserId}::uuid
    )`;

  const rows = await prisma.$queryRaw<
    Array<{
      student_id: string;
      name: string;
      email: string;
      last_login_at: Date | null;
      active_enrollments: bigint;
      total_enrollments: bigint;
      completed_lessons: bigint;
    }>
  >(Prisma.sql`
    SELECT
      s.id AS student_id,
      u.name,
      u.email,
      u.last_login_at,
      COUNT(DISTINCT CASE WHEN e.status = 'ACTIVE' THEN e.id END) AS active_enrollments,
      COUNT(DISTINCT e.id) AS total_enrollments,
      COUNT(DISTINCT lp.lesson_id) AS completed_lessons
    FROM student_profiles s
    INNER JOIN users u ON u.id = s.user_id
    LEFT JOIN enrollments e
      ON e.student_id = s.id
      AND EXISTS (
        SELECT 1
        FROM courses c
        WHERE c.id = e.course_id
          AND c.organization_id = ${organizationId}::uuid
          ${producerFilter ? Prisma.sql`AND c.producer_id = ${producerFilter}::uuid` : Prisma.sql``}
      )
    LEFT JOIN lesson_progress lp
      ON lp.student_id = s.id
      AND lp.status = 'COMPLETED'
      AND EXISTS (
        SELECT 1
        FROM lessons l
        INNER JOIN modules m ON m.id = l.module_id
        INNER JOIN courses c2 ON c2.id = m.course_id
        WHERE l.id = lp.lesson_id
          AND c2.organization_id = ${organizationId}::uuid
          ${producerFilter ? Prisma.sql`AND c2.producer_id = ${producerFilter}::uuid` : Prisma.sql``}
      )
    WHERE
      ${studentScope}
      ${studentScopeForCourse}
      ${studentFilter ? Prisma.sql`AND s.id = ${studentFilter}::uuid` : Prisma.sql``}
    GROUP BY s.id, u.name, u.email, u.last_login_at
    ORDER BY u.name ASC
  `);

  return rows.map((row) => ({
    studentId: row.student_id,
    name: row.name,
    email: row.email,
    lastLoginAt: row.last_login_at,
    activeEnrollments: Number(row.active_enrollments),
    totalEnrollments: Number(row.total_enrollments),
    completedLessons: Number(row.completed_lessons),
  }));
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

function offset(args: PageArgs) {
  return (args.page - 1) * args.pageSize;
}

function pageResult<T>(items: T[], total: number, args: PageArgs): PageResult<T> {
  return {
    items,
    total,
    page: args.page,
    pageSize: args.pageSize,
    pageCount: Math.max(1, Math.ceil(total / args.pageSize)),
  };
}

function scopedCourseWhere(organizationId: string, actorUserId: string, actorRole: ActorRole): Prisma.CourseWhereInput {
  if (actorRole === UserRole.ADMIN) {
    return { organizationId };
  }

  return { organizationId, producerId: actorUserId };
}

function scopedCourseWhereWithFilters(
  organizationId: string,
  actorUserId: string,
  actorRole: ActorRole,
  filters?: DashboardFilters,
): Prisma.CourseWhereInput {
  const producerId = actorRole === UserRole.ADMIN ? filters?.producerId ?? null : actorUserId;

  if (producerId) {
    return { organizationId, producerId };
  }

  return scopedCourseWhere(organizationId, actorUserId, actorRole);
}

function scopedStudentWhere(
  organizationId: string,
  actorUserId: string,
  actorRole: ActorRole,
): Prisma.StudentProfileWhereInput {
  if (actorRole === UserRole.ADMIN) {
    return { user: { organizationId, role: UserRole.STUDENT } };
  }

  return {
    user: { role: UserRole.STUDENT },
    OR: [
      { producers: { some: { producerId: actorUserId } } },
      {
        enrollments: {
          some: {
            course: {
              organizationId,
              producerId: actorUserId,
            },
          },
        },
      },
    ],
  };
}

function scopedStudentWhereWithFilters(
  organizationId: string,
  actorUserId: string,
  actorRole: ActorRole,
  filters?: DashboardFilters,
): Prisma.StudentProfileWhereInput {
  const producerId = actorRole === UserRole.ADMIN ? filters?.producerId ?? null : actorUserId;
  const studentId = filters?.studentId ?? null;

  const baseWhere: Prisma.StudentProfileWhereInput = actorRole === UserRole.ADMIN
    ? producerId
      ? {
          user: { organizationId, role: UserRole.STUDENT },
          OR: [
            { producers: { some: { producerId } } },
            {
              enrollments: {
                some: {
                  course: {
                    organizationId,
                    producerId,
                  },
                },
              },
            },
          ],
        }
      : { user: { organizationId, role: UserRole.STUDENT } }
    : {
        user: { organizationId, role: UserRole.STUDENT },
        OR: [
          { producers: { some: { producerId: actorUserId } } },
          {
            enrollments: {
              some: {
                course: {
                  organizationId,
                  producerId: actorUserId,
                },
              },
            },
          },
        ],
      };

  if (!studentId) {
    return baseWhere;
  }

  return {
    AND: [baseWhere, { id: studentId }],
  };
}

async function upsertStudentAuthUser(input: {
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
