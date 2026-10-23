import * as repository from "@/server/repositories/student-repository";
import * as plans from "@/server/repositories/study-plan-repository";
import { getCourseAccessStatus, requireStudentProfileId } from "@/server/services/student-service";
import {
  addDays,
  buildSchedule,
  countLessons,
  diffDays,
  FALLBACK_LESSON_SECONDS,
  minutesPerDayForDeadline,
  totalSeconds,
  type BlockedRange,
  type PlannerCourse,
} from "@/server/services/study-planner";

export const MAX_SCHEDULE_COURSES = 5;
export const MIN_BLOCK_DAYS = 5;
export const MAX_BLOCK_DAYS = 365;
const MIN_DAILY_MINUTES = 1;
const MAX_DAILY_MINUTES = 16 * 60;

export type CourseMode = "sequential" | "modules";
export type CourseModes = Record<string, CourseMode>;
export type StudyPlanInput = {
  courseIds: string[];
  modes?: CourseModes;
  targetDate?: string;
  minutesPerDay?: number;
  // Sem valor, mantem os periodos reservados que ainda nao terminaram.
  blocked?: BlockedRange[];
};
export type RescheduleInput = { kind: "catchup" } | { kind: "block"; start: string; days: number };
export type StudyPlanError =
  | "invalid_block"
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
async function loadPlannerCourses(studentId: string, courseIds: string[], modes: CourseModes = {}) {
  const rows = await plans.listRemainingLessons(studentId, courseIds);
  const courses: PlannerCourse[] = courseIds.map((courseId) => ({
    courseId,
    byModule: modes[courseId] === "modules",
    lessons: rows
      .filter((row) => row.module.courseId === courseId)
      .map((row) => ({
        id: row.id,
        title: row.title,
        moduleTitle: row.module.title,
        moduleId: row.module.id,
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
      modes: readModes(stored.courseModes),
      blocked: readBlocked(stored.blockedRanges).filter((range) => range.end >= today),
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

  const [enrolled, prefs, current] = await Promise.all([
    listEnrolledCourses(studentId),
    plans.getStudyPreferences(studentId),
    plans.getStudySchedule(studentId),
  ]);
  const today = todayInSaoPaulo();
  const blocked = input.blocked ?? readBlocked(current?.blockedRanges).filter((range) => range.end >= today);
  const chosen =courseIds.map((id) => enrolled.find((course) => course.id === id && course.available));

  if (courseIds.length === 0 || chosen.some((course) => !course)) return "invalid_courses";

  const modes = Object.fromEntries(courseIds.map((id) => [id, input.modes?.[id] === "modules" ? "modules" : "sequential"])) as CourseModes;
  const { courses } = await loadPlannerCourses(studentId, courseIds, modes);

  if (countLessons(courses) === 0) return "no_lessons";

  const base = { courses, startDate: today, weekdays: prefs.studyWeekdays, startMinute: prefs.studyStartMinute, blocked };
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
    courseModes: modes,
    blockedRanges: blocked,
    targetDate: new Date(`${input.targetDate ?? finish}T00:00:00.000Z`),
    dailyMinutes,
    schedule,
  });
  return null;
}

// Troca o modo (sequencial ou por modulos) de um curso que ja esta no cronograma e refaz o calendario com os mesmos minutos por dia.
export async function setCourseScheduleMode(courseId: string, mode: CourseMode): Promise<StudyPlanError | null> {
  const stored = await plans.getStudySchedule(await requireStudentProfileId());

  if (!stored?.courseIds.includes(courseId)) return "invalid_courses";

  return saveStudySchedule({
    courseIds: stored.courseIds,
    modes: { ...readModes(stored.courseModes), [courseId]: mode },
    minutesPerDay: stored.dailyMinutes,
  });
}

// Refaz o calendario a partir de hoje com as aulas ainda nao assistidas (as atrasadas entram de novo), mantendo cursos,
// modos e minutos por dia. "block" reserva antes um periodo sem estudo (minimo MIN_BLOCK_DAYS dias, a partir de hoje).
export async function rescheduleStudySchedule(input: RescheduleInput): Promise<StudyPlanError | null> {
  const stored = await plans.getStudySchedule(await requireStudentProfileId());

  if (!stored) return "invalid_courses";

  const today = todayInSaoPaulo();
  const blocked = readBlocked(stored.blockedRanges).filter((range) => range.end >= today);

  if (input.kind === "block") {
    const validStart = /^\d{4}-\d{2}-\d{2}$/.test(input.start) && input.start >= today;

    if (!validStart || !Number.isInteger(input.days) || input.days < MIN_BLOCK_DAYS || input.days > MAX_BLOCK_DAYS) {
      return "invalid_block";
    }

    blocked.push({ start: input.start, end: addDays(input.start, input.days - 1) });
  }

  return saveStudySchedule({
    courseIds: stored.courseIds,
    modes: readModes(stored.courseModes),
    minutesPerDay: stored.dailyMinutes,
    blocked,
  });
}

export async function removeBlockedRange(start: string): Promise<StudyPlanError | null> {
  const stored = await plans.getStudySchedule(await requireStudentProfileId());

  if (!stored) return "invalid_courses";

  return saveStudySchedule({
    courseIds: stored.courseIds,
    modes: readModes(stored.courseModes),
    minutesPerDay: stored.dailyMinutes,
    blocked: readBlocked(stored.blockedRanges).filter((range) => range.start !== start),
  });
}

function readBlocked(value: unknown): BlockedRange[] {
  return Array.isArray(value) ? (value as BlockedRange[]).filter((range) => range?.start && range?.end) : [];
}

// Modo do curso no cronograma atual; null quando o curso nao esta nele.
export async function getCourseScheduleMode(courseId: string): Promise<CourseMode | null> {
  const stored = await plans.getStudySchedule(await requireStudentProfileId());

  return stored?.courseIds.includes(courseId) ? (readModes(stored.courseModes)[courseId] ?? "sequential") : null;
}

function readModes(value: unknown): CourseModes {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as CourseModes) : {};
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
