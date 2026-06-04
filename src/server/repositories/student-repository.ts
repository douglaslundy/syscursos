import {
  CourseStatus,
  EnrollmentStatus,
  Prisma,
  LessonMaterialStatus,
  LessonProgressStatus,
  LessonStatus,
  ModuleStatus,
} from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const courseAccessInclude = {
  course: {
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      coverImageUrl: true,
      status: true,
    },
  },
} as const;

export async function listStudentCourseEnrollments(studentId: string) {
  return prisma.enrollment.findMany({
    where: {
      studentId,
      course: {
        producer: {
          producerStudents: {
            some: { studentId },
          },
        },
      },
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
    include: {
      ...courseAccessInclude,
      course: {
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          coverImageUrl: true,
          status: true,
          producerId: true,
        },
      },
    },
  }).then((enrollment) => {
    if (!enrollment) {
      return null;
    }

    return prisma.producerStudent.findUnique({
      where: {
        producerId_studentId: {
          producerId: enrollment.course.producerId,
          studentId,
        },
      },
      select: { id: true },
    }).then((link) => (link ? enrollment : null));
  });
}

export async function hasProducerLink(studentId: string, producerId: string) {
  const link = await prisma.producerStudent.findUnique({
    where: {
      producerId_studentId: {
        producerId,
        studentId,
      },
    },
  });
  return Boolean(link);
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
              description: true,
              youtubeUrl: true,
              youtubeVideoId: true,
              coverImageUrl: true,
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

export async function findMostRecentLessonProgress(studentId: string) {
  const now = new Date();

  return prisma.lessonProgress.findFirst({
    where: {
      studentId,
      lesson: {
        status: LessonStatus.ACTIVE,
        module: {
          status: ModuleStatus.ACTIVE,
          course: {
            status: CourseStatus.ACTIVE,
            enrollments: {
              some: {
                studentId,
                status: EnrollmentStatus.ACTIVE,
                startsAt: { lte: now },
                OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
              },
            },
            producer: {
              producerStudents: {
                some: { studentId },
              },
            },
          },
        },
      },
    },
    orderBy: [{ updatedAt: "desc" }, { completedAt: "desc" }],
    select: {
      status: true,
      updatedAt: true,
      completedAt: true,
      lesson: {
        select: {
          id: true,
          title: true,
          position: true,
          module: {
            select: {
              id: true,
              title: true,
              position: true,
              course: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
        },
      },
    },
  });
}

export async function findMostRecentLessonProgressForCourse(studentId: string, courseId: string) {
  const now = new Date();

  return prisma.lessonProgress.findFirst({
    where: {
      studentId,
      lesson: {
        status: LessonStatus.ACTIVE,
        module: {
          status: ModuleStatus.ACTIVE,
          courseId,
          course: {
            status: CourseStatus.ACTIVE,
            enrollments: {
              some: {
                studentId,
                status: EnrollmentStatus.ACTIVE,
                startsAt: { lte: now },
                OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
              },
            },
            producer: {
              producerStudents: {
                some: { studentId },
              },
            },
          },
        },
      },
    },
    orderBy: [{ updatedAt: "desc" }, { completedAt: "desc" }],
    select: {
      status: true,
      updatedAt: true,
      completedAt: true,
      lesson: {
        select: {
          id: true,
          title: true,
          position: true,
          module: {
            select: {
              id: true,
              title: true,
              position: true,
              course: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
        },
      },
    },
  });
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

export async function listActiveLessonMaterials(lessonId: string) {
  try {
    return await prisma.lessonMaterial.findMany({
      where: {
        lessonId,
        status: LessonMaterialStatus.ACTIVE,
      },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        type: true,
        title: true,
        url: true,
        position: true,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2021"
    ) {
      // Backward-compatible fallback when lesson_materials migration is not applied yet.
      return [];
    }

    throw error;
  }
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

export async function touchLessonProgress(
  studentId: string,
  lessonId: string,
  progress: { status: LessonProgressStatus; completedAt: Date | null } | null,
) {
  const status = progress?.status ?? LessonProgressStatus.NOT_STARTED;
  const completedAt =
    status === LessonProgressStatus.COMPLETED ? progress?.completedAt ?? new Date() : null;

  return prisma.lessonProgress.upsert({
    where: {
      studentId_lessonId: {
        studentId,
        lessonId,
      },
    },
    update: {
      status,
      completedAt,
    },
    create: {
      studentId,
      lessonId,
      status,
      completedAt,
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

export async function toggleLessonCompleted(studentId: string, lessonId: string, isCompleted: boolean) {
  if (isCompleted) {
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

  return prisma.lessonProgress.upsert({
    where: {
      studentId_lessonId: {
        studentId,
        lessonId,
      },
    },
    update: {
      status: LessonProgressStatus.NOT_STARTED,
      completedAt: null,
    },
    create: {
      studentId,
      lessonId,
      status: LessonProgressStatus.NOT_STARTED,
      completedAt: null,
    },
  });
}

export async function findLessonNote(studentId: string, lessonId: string) {
  return prisma.lessonNote.findUnique({
    where: {
      studentId_lessonId: {
        studentId,
        lessonId,
      },
    },
    select: {
      id: true,
      content: true,
      updatedAt: true,
    },
  });
}

export async function upsertLessonNote(studentId: string, lessonId: string, content: string) {
  return prisma.lessonNote.upsert({
    where: {
      studentId_lessonId: {
        studentId,
        lessonId,
      },
    },
    update: {
      content,
    },
    create: {
      studentId,
      lessonId,
      content,
    },
    select: {
      id: true,
      content: true,
      updatedAt: true,
    },
  });
}

export async function listNotebookCourseOptions(studentId: string) {
  const now = new Date();

  return prisma.enrollment.findMany({
    where: {
      studentId,
      status: EnrollmentStatus.ACTIVE,
      startsAt: {
        lte: now,
      },
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      course: {
        status: CourseStatus.ACTIVE,
        producer: {
          producerStudents: {
            some: { studentId },
          },
        },
      },
    },
    orderBy: {
      course: {
        title: "asc",
      },
    },
    select: {
      course: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });
}

export async function listNotebookNotes(studentId: string, courseId: string, query: string) {
  return prisma.lessonNote.findMany({
    where: {
      studentId,
      ...(query ? { content: { contains: query, mode: "insensitive" } } : {}),
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
    orderBy: [{ lesson: { module: { position: "asc" } } }, { lesson: { position: "asc" } }],
    include: {
      lesson: {
        select: {
          id: true,
          title: true,
          position: true,
          module: {
            select: {
              id: true,
              title: true,
              position: true,
            },
          },
        },
      },
    },
  });
}

export async function getStudentProfile(studentId: string) {
  return prisma.studentProfile.findUniqueOrThrow({
    where: { id: studentId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

export async function updateStudentProfile(
  studentId: string,
  input: { name: string; phone: string | null; password?: string | null },
) {
  const profile = await prisma.studentProfile.findUniqueOrThrow({
    where: { id: studentId },
    include: { user: { select: { authUserId: true, email: true } } },
  });

  if (input.password && profile.user.authUserId) {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.auth.admin.updateUserById(profile.user.authUserId, {
      password: input.password,
      email_confirm: true,
    });

    if (error) {
      throw new Error(`Nao foi possivel atualizar senha do aluno: ${error.message}`);
    }
  }

  return prisma.studentProfile.update({
    where: { id: studentId },
    data: {
      phone: input.phone,
      user: {
        update: {
          name: input.name,
        },
      },
    },
  });
}
