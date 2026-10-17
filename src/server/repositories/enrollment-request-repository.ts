import { CourseStatus, EnrollmentRequestStatus, EnrollmentStatus } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

export class EnrollmentRequestError extends Error {
  constructor(readonly status: "already_enrolled" | "course_unavailable") {
    super(status);
    this.name = "EnrollmentRequestError";
  }
}

export async function listPublicCourses(studentId: string | null) {
  const courses = await prisma.course.findMany({
    where: { isPublic: true, status: CourseStatus.ACTIVE },
    orderBy: { title: "asc" },
    select: {
      id: true,
      title: true,
      description: true,
      coverImageUrl: true,
      producer: { select: { name: true } },
    },
  });

  if (!studentId || courses.length === 0) {
    return courses.map((course) => ({ ...course, state: "AVAILABLE" as const }));
  }

  const courseIds = courses.map((course) => course.id);
  const [enrollments, requests] = await Promise.all([
    prisma.enrollment.findMany({
      where: { studentId, courseId: { in: courseIds }, status: EnrollmentStatus.ACTIVE },
      select: { courseId: true },
    }),
    prisma.enrollmentRequest.findMany({
      where: { studentId, courseId: { in: courseIds }, status: EnrollmentRequestStatus.PENDING },
      select: { courseId: true },
    }),
  ]);
  const enrolled = new Set(enrollments.map((item) => item.courseId));
  const pending = new Set(requests.map((item) => item.courseId));

  return courses.map((course) => ({
    ...course,
    state: enrolled.has(course.id)
      ? ("ENROLLED" as const)
      : pending.has(course.id)
        ? ("PENDING" as const)
        : ("AVAILABLE" as const),
  }));
}

export async function createEnrollmentRequest(studentId: string, courseId: string) {
  const course = await prisma.course.findFirst({
    where: { id: courseId, isPublic: true, status: CourseStatus.ACTIVE },
    select: { id: true },
  });

  if (!course) {
    throw new EnrollmentRequestError("course_unavailable");
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId, courseId } },
    select: { status: true, expiresAt: true },
  });

  if (enrollment?.status === EnrollmentStatus.ACTIVE && (!enrollment.expiresAt || enrollment.expiresAt > new Date())) {
    throw new EnrollmentRequestError("already_enrolled");
  }

  return prisma.enrollmentRequest.upsert({
    where: { studentId_courseId: { studentId, courseId } },
    update: { status: EnrollmentRequestStatus.PENDING, resolvedAt: null, createdAt: new Date() },
    create: { studentId, courseId },
  });
}

export async function listPendingRequests(organizationId: string, producerId: string) {
  return prisma.enrollmentRequest.findMany({
    where: { status: EnrollmentRequestStatus.PENDING, course: { organizationId, producerId } },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      createdAt: true,
      course: { select: { title: true } },
      student: {
        select: {
          phone: true,
          document: true,
          user: { select: { name: true, email: true } },
        },
      },
    },
  });
}

export async function approveEnrollmentRequest(
  organizationId: string,
  producerId: string,
  id: string,
  expiresAt: Date,
) {
  return prisma.$transaction(async (tx) => {
    const request = await tx.enrollmentRequest.findFirstOrThrow({
      where: {
        id,
        status: EnrollmentRequestStatus.PENDING,
        course: { organizationId, producerId },
      },
      select: { studentId: true, courseId: true },
    });
    const now = new Date();

    await tx.enrollment.upsert({
      where: { studentId_courseId: { studentId: request.studentId, courseId: request.courseId } },
      update: { startsAt: now, expiresAt, status: EnrollmentStatus.ACTIVE },
      create: {
        studentId: request.studentId,
        courseId: request.courseId,
        startsAt: now,
        expiresAt,
        status: EnrollmentStatus.ACTIVE,
      },
    });
    // O vinculo mantem o aluno visivel na lista do produtor (escopo de alunos).
    await tx.producerStudent.upsert({
      where: { producerId_studentId: { producerId, studentId: request.studentId } },
      update: {},
      create: { producerId, studentId: request.studentId },
    });
    await tx.enrollmentRequest.update({
      where: { id },
      data: { status: EnrollmentRequestStatus.APPROVED, resolvedAt: now },
    });
  });
}

export async function rejectEnrollmentRequest(organizationId: string, producerId: string, id: string) {
  return prisma.enrollmentRequest.updateMany({
    where: {
      id,
      status: EnrollmentRequestStatus.PENDING,
      course: { organizationId, producerId },
    },
    data: { status: EnrollmentRequestStatus.REJECTED, resolvedAt: new Date() },
  });
}
