import {
  CourseStatus,
  EnrollmentStatus,
  LessonProgressStatus,
  LessonStatus,
  ModuleStatus,
} from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

const courseAccessInclude = {
  course: {
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      status: true,
    },
  },
} as const;

export async function listStudentCourseEnrollments(studentId: string) {
  return prisma.enrollment.findMany({
    where: {
      studentId,
      status: { not: EnrollmentStatus.CANCELED },
    },
    orderBy: { createdAt: "desc" },
    include: courseAccessInclude,
  });
}

export async function findEnrollmentForCourse(studentId: string, courseId: string) {
  return prisma.enrollment.findUnique({
    where: {
      studentId_courseId: {
        studentId,
        courseId,
      },
    },
    include: courseAccessInclude,
  });
}

export async function getCourseWithActiveContent(courseId: string) {
  return prisma.course.findFirst({
    where: {
      id: courseId,
      status: CourseStatus.ACTIVE,
    },
    include: {
      modules: {
        where: { status: ModuleStatus.ACTIVE },
        orderBy: { position: "asc" },
        include: {
          lessons: {
            where: { status: LessonStatus.ACTIVE },
            orderBy: { position: "asc" },
            select: {
              id: true,
              title: true,
              position: true,
              status: true,
            },
          },
        },
      },
    },
  });
}

export async function countActiveLessonsByCourse(courseId: string) {
  return prisma.lesson.count({
    where: {
      status: LessonStatus.ACTIVE,
      module: {
        status: ModuleStatus.ACTIVE,
        courseId,
        course: {
          status: CourseStatus.ACTIVE,
        },
      },
    },
  });
}

export async function countCompletedLessonsByCourse(studentId: string, courseId: string) {
  return prisma.lessonProgress.count({
    where: {
      studentId,
      status: LessonProgressStatus.COMPLETED,
      lesson: {
        status: LessonStatus.ACTIVE,
        module: {
          status: ModuleStatus.ACTIVE,
          courseId,
          course: {
            status: CourseStatus.ACTIVE,
          },
        },
      },
    },
  });
}

export async function getCompletedLessonIds(studentId: string, courseId: string) {
  const rows = await prisma.lessonProgress.findMany({
    where: {
      studentId,
      status: LessonProgressStatus.COMPLETED,
      lesson: {
        module: {
          courseId,
        },
      },
    },
    select: {
      lessonId: true,
    },
  });

  return new Set(rows.map((row) => row.lessonId));
}

export async function getActiveLessonForStudent(courseId: string, lessonId: string) {
  return prisma.lesson.findFirst({
    where: {
      id: lessonId,
      status: LessonStatus.ACTIVE,
      module: {
        status: ModuleStatus.ACTIVE,
        courseId,
        course: {
          status: CourseStatus.ACTIVE,
        },
      },
    },
    include: {
      module: {
        select: {
          id: true,
          title: true,
          courseId: true,
          course: {
            select: {
              title: true,
            },
          },
        },
      },
    },
  });
}

export async function findLessonProgress(studentId: string, lessonId: string) {
  return prisma.lessonProgress.findUnique({
    where: {
      studentId_lessonId: {
        studentId,
        lessonId,
      },
    },
  });
}

export async function markLessonCompleted(studentId: string, lessonId: string) {
  return prisma.lessonProgress.upsert({
    where: {
      studentId_lessonId: {
        studentId,
        lessonId,
      },
    },
    update: {
      status: LessonProgressStatus.COMPLETED,
      completedAt: new Date(),
    },
    create: {
      studentId,
      lessonId,
      status: LessonProgressStatus.COMPLETED,
      completedAt: new Date(),
    },
  });
}
