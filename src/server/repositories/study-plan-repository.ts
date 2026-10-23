import { LessonProgressStatus, type Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { accessibleLessonWhere } from "@/server/repositories/student-repository";

export async function getStudySchedule(studentId: string) {
  return prisma.studySchedule.findUnique({ where: { studentId } });
}

export async function upsertStudySchedule(
  studentId: string,
  data: { courseIds: string[]; courseModes: Prisma.InputJsonValue; blockedRanges: Prisma.InputJsonValue; targetDate: Date; dailyMinutes: number; schedule: Prisma.InputJsonValue },
) {
  return prisma.studySchedule.upsert({ where: { studentId }, create: { studentId, ...data }, update: data });
}

export async function deleteStudySchedule(studentId: string) {
  return prisma.studySchedule.deleteMany({ where: { studentId } });
}

// Aulas ainda nao concluidas dos cursos, na ordem modulo -> aula.
export async function listRemainingLessons(studentId: string, courseIds: string[]) {
  return prisma.lesson.findMany({
    where: {
      AND: [accessibleLessonWhere(studentId)],
      module: { courseId: { in: courseIds } },
      NOT: { progress: { some: { studentId, status: LessonProgressStatus.COMPLETED } } },
    },
    orderBy: [{ module: { position: "asc" } }, { position: "asc" }],
    select: {
      id: true,
      title: true,
      durationSeconds: true,
      module: { select: { id: true, title: true, courseId: true } },
    },
  });
}

// Aulas do cronograma salvo, com o estado de conclusao do aluno.
export async function listLessonsWithCompletion(studentId: string, lessonIds: string[]) {
  const rows = await prisma.lesson.findMany({
    where: { id: { in: lessonIds }, AND: [accessibleLessonWhere(studentId)] },
    select: {
      id: true,
      title: true,
      module: { select: { title: true, courseId: true } },
      progress: { where: { studentId, status: LessonProgressStatus.COMPLETED }, select: { id: true } },
    },
  });
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    moduleTitle: row.module.title,
    courseId: row.module.courseId,
    completed: row.progress.length > 0,
  }));
}

export async function getStudyPreferences(studentId: string) {
  return prisma.studentProfile.findUniqueOrThrow({
    where: { id: studentId },
    select: { studyWeekdays: true, studyStartMinute: true, studyEndMinute: true },
  });
}

export async function saveStudyPreferences(
  studentId: string,
  data: { studyWeekdays: number[]; studyStartMinute: number; studyEndMinute: number },
) {
  return prisma.studentProfile.update({ where: { id: studentId }, data });
}
