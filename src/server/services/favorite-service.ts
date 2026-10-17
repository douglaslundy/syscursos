import { notFound, redirect } from "next/navigation";

import * as favorites from "@/server/repositories/favorite-repository";
import * as repository from "@/server/repositories/student-repository";
import {
  buildStudentCourseCards,
  getCourseAccessStatus,
  requireStudentProfileId,
} from "@/server/services/student-service";
import { getLessonThumbnailUrl } from "@/server/services/video-platform-service";

const RECENT_COURSES_LIMIT = 3;

type LessonRow = Awaited<ReturnType<typeof favorites.listFavoriteLessons>>[number];

export type LessonThumbCard = {
  lessonId: string;
  courseId: string;
  courseTitle: string;
  lessonTitle: string;
  moduleTitle: string;
  href: string;
  thumbnailUrl: string | null;
};

export async function getRecentCourseLessons() {
  const studentId = await requireStudentProfileId();
  const lessons = await favorites.listRecentCourseLessons(studentId, RECENT_COURSES_LIMIT);
  return lessons.map(toLessonCard);
}

export async function getFavoriteCourses() {
  const studentId = await requireStudentProfileId();
  const ids = new Set(await favorites.listFavoriteCourseIds(studentId));
  const enrollments = await repository.listStudentCourseEnrollments(studentId);
  return buildStudentCourseCards(
    studentId,
    enrollments.filter((enrollment) => ids.has(enrollment.courseId)),
  );
}

// Aulas favoritas agrupadas por curso, na ordem do favorito mais recente.
export async function getFavoriteLessonGroups() {
  const studentId = await requireStudentProfileId();
  const cards = (await favorites.listFavoriteLessons(studentId)).map(toLessonCard);
  const groups = new Map<string, { courseId: string; courseTitle: string; lessons: LessonThumbCard[] }>();

  for (const card of cards) {
    const group = groups.get(card.courseId) ?? {
      courseId: card.courseId,
      courseTitle: card.courseTitle,
      lessons: [],
    };
    group.lessons.push(card);
    groups.set(card.courseId, group);
  }

  return Array.from(groups.values());
}

export async function getCourseFavoriteState(courseId: string) {
  const studentId = await requireStudentProfileId();
  return favorites.isCourseFavorite(studentId, courseId);
}

export async function getLessonFavoriteState(lessonId: string) {
  const studentId = await requireStudentProfileId();
  return favorites.isLessonFavorite(studentId, lessonId);
}

export async function setCourseFavorite(courseId: string, favorite: boolean) {
  const studentId = await requireStudentProfileId();
  await requireCourseAccess(studentId, courseId);
  await favorites.setCourseFavorite(studentId, courseId, favorite);
}

export async function setLessonFavorite(courseId: string, lessonId: string, favorite: boolean) {
  const studentId = await requireStudentProfileId();
  await requireCourseAccess(studentId, courseId);

  if (!(await repository.getActiveLessonForStudent(courseId, lessonId))) {
    notFound();
  }

  await favorites.setLessonFavorite(studentId, lessonId, favorite);
}

async function requireCourseAccess(studentId: string, courseId: string) {
  const enrollment = await repository.findEnrollmentForCourse(studentId, courseId);

  if (!enrollment || getCourseAccessStatus(enrollment) !== "AVAILABLE") {
    redirect("/app/forbidden");
  }
}

function toLessonCard(lesson: LessonRow): LessonThumbCard {
  const course = lesson.module.course;

  return {
    lessonId: lesson.id,
    courseId: course.id,
    courseTitle: course.title,
    lessonTitle: lesson.title,
    moduleTitle: lesson.module.title,
    href: `/app/courses/${course.id}/lessons/${lesson.id}`,
    thumbnailUrl: lesson.coverImageUrl ?? getLessonThumbnailUrl(lesson.youtubeUrl, lesson.youtubeVideoId),
  };
}
