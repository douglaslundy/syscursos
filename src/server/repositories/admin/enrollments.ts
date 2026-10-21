import { EnrollmentStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { EnrollmentInput, RenewEnrollmentInput } from "@/server/validators/admin";
import { PageArgs, ActorRole, offset, pageResult, scopedCourseWhere, scopedStudentWhere } from "@/server/repositories/admin/shared";

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
