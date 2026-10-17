import { prisma } from "@/lib/db/prisma";
import { accessibleLessonWhere } from "@/server/repositories/student-repository";

const lessonCardSelect = {
  id: true,
  title: true,
  position: true,
  coverImageUrl: true,
  youtubeUrl: true,
  youtubeVideoId: true,
  module: {
    select: {
      title: true,
      position: true,
      course: { select: { id: true, title: true } },
    },
  },
} as const;

// Ultimos cursos assistidos: pega as aulas mais recentes e deduplica por curso.
export async function listRecentCourseLessons(studentId: string, limit: number) {
  const rows = await prisma.lessonProgress.findMany({
    where: { studentId, lesson: accessibleLessonWhere(studentId) },
    orderBy: [{ updatedAt: "desc" }],
    take: 60,
    select: { lesson: { select: lessonCardSelect } },
  });
  const seen = new Set<string>();
  const result: Array<(typeof rows)[number]["lesson"]> = [];

  for (const { lesson } of rows) {
    if (seen.has(lesson.module.course.id)) continue;
    seen.add(lesson.module.course.id);
    result.push(lesson);
    if (result.length === limit) break;
  }

  return result;
}

export async function listFavoriteCourseIds(studentId: string) {
  const rows = await prisma.favoriteCourse.findMany({
    where: { studentId },
    orderBy: { createdAt: "desc" },
    select: { courseId: true },
  });
  return rows.map((row) => row.courseId);
}

export async function listFavoriteLessons(studentId: string) {
  const rows = await prisma.favoriteLesson.findMany({
    where: { studentId, lesson: accessibleLessonWhere(studentId) },
    orderBy: { createdAt: "desc" },
    select: { lesson: { select: lessonCardSelect } },
  });
  return rows.map((row) => row.lesson);
}

export async function isCourseFavorite(studentId: string, courseId: string) {
  const row = await prisma.favoriteCourse.findUnique({
    where: { studentId_courseId: { studentId, courseId } },
    select: { id: true },
  });
  return Boolean(row);
}

export async function isLessonFavorite(studentId: string, lessonId: string) {
  const row = await prisma.favoriteLesson.findUnique({
    where: { studentId_lessonId: { studentId, lessonId } },
    select: { id: true },
  });
  return Boolean(row);
}

export async function setCourseFavorite(studentId: string, courseId: string, favorite: boolean) {
  if (favorite) {
    await prisma.favoriteCourse.upsert({
      where: { studentId_courseId: { studentId, courseId } },
      update: {},
      create: { studentId, courseId },
    });
    return;
  }
  await prisma.favoriteCourse.deleteMany({ where: { studentId, courseId } });
}

export async function setLessonFavorite(studentId: string, lessonId: string, favorite: boolean) {
  if (favorite) {
    await prisma.favoriteLesson.upsert({
      where: { studentId_lessonId: { studentId, lessonId } },
      update: {},
      create: { studentId, lessonId },
    });
    return;
  }
  await prisma.favoriteLesson.deleteMany({ where: { studentId, lessonId } });
}
