import { LessonProgressStatus, type Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { accessibleLessonWhere } from "@/server/repositories/student-repository";

export async function getStudyPlan(studentId: string, courseId: string) {
  return prisma.studyPlan.findUnique({ where: { studentId_courseId: { studentId, courseId } } });
}

export async function upsertStudyPlan(
  studentId: string,
  courseId: string,
  targetDate: Date,
  dailyMinutes: number,
  schedule: Prisma.InputJsonValue,
) {
  return prisma.studyPlan.upsert({
    where: { studentId_courseId: { studentId, courseId } },
    create: { studentId, courseId, targetDate, dailyMinutes, schedule },
    update: { targetDate, dailyMinutes, schedule },
  });
}

// Aulas ainda nao concluidas do curso, na ordem modulo -> aula.
export async function listRemainingLessons(studentId: string, courseId: string) {
  return prisma.lesson.findMany({
    where: {
      AND: [accessibleLessonWhere(studentId)],
      module: { courseId },
      NOT: { progress: { some: { studentId, status: LessonProgressStatus.COMPLETED } } },
    },
    orderBy: [{ module: { position: "asc" } }, { position: "asc" }],
    select: { id: true, title: true, durationSeconds: true, module: { select: { title: true } } },
  });
}

// Aulas do cronograma salvo, com o estado de conclusao do aluno.
export async function listLessonsWithCompletion(studentId: string, lessonIds: string[]) {
  const rows = await prisma.lesson.findMany({
    where: { id: { in: lessonIds }, AND: [accessibleLessonWhere(studentId)] },
    select: {
      id: true,
      title: true,
      module: { select: { title: true } },
      progress: { where: { studentId, status: LessonProgressStatus.COMPLETED }, select: { id: true } },
    },
  });
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    moduleTitle: row.module.title,
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
