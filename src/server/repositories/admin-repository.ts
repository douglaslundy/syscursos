import {
  CourseStatus,
  EnrollmentStatus,
  LessonStatus,
  ModuleStatus,
  UserRole,
  UserStatus,
  type Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
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

export async function getAdminDashboardStats() {
  const [courses, students, enrollments, lessons] = await prisma.$transaction([
    prisma.course.count(),
    prisma.studentProfile.count(),
    prisma.enrollment.count({ where: { status: EnrollmentStatus.ACTIVE } }),
    prisma.lesson.count(),
  ]);

  return { courses, students, enrollments, lessons };
}

export async function listCourses(args: PageArgs) {
  const where: Prisma.CourseWhereInput = args.query
    ? {
        OR: [
          { title: { contains: args.query, mode: "insensitive" } },
          { slug: { contains: args.query, mode: "insensitive" } },
        ],
      }
    : {};

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

export async function listCourseOptions() {
  return prisma.course.findMany({
    orderBy: { title: "asc" },
    select: { id: true, title: true },
  });
}

export async function upsertCourse(input: CourseInput) {
  if (input.id) {
    return prisma.course.update({
      where: { id: input.id },
      data: {
        title: input.title,
        slug: input.slug,
        description: input.description,
        status: input.status,
      },
    });
  }

  return prisma.course.create({
    data: {
      title: input.title,
      slug: input.slug,
      description: input.description,
      status: input.status ?? CourseStatus.ACTIVE,
    },
  });
}

export async function deleteCourse(id: string) {
  return prisma.course.delete({ where: { id } });
}

export async function listModules(courseId: string, args: PageArgs) {
  const where: Prisma.ModuleWhereInput = {
    courseId,
    ...(args.query ? { title: { contains: args.query, mode: "insensitive" } } : {}),
  };
  const [course, items, total] = await prisma.$transaction([
    prisma.course.findUniqueOrThrow({ where: { id: courseId }, select: { id: true, title: true } }),
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

export async function upsertModule(input: ModuleInput) {
  if (input.id) {
    return prisma.module.update({
      where: { id: input.id },
      data: {
        title: input.title,
        description: input.description,
        position: input.position,
        status: input.status,
      },
    });
  }

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

export async function deleteModule(id: string) {
  return prisma.module.delete({ where: { id } });
}

export async function listLessons(moduleId: string, args: PageArgs) {
  const where: Prisma.LessonWhereInput = {
    moduleId,
    ...(args.query ? { title: { contains: args.query, mode: "insensitive" } } : {}),
  };
  const [module, items, total] = await prisma.$transaction([
    prisma.module.findUniqueOrThrow({
      where: { id: moduleId },
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

export async function upsertLesson(input: LessonInput) {
  if (input.id) {
    return prisma.lesson.update({
      where: { id: input.id },
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

export async function deleteLesson(id: string) {
  return prisma.lesson.delete({ where: { id } });
}

export async function listStudents(args: PageArgs) {
  const where: Prisma.StudentProfileWhereInput = args.query
    ? {
        user: {
          OR: [
            { name: { contains: args.query, mode: "insensitive" } },
            { email: { contains: args.query, mode: "insensitive" } },
          ],
        },
      }
    : {};

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

export async function listStudentOptions() {
  return prisma.studentProfile.findMany({
    orderBy: { user: { name: "asc" } },
    select: {
      id: true,
      user: { select: { name: true, email: true } },
    },
  });
}

export async function upsertStudent(input: StudentInput) {
  if (input.id && input.studentProfileId) {
    return prisma.user.update({
      where: { id: input.id },
      data: {
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

  return prisma.user.create({
    data: {
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

export async function deleteStudent(userId: string) {
  return prisma.user.delete({ where: { id: userId } });
}

export async function listEnrollments(args: PageArgs) {
  const where: Prisma.EnrollmentWhereInput = args.query
    ? {
        OR: [
          { course: { title: { contains: args.query, mode: "insensitive" } } },
          { student: { user: { name: { contains: args.query, mode: "insensitive" } } } },
          { student: { user: { email: { contains: args.query, mode: "insensitive" } } } },
        ],
      }
    : {};

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

export async function upsertEnrollment(input: EnrollmentInput) {
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

export async function renewEnrollment(input: RenewEnrollmentInput) {
  return prisma.enrollment.update({
    where: { id: input.id },
    data: {
      expiresAt: input.expiresAt,
      status: EnrollmentStatus.ACTIVE,
    },
  });
}

export async function cancelEnrollment(id: string) {
  return prisma.enrollment.update({
    where: { id },
    data: { status: EnrollmentStatus.CANCELED },
  });
}

export async function listCoursesByStudent(studentId: string, args: PageArgs) {
  const [student, items, total] = await prisma.$transaction([
    prisma.studentProfile.findUniqueOrThrow({
      where: { id: studentId },
      include: { user: true },
    }),
    prisma.enrollment.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
      skip: offset(args),
      take: args.pageSize,
      include: { course: true },
    }),
    prisma.enrollment.count({ where: { studentId } }),
  ]);

  return { student, enrollments: pageResult(items, total, args) };
}

export async function listStudentsByCourse(courseId: string, args: PageArgs) {
  const [course, items, total] = await prisma.$transaction([
    prisma.course.findUniqueOrThrow({ where: { id: courseId } }),
    prisma.enrollment.findMany({
      where: { courseId },
      orderBy: { createdAt: "desc" },
      skip: offset(args),
      take: args.pageSize,
      include: { student: { include: { user: true } } },
    }),
    prisma.enrollment.count({ where: { courseId } }),
  ]);

  return { course, enrollments: pageResult(items, total, args) };
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
