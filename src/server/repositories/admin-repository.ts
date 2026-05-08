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

export async function getAdminDashboardStats(organizationId: string) {
  const [courses, students, enrollments, lessons] = await prisma.$transaction([
    prisma.course.count({ where: { organizationId } }),
    prisma.studentProfile.count({ where: { user: { organizationId } } }),
    prisma.enrollment.count({
      where: { status: EnrollmentStatus.ACTIVE, course: { organizationId } },
    }),
    prisma.lesson.count({ where: { module: { course: { organizationId } } } }),
  ]);

  return { courses, students, enrollments, lessons };
}

export async function listCourses(organizationId: string, args: PageArgs) {
  const where: Prisma.CourseWhereInput = args.query
    ? {
        organizationId,
        OR: [
          { title: { contains: args.query, mode: "insensitive" } },
          { slug: { contains: args.query, mode: "insensitive" } },
        ],
      }
    : { organizationId };

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

export async function listCourseOptions(organizationId: string) {
  return prisma.course.findMany({
    where: { organizationId },
    orderBy: { title: "asc" },
    select: { id: true, title: true },
  });
}

export async function upsertCourse(organizationId: string, input: CourseInput) {
  if (input.id) {
    return prisma.course.updateMany({
      where: { id: input.id, organizationId },
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
      title: input.title,
      slug: input.slug,
      description: input.description,
      coverImageUrl: input.coverImageUrl,
      status: input.status ?? CourseStatus.ACTIVE,
    },
  });
}

export async function deleteCourse(organizationId: string, id: string) {
  return prisma.course.deleteMany({ where: { id, organizationId } });
}

export async function listModules(organizationId: string, courseId: string, args: PageArgs) {
  const where: Prisma.ModuleWhereInput = {
    courseId,
    course: { organizationId },
    ...(args.query ? { title: { contains: args.query, mode: "insensitive" } } : {}),
  };
  const [course, items, total] = await prisma.$transaction([
    prisma.course.findFirstOrThrow({
      where: { id: courseId, organizationId },
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

export async function upsertModule(organizationId: string, input: ModuleInput) {
  if (input.id) {
    return prisma.module.updateMany({
      where: { id: input.id, course: { organizationId } },
      data: {
        title: input.title,
        description: input.description,
        coverImageUrl: input.coverImageUrl,
        position: input.position,
        status: input.status,
      },
    });
  }

  await prisma.course.findFirstOrThrow({
    where: { id: input.courseId, organizationId },
    select: { id: true },
  });

  return prisma.module.create({
    data: {
      courseId: input.courseId,
      title: input.title,
      description: input.description,
      coverImageUrl: input.coverImageUrl,
      position: input.position,
      status: input.status ?? ModuleStatus.ACTIVE,
    },
  });
}

export async function deleteModule(organizationId: string, id: string) {
  return prisma.module.deleteMany({ where: { id, course: { organizationId } } });
}

export async function listLessons(organizationId: string, moduleId: string, args: PageArgs) {
  const where: Prisma.LessonWhereInput = {
    moduleId,
    module: { course: { organizationId } },
    ...(args.query ? { title: { contains: args.query, mode: "insensitive" } } : {}),
  };
  const [module, items, total] = await prisma.$transaction([
    prisma.module.findFirstOrThrow({
      where: { id: moduleId, course: { organizationId } },
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

export async function upsertLesson(organizationId: string, input: LessonInput) {
  if (input.id) {
    return prisma.lesson.updateMany({
      where: { id: input.id, module: { course: { organizationId } } },
      data: {
        title: input.title,
        description: input.description,
        youtubeUrl: input.youtubeUrl,
        youtubeVideoId: input.youtubeVideoId,
        position: input.position,
        status: input.status,
      },
    });
  }

  await prisma.module.findFirstOrThrow({
    where: { id: input.moduleId, course: { organizationId } },
    select: { id: true },
  });

  return prisma.lesson.create({
    data: {
      moduleId: input.moduleId,
      title: input.title,
      description: input.description,
      youtubeUrl: input.youtubeUrl,
      youtubeVideoId: input.youtubeVideoId,
      position: input.position,
      status: input.status ?? LessonStatus.ACTIVE,
    },
  });
}

export async function deleteLesson(organizationId: string, id: string) {
  return prisma.lesson.deleteMany({ where: { id, module: { course: { organizationId } } } });
}

export async function listStudents(organizationId: string, args: PageArgs) {
  const where: Prisma.StudentProfileWhereInput = args.query
    ? {
        user: {
          organizationId,
          OR: [
            { name: { contains: args.query, mode: "insensitive" } },
            { email: { contains: args.query, mode: "insensitive" } },
          ],
        },
      }
    : { user: { organizationId } };

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

export async function listStudentOptions(organizationId: string) {
  return prisma.studentProfile.findMany({
    where: { user: { organizationId } },
    orderBy: { user: { name: "asc" } },
    select: {
      id: true,
      user: { select: { name: true, email: true } },
    },
  });
}

export async function upsertStudent(organizationId: string, input: StudentInput) {
  if (input.id && input.studentProfileId) {
    const currentUser = await prisma.user.findFirstOrThrow({
      where: { id: input.id, organizationId, role: UserRole.STUDENT },
      select: { authUserId: true },
    });

    const authUserId = await upsertStudentAuthUser({
      authUserId: currentUser.authUserId,
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

  const authUserId = await upsertStudentAuthUser({
    authUserId: null,
    email: input.email,
    password: input.password,
    name: input.name,
  });

  return prisma.user.create({
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
  });
}

export async function deleteStudent(organizationId: string, userId: string) {
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

export async function listEnrollments(organizationId: string, args: PageArgs) {
  const where: Prisma.EnrollmentWhereInput = args.query
    ? {
        course: { organizationId },
        OR: [
          { course: { title: { contains: args.query, mode: "insensitive" } } },
          { student: { user: { name: { contains: args.query, mode: "insensitive" } } } },
          { student: { user: { email: { contains: args.query, mode: "insensitive" } } } },
        ],
      }
    : { course: { organizationId } };

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

export async function upsertEnrollment(organizationId: string, input: EnrollmentInput) {
  await prisma.course.findFirstOrThrow({
    where: {
      id: input.courseId,
      organizationId,
    },
    select: { id: true },
  });

  await prisma.studentProfile.findFirstOrThrow({
    where: {
      id: input.studentId,
      user: { organizationId },
    },
    select: { id: true },
  });

  if (input.id) {
    return prisma.enrollment.updateMany({
      where: { id: input.id, course: { organizationId } },
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

export async function renewEnrollment(organizationId: string, input: RenewEnrollmentInput) {
  return prisma.enrollment.updateMany({
    where: { id: input.id, course: { organizationId } },
    data: {
      expiresAt: input.expiresAt,
      status: EnrollmentStatus.ACTIVE,
    },
  });
}

export async function cancelEnrollment(organizationId: string, id: string) {
  return prisma.enrollment.updateMany({
    where: { id, course: { organizationId } },
    data: { status: EnrollmentStatus.CANCELED },
  });
}

export async function listCoursesByStudent(organizationId: string, studentId: string, args: PageArgs) {
  const [student, items, total] = await prisma.$transaction([
    prisma.studentProfile.findFirstOrThrow({
      where: { id: studentId, user: { organizationId } },
      include: { user: true },
    }),
    prisma.enrollment.findMany({
      where: { studentId, course: { organizationId } },
      orderBy: { createdAt: "desc" },
      skip: offset(args),
      take: args.pageSize,
      include: { course: true },
    }),
    prisma.enrollment.count({ where: { studentId, course: { organizationId } } }),
  ]);

  return { student, enrollments: pageResult(items, total, args) };
}

export async function listStudentsByCourse(organizationId: string, courseId: string, args: PageArgs) {
  const [course, items, total] = await prisma.$transaction([
    prisma.course.findFirstOrThrow({ where: { id: courseId, organizationId } }),
    prisma.enrollment.findMany({
      where: { courseId, course: { organizationId } },
      orderBy: { createdAt: "desc" },
      skip: offset(args),
      take: args.pageSize,
      include: { student: { include: { user: true } } },
    }),
    prisma.enrollment.count({ where: { courseId, course: { organizationId } } }),
  ]);

  return { course, enrollments: pageResult(items, total, args) };
}

export async function upsertManagedUser(organizationId: string, input: {
  id?: string;
  studentProfileId?: string;
  role: UserRole;
  email: string;
  name: string;
  password: string | null;
  document: string | null;
  phone: string | null;
  status: UserStatus;
}) {
  if (input.id) {
    const currentUser = await prisma.user.findFirstOrThrow({
      where: { id: input.id, organizationId },
      select: { authUserId: true, role: true },
    });

    const authUserId = await upsertStudentAuthUser({
      authUserId: currentUser.authUserId,
      email: input.email,
      password: input.password,
      name: input.name,
      role: input.role,
    });

    return prisma.user.update({
      where: { id: input.id },
      data: {
        email: input.email,
        name: input.name,
        role: input.role,
        status: input.status,
        authUserId,
        studentProfile:
          input.role === UserRole.STUDENT
            ? {
                upsert: {
                  update: { document: input.document, phone: input.phone },
                  create: { document: input.document, phone: input.phone },
                },
              }
            : { delete: input.studentProfileId ? true : undefined },
      },
    });
  }

  const authUserId = await upsertStudentAuthUser({
    authUserId: null,
    email: input.email,
    password: input.password,
    name: input.name,
    role: input.role,
  });

  return prisma.user.create({
    data: {
      organizationId,
      authUserId,
      email: input.email,
      name: input.name,
      role: input.role,
      status: input.status,
      ...(input.role === UserRole.STUDENT
        ? {
            studentProfile: {
              create: {
                document: input.document,
                phone: input.phone,
              },
            },
          }
        : {}),
    },
  });
}

export async function updateAdminProfile(organizationId: string, userId: string, name: string) {
  return prisma.user.updateMany({
    where: { id: userId, organizationId, role: UserRole.ADMIN },
    data: { name },
  });
}

export async function getAdminConsumptionMetrics(organizationId: string) {
  const students = await prisma.studentProfile.findMany({
    where: { user: { organizationId } },
    include: {
      user: { select: { id: true, name: true, email: true } },
      enrollments: {
        where: { course: { organizationId } },
        include: { course: { select: { id: true, title: true } } },
      },
      progress: { where: { status: "COMPLETED" }, select: { lessonId: true } },
    },
    orderBy: { user: { name: "asc" } },
  });

  return students.map((student) => {
    const activeEnrollments = student.enrollments.filter((enrollment) => enrollment.status === "ACTIVE").length;
    const completedLessons = student.progress.length;
    return {
      studentId: student.id,
      name: student.user.name,
      email: student.user.email,
      activeEnrollments,
      totalEnrollments: student.enrollments.length,
      completedLessons,
    };
  });
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

async function upsertStudentAuthUser(input: {
  authUserId: string | null;
  email: string;
  password: string | null;
  name: string;
  role?: UserRole;
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

  const existing = await findAuthUserByEmail(supabase, input.email);

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

  const { data, error } = await supabase.auth.admin.createUser({
    email: input.email,
    password: input.password ?? undefined,
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
