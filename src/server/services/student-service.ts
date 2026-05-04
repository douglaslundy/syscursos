import { notFound, redirect } from "next/navigation";

import { requireRole } from "@/server/auth/guards";
import * as repository from "@/server/repositories/student-repository";
import { calculateCourseProgress } from "@/server/services/progress-service";
import { getYouTubeEmbedUrl } from "@/server/services/youtube-service";
import type { CompleteLessonInput } from "@/server/validators/student";

export type CourseAccessStatus = "AVAILABLE" | "EXPIRED" | "INACTIVE";

export type StudentCourseCard = {
  id: string;
  title: string;
  description: string | null;
  enrollmentStatus: CourseAccessStatus;
  expiresAt: Date | null;
  progress: {
    completedLessons: number;
    totalLessons: number;
    percentage: number;
  };
};

export async function getStudentDashboard() {
  const studentId = await requireStudentProfileId();
  const enrollments = await repository.listStudentCourseEnrollments(studentId);

  const courses = await Promise.all(
    enrollments.map(async (enrollment): Promise<StudentCourseCard> => {
      const totalLessons = await repository.countActiveLessonsByCourse(enrollment.courseId);
      const completedLessons = await repository.countCompletedLessonsByCourse(
        studentId,
        enrollment.courseId,
      );

      return {
        id: enrollment.course.id,
        title: enrollment.course.title,
        description: enrollment.course.description,
        enrollmentStatus: getCourseAccessStatus(enrollment),
        expiresAt: enrollment.expiresAt,
        progress: calculateCourseProgress(completedLessons, totalLessons),
      };
    }),
  );

  return { courses };
}

export async function getStudentCourse(courseId: string) {
  const studentId = await requireStudentProfileId();
  const enrollment = await repository.findEnrollmentForCourse(studentId, courseId);

  if (!enrollment) {
    redirect("/app/forbidden");
  }

  const accessStatus = getCourseAccessStatus(enrollment);

  if (accessStatus !== "AVAILABLE") {
    return {
      status: accessStatus,
      course: enrollment.course,
      modules: [],
      completedLessonIds: new Set<string>(),
      progress: calculateCourseProgress(0, 0),
    };
  }

  const course = await repository.getCourseWithActiveContent(courseId);

  if (!course) {
    return {
      status: "INACTIVE" as const,
      course: enrollment.course,
      modules: [],
      completedLessonIds: new Set<string>(),
      progress: calculateCourseProgress(0, 0),
    };
  }

  const [totalLessons, completedLessons, completedLessonIds] = await Promise.all([
    repository.countActiveLessonsByCourse(courseId),
    repository.countCompletedLessonsByCourse(studentId, courseId),
    repository.getCompletedLessonIds(studentId, courseId),
  ]);

  return {
    status: "AVAILABLE" as const,
    course,
    modules: course.modules,
    completedLessonIds,
    progress: calculateCourseProgress(completedLessons, totalLessons),
  };
}

export async function getStudentLesson(courseId: string, lessonId: string) {
  const studentId = await requireStudentProfileId();
  const enrollment = await repository.findEnrollmentForCourse(studentId, courseId);

  if (!enrollment) {
    redirect("/app/forbidden");
  }

  const accessStatus = getCourseAccessStatus(enrollment);

  if (accessStatus !== "AVAILABLE") {
    return {
      status: accessStatus,
      course: enrollment.course,
      lesson: null,
      embedUrl: null,
      isCompleted: false,
      progress: calculateCourseProgress(0, 0),
    };
  }

  const lesson = await repository.getActiveLessonForStudent(courseId, lessonId);

  if (!lesson) {
    notFound();
  }

  const [totalLessons, completedLessons, progress] = await Promise.all([
    repository.countActiveLessonsByCourse(courseId),
    repository.countCompletedLessonsByCourse(studentId, courseId),
    repository.findLessonProgress(studentId, lessonId),
  ]);

  return {
    status: "AVAILABLE" as const,
    course: enrollment.course,
    lesson,
    embedUrl: getYouTubeEmbedUrl(lesson.youtubeUrl, lesson.youtubeVideoId),
    isCompleted: progress?.status === "COMPLETED",
    progress: calculateCourseProgress(completedLessons, totalLessons),
  };
}

export async function completeLesson(input: CompleteLessonInput) {
  const studentId = await requireStudentProfileId();
  const enrollment = await repository.findEnrollmentForCourse(studentId, input.courseId);

  if (!enrollment || getCourseAccessStatus(enrollment) !== "AVAILABLE") {
    redirect("/app/forbidden");
  }

  const lesson = await repository.getActiveLessonForStudent(input.courseId, input.lessonId);

  if (!lesson) {
    notFound();
  }

  return repository.markLessonCompleted(studentId, input.lessonId);
}

async function requireStudentProfileId() {
  const user = await requireRole("STUDENT");

  if (!user.studentProfileId) {
    redirect("/app/forbidden");
  }

  return user.studentProfileId;
}

function getCourseAccessStatus(enrollment: {
  status: string;
  expiresAt: Date | null;
  startsAt: Date;
  course: { status: string };
}): CourseAccessStatus {
  const now = new Date();

  if (
    enrollment.course.status !== "ACTIVE" ||
    enrollment.status !== "ACTIVE" ||
    enrollment.startsAt > now
  ) {
    return "INACTIVE";
  }

  if (enrollment.expiresAt && enrollment.expiresAt <= now) {
    return "EXPIRED";
  }

  return "AVAILABLE";
}
