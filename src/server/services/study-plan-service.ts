import * as repository from "@/server/repositories/student-repository";
import * as plans from "@/server/repositories/study-plan-repository";
import { getCourseAccessStatus, requireStudentProfileId } from "@/server/services/student-service";
import {
  buildSchedule,
  countLessons,
  diffDays,
  FALLBACK_LESSON_SECONDS,
  minutesPerDayForDeadline,
  totalSeconds,
  type PlannerCourse,
} from "@/server/services/study-planner";

export const MAX_SCHEDULE_COURSES = 5;
const MIN_DAILY_MINUTES = 1;
const MAX_DAILY_MINUTES = 16 * 60;

export type StudyPlanInput = { courseIds: string[]; targetDate?: string; minutesPerDay?: number };
export type StudyPlanError =
  | "no_lessons"
  | "past_date"
  | "no_study_days"
  | "after_expiry"
  | "too_many"
  | "invalid_courses"
  | "too_long";

const saoPauloDate = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" });

export function todayInSaoPaulo() {
  return saoPauloDate.format(new Date());
}

type ScheduleCourse = { id: string; title: string; expiresAt: Date | null; available: boolean };

async function listEnrolledCourses(studentId: string): Promise<ScheduleCourse[]> {
  const enrollments = await repository.listStudentCourseEnrollments(studentId);
  return enrollments.map((enrollment) => ({
    id: enrollment.course.id,
    title: enrollment.course.title,
    expiresAt: enrollment.expiresAt,
    available: getCourseAccessStatus(enrollment) === "AVAILABLE",
  }));
}

// Aulas restantes agrupadas por curso, na ordem dos ids recebidos.
async function loadPlannerCourses(studentId: string, courseIds: string[]) {
  const rows = await plans.listRemainingLessons(studentId, courseIds);
  const courses: PlannerCourse[] = courseIds.map((courseId) => ({
    courseId,
    lessons: rows
      .filter((row) => row.module.courseId === courseId)
      .map((row) => ({
        id: row.id,
        title: row.title,
        moduleTitle: row.module.title,
        seconds: row.durationSeconds || FALLBACK_LESSON_SECONDS,
      })),
  }));
  return { courses, estimatedLessons: rows.filter((row) => !row.durationSeconds).length };
}

export async function getStudyScheduleView() {
  const studentId = await requireStudentProfileId();
  const [enrolled, prefs, stored] = await Promise.all([
    listEnrolledCourses(studentId),
    plans.getStudyPreferences(studentId),
    plans.getStudySchedule(studentId),
  ]);
  const available = enrolled.filter((course) => course.available);
  const ids = Array.from(new Set([...available.map((course) => course.id), ...(stored?.courseIds ?? [])]));
  const { courses: remaining } = await loadPlannerCourses(studentId, ids);
  const remainingOf = (courseId: string) => remaining.find((course) => course.courseId === courseId)?.lessons ?? [];
  const today = todayInSaoPaulo();

  const options = available.map((course) => ({
    id: course.id,
    title: course.title,
    lessons: remainingOf(course.id).length,
    seconds: totalSeconds(remainingOf(course.id)),
  }));

  if (!stored) {
    return { today, prefs, options, plan: null };
  }

  const days = await hydrateSchedule(studentId, stored.schedule);
  const planCourses = stored.courseIds.flatMap((id) => {
    const course = enrolled.find((item) => item.id === id);
    return course ? [{ id, title: course.title, remainingLessons: remainingOf(id).length }] : [];
  });
  const overdue = days.flatMap((day) => (day.date < today ? day.lessons : [])).filter((lesson) => !lesson.completed).length;
  const activeCourses = planCourses.filter((course) => course.remainingLessons > 0).length;

  return {
    today,
    prefs,
    options,
    plan: {
      courses: planCourses,
      targetDate: stored.targetDate.toISOString().slice(0, 10),
      dailyMinutes: stored.dailyMinutes,
      days,
      finishDate: days.length > 0 ? days[days.length - 1].date : null,
      overdue,
      // Curso concluido sai da grade e libera uma vaga para outro.
      freeSlots: Math.max(0, MAX_SCHEDULE_COURSES - activeCourses),
      activeCourses,
    },
  };
}

// Retorna o codigo do erro ou null quando o cronograma foi salvo.
export async function saveStudySchedule(input: StudyPlanInput): Promise<StudyPlanError | null> {
  const studentId = await requireStudentProfileId();
  const courseIds = Array.from(new Set(input.courseIds));

  if (courseIds.length > MAX_SCHEDULE_COURSES) return "too_many";

  const [enrolled, prefs] = await Promise.all([listEnrolledCourses(studentId), plans.getStudyPreferences(studentId)]);
  const chosen = courseIds.map((id) => enrolled.find((course) => course.id === id && course.available));

  if (courseIds.length === 0 || chosen.some((course) => !course)) return "invalid_courses";

  const { courses } = await loadPlannerCourses(studentId, courseIds);

  if (countLessons(courses) === 0) return "no_lessons";

  const today = todayInSaoPaulo();
  const base = { courses, startDate: today, weekdays: prefs.studyWeekdays, startMinute: prefs.studyStartMinute };
  let dailyMinutes: number;

  if (input.minutesPerDay !== undefined) {
    dailyMinutes = clampMinutes(input.minutesPerDay);
  } else {
    const targetDate = input.targetDate ?? today;

    if (targetDate < today) return "past_date";

    const minutes = minutesPerDayForDeadline({ ...base, targetDate, maxMinutes: MAX_DAILY_MINUTES });

    if (minutes === null) return "no_study_days";

    dailyMinutes = clampMinutes(minutes);
  }

  const days = buildSchedule({ ...base, dailyMinutes });

  if (days.reduce((sum, day) => sum + day.lessons.length, 0) !== countLessons(courses)) return "too_long";

  const finish = days[days.length - 1]?.date ?? today;

  for (const course of chosen) {
    const last = days
      .flatMap((day) => day.lessons.map((lesson) => ({ date: day.date, courseId: lesson.courseId })))
      .filter((item) => item.courseId === course?.id)
      .at(-1);

    if (course?.expiresAt && last && diffDays(saoPauloDate.format(course.expiresAt), last.date) > 0) {
      return "after_expiry";
    }
  }

  const schedule = days.map((day) => ({
    date: day.date,
    lessons: day.lessons.map((lesson) => ({ id: lesson.id, start: lesson.startMinute, end: lesson.endMinute })),
  }));
  await plans.upsertStudySchedule(studentId, {
    courseIds,
    targetDate: new Date(`${input.targetDate ?? finish}T00:00:00.000Z`),
    dailyMinutes,
    schedule,
  });
  return null;
}

export async function removeStudySchedule() {
  await plans.deleteStudySchedule(await requireStudentProfileId());
}

export async function saveStudyPreferences(input: { weekdays: number[]; start: number; end: number }) {
  const studentId = await requireStudentProfileId();
  await plans.saveStudyPreferences(studentId, {
    studyWeekdays: Array.from(new Set(input.weekdays)).sort(),
    studyStartMinute: input.start,
    studyEndMinute: input.end,
  });
}

type StoredDay = { date: string; lessons: Array<{ id: string; start: number; end: number }> };
export type CronogramaLesson = {
  id: string;
  courseId: string;
  title: string;
  moduleTitle: string;
  startMinute: number;
  endMinute: number;
  completed: boolean;
};
export type CronogramaDay = { date: string; lessons: CronogramaLesson[] };

// Junta o cronograma salvo com titulo e conclusao atuais; aula removida do curso some do cronograma.
async function hydrateSchedule(studentId: string, stored: unknown): Promise<CronogramaDay[]> {
  const days = Array.isArray(stored) ? (stored as StoredDay[]) : [];
  const ids = days.flatMap((day) => day.lessons.map((lesson) => lesson.id));
  const info = new Map((await plans.listLessonsWithCompletion(studentId, ids)).map((row) => [row.id, row]));

  return days
    .map((day) => ({
      date: day.date,
      lessons: day.lessons.flatMap((item): CronogramaLesson[] => {
        const lesson = info.get(item.id);
        return lesson ? [{ ...lesson, startMinute: item.start, endMinute: item.end }] : [];
      }),
    }))
    .filter((day) => day.lessons.length > 0);
}

function clampMinutes(minutes: number) {
  return Math.min(MAX_DAILY_MINUTES, Math.max(MIN_DAILY_MINUTES, minutes));
}
