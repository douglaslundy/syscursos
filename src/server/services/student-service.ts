import { notFound, redirect } from "next/navigation";

import { requireAnyRole } from "@/server/auth/guards";
import * as repository from "@/server/repositories/student-repository";
import { calculateCourseProgress } from "@/server/services/progress-service";
import { getLessonVideoEmbed } from "@/server/services/video-platform-service";
import type { CompleteLessonInput } from "@/server/validators/student";
import type {
  LessonNoteInput,
  NotebookQueryInput,
  StudentProfileInput,
} from "@/server/validators/student";

export type CourseAccessStatus = "AVAILABLE" | "EXPIRED" | "INACTIVE" | "CANCELED";

export type StudentCourseCard = {
  id: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  enrollmentStatus: CourseAccessStatus;
  expiresAt: Date | null;
  progress: {
    completedLessons: number;
    totalLessons: number;
    percentage: number;
  };
};

export type ContinueLessonCard = {
  href: string;
  courseTitle: string;
  moduleTitle: string;
  lessonTitle: string;
  lessonPosition: number;
  modulePosition: number;
  mode: "NEXT_LESSON" | "REVIEW_LAST";
} | null;

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
        coverImageUrl: enrollment.course.coverImageUrl,
        enrollmentStatus: getCourseAccessStatus(enrollment),
        expiresAt: enrollment.expiresAt,
        progress: calculateCourseProgress(completedLessons, totalLessons),
      };
    }),
  );

  const continueLesson = await resolveContinueLessonCard(studentId, enrollments.map((enrollment) => enrollment.courseId));

  return {
    courses,
    continueHref: continueLesson?.href ?? null,
    continueLesson,
  };
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
      continueLesson: null,
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
      continueLesson: null,
    };
  }

  const [totalLessons, completedLessons, completedLessonIds, recentProgress] = await Promise.all([
    repository.countActiveLessonsByCourse(courseId),
    repository.countCompletedLessonsByCourse(studentId, courseId),
    repository.getCompletedLessonIds(studentId, courseId),
    repository.findMostRecentLessonProgressForCourse(studentId, courseId),
  ]);
  const continueLesson = recentProgress
    ? buildContinueLessonCardFromRecentProgress(recentProgress)
    : buildContinueLessonCardFromCourseModules(course.modules, completedLessonIds, courseId, course.title);

  return {
    status: "AVAILABLE" as const,
    course,
    modules: course.modules,
    completedLessonIds,
    progress: calculateCourseProgress(completedLessons, totalLessons),
    continueHref: continueLesson?.href ?? buildContinueHrefFromCourseModules(course.modules, completedLessonIds, courseId),
    continueLesson,
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
      videoEmbed: null,
      isCompleted: false,
      navigation: null,
      progress: calculateCourseProgress(0, 0),
    };
  }

  const lesson = await repository.getActiveLessonForStudent(courseId, lessonId);

  if (!lesson) {
    notFound();
  }

  const progress = await repository.findLessonProgress(studentId, lessonId);
  await repository.touchLessonProgress(studentId, lessonId, progress);

  const [totalLessons, completedLessons, note, courseContent, completedLessonIds, materials] =
    await Promise.all([
    repository.countActiveLessonsByCourse(courseId),
    repository.countCompletedLessonsByCourse(studentId, courseId),
    repository.findLessonNote(studentId, lessonId),
    repository.getCourseWithActiveContent(courseId),
    repository.getCompletedLessonIds(studentId, courseId),
    repository.listActiveLessonMaterials(lessonId),
  ]);

  if (!courseContent) {
    notFound();
  }

  return {
    status: "AVAILABLE" as const,
    course: enrollment.course,
    lesson: {
      ...lesson,
      materials,
    },
    videoEmbed: getLessonVideoEmbed(lesson.youtubeUrl, lesson.youtubeVideoId),
    isCompleted: progress?.status === "COMPLETED",
    note,
    navigation: buildLessonNavigation(courseContent.modules, lessonId, completedLessonIds),
    progress: calculateCourseProgress(completedLessons, totalLessons),
  };
}

export async function getContinueLearningTarget() {
  const studentId = await requireStudentProfileId();
  const enrollments = await repository.listStudentCourseEnrollments(studentId);
  const card = await resolveContinueLessonCard(studentId, enrollments.map((enrollment) => enrollment.courseId));
  return card?.href ?? "/app?status=no-continue-lesson";
}

export async function completeLesson(input: CompleteLessonInput) {
  return toggleLessonCompletion(input, true);
}

export async function toggleLessonCompletion(input: CompleteLessonInput, isCompleted: boolean) {
  const studentId = await requireStudentProfileId();
  const enrollment = await repository.findEnrollmentForCourse(studentId, input.courseId);

  if (!enrollment || getCourseAccessStatus(enrollment) !== "AVAILABLE") {
    redirect("/app/forbidden");
  }

  const lesson = await repository.getActiveLessonForStudent(input.courseId, input.lessonId);

  if (!lesson) {
    notFound();
  }

  return repository.toggleLessonCompleted(studentId, input.lessonId, isCompleted);
}

export async function saveLessonNote(input: LessonNoteInput) {
  const studentId = await requireStudentProfileId();
  const enrollment = await repository.findEnrollmentForCourse(studentId, input.courseId);

  if (!enrollment || getCourseAccessStatus(enrollment) !== "AVAILABLE") {
    redirect("/app/forbidden");
  }

  const lesson = await repository.getActiveLessonForStudent(input.courseId, input.lessonId);

  if (!lesson) {
    notFound();
  }

  return repository.upsertLessonNote(studentId, input.lessonId, input.content);
}

export async function getStudentNotebook(input: NotebookQueryInput) {
  const studentId = await requireStudentProfileId();
  const courseOptions = await repository.listNotebookCourseOptions(studentId);
  const selectedCourseId = input.courseId ?? courseOptions[0]?.course.id ?? null;

  if (!selectedCourseId) {
    return {
      courseOptions: [],
      selectedCourseId: null,
      groups: [],
      query: input.query,
    };
  }

  const enrollment = await repository.findEnrollmentForCourse(studentId, selectedCourseId);

  if (!enrollment || getCourseAccessStatus(enrollment) !== "AVAILABLE") {
    redirect("/app/forbidden");
  }

  const notes = await repository.listNotebookNotes(studentId, selectedCourseId, input.query);

  return {
    courseOptions: courseOptions.map((option) => option.course),
    selectedCourseId,
    groups: groupNotesByModule(notes),
    query: input.query,
  };
}

export async function getOwnStudentProfile() {
  const studentId = await requireStudentProfileId();
  return repository.getStudentProfile(studentId);
}

export async function updateOwnStudentProfile(input: StudentProfileInput) {
  const studentId = await requireStudentProfileId();
  return repository.updateStudentProfile(studentId, input);
}

async function requireStudentProfileId() {
  const user = await requireAnyRole(["STUDENT"]);

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

  if (enrollment.status === "CANCELED") {
    return "CANCELED";
  }

  if (enrollment.course.status !== "ACTIVE" || enrollment.status !== "ACTIVE" || enrollment.startsAt > now) {
    return "INACTIVE";
  }

  if (enrollment.expiresAt && enrollment.expiresAt <= now) {
    return "EXPIRED";
  }

  return "AVAILABLE";
}

type CourseModuleRow = NonNullable<
  Awaited<ReturnType<typeof repository.getCourseWithActiveContent>>
>["modules"];

function buildLessonNavigation(
  modules: CourseModuleRow,
  lessonId: string,
  completedLessonIds: Set<string>,
) {
  const lessons = modules.flatMap((module) =>
    module.lessons.map((lesson) => ({
      ...lesson,
      moduleId: module.id,
      moduleTitle: module.title,
      completed: completedLessonIds.has(lesson.id),
    })),
  );
  const currentIndex = lessons.findIndex((lesson) => lesson.id === lessonId);

  return {
    modules,
    completedLessonIds,
    previousLesson: currentIndex > 0 ? lessons[currentIndex - 1] : null,
    nextLesson: currentIndex >= 0 && currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null,
  };
}

function buildContinueHrefFromCourseModules(
  modules: CourseModuleRow,
  completedLessonIds: Set<string>,
  courseId: string,
) {
  const lessons = modules.flatMap((module) => module.lessons);
  if (lessons.length === 0) {
    return null;
  }

  const firstNotCompleted = lessons.find((lesson) => !completedLessonIds.has(lesson.id));
  const targetLesson = firstNotCompleted ?? lessons[lessons.length - 1];

  return `/app/courses/${courseId}/lessons/${targetLesson.id}`;
}

async function resolveContinueLessonCard(
  studentId: string,
  courseIds: string[],
): Promise<ContinueLessonCard> {
  const recentProgress = await repository.findMostRecentLessonProgress(studentId);

  if (recentProgress) {
    return buildContinueLessonCardFromRecentProgress(recentProgress);
  }

  for (const courseId of courseIds) {
    const enrollment = await repository.findEnrollmentForCourse(studentId, courseId);
    if (!enrollment || getCourseAccessStatus(enrollment) !== "AVAILABLE") {
      continue;
    }

    const [course, completedLessonIds] = await Promise.all([
      repository.getCourseWithActiveContent(courseId),
      repository.getCompletedLessonIds(studentId, courseId),
    ]);

    if (!course) {
      continue;
    }

    const card = buildContinueLessonCardFromCourseModules(
      course.modules,
      completedLessonIds,
      courseId,
      course.title,
    );
    if (card) {
      return card;
    }
  }

  return null;
}

function buildContinueLessonCardFromRecentProgress(
  recentProgress: NonNullable<Awaited<ReturnType<typeof repository.findMostRecentLessonProgress>>>,
): ContinueLessonCard {
  return {
    href: `/app/courses/${recentProgress.lesson.module.course.id}/lessons/${recentProgress.lesson.id}`,
    courseTitle: recentProgress.lesson.module.course.title,
    moduleTitle: recentProgress.lesson.module.title,
    lessonTitle: recentProgress.lesson.title,
    lessonPosition: recentProgress.lesson.position,
    modulePosition: recentProgress.lesson.module.position,
    mode: recentProgress.status === "COMPLETED" ? "REVIEW_LAST" : "NEXT_LESSON",
  };
}

function buildContinueLessonCardFromCourseModules(
  modules: CourseModuleRow,
  completedLessonIds: Set<string>,
  courseId: string,
  courseTitle: string,
): ContinueLessonCard {
  const lessons = modules.flatMap((module) =>
    module.lessons.map((lesson) => ({
      lesson,
      module,
    })),
  );

  if (lessons.length === 0) {
    return null;
  }

  const nextItem = lessons.find((item) => !completedLessonIds.has(item.lesson.id));
  if (nextItem) {
    return {
      href: `/app/courses/${courseId}/lessons/${nextItem.lesson.id}`,
      courseTitle,
      moduleTitle: nextItem.module.title,
      lessonTitle: nextItem.lesson.title,
      lessonPosition: nextItem.lesson.position,
      modulePosition: nextItem.module.position,
      mode: "NEXT_LESSON",
    };
  }

  const lastItem = lessons[lessons.length - 1];
  return {
    href: `/app/courses/${courseId}/lessons/${lastItem.lesson.id}`,
    courseTitle,
    moduleTitle: lastItem.module.title,
    lessonTitle: lastItem.lesson.title,
    lessonPosition: lastItem.lesson.position,
    modulePosition: lastItem.module.position,
    mode: "REVIEW_LAST",
  };
}

type NotebookNoteRow = Awaited<ReturnType<typeof repository.listNotebookNotes>>[number];

function groupNotesByModule(notes: NotebookNoteRow[]) {
  const groups = new Map<
    string,
    {
      moduleId: string;
      moduleTitle: string;
      modulePosition: number;
      notes: Array<{
        id: string;
        lessonId: string;
        lessonTitle: string;
        lessonPosition: number;
        content: string;
        updatedAt: Date;
      }>;
    }
  >();

  for (const note of notes) {
    const lessonModule = note.lesson.module;
    const existing = groups.get(lessonModule.id);
    const group = existing ?? {
      moduleId: lessonModule.id,
      moduleTitle: lessonModule.title,
      modulePosition: lessonModule.position,
      notes: [],
    };

    group.notes.push({
      id: note.id,
      lessonId: note.lesson.id,
      lessonTitle: note.lesson.title,
      lessonPosition: note.lesson.position,
      content: note.content,
      updatedAt: note.updatedAt,
    });
    groups.set(lessonModule.id, group);
  }

  return Array.from(groups.values()).sort((a, b) => a.modulePosition - b.modulePosition);
}
