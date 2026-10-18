import { redirect } from "next/navigation";

import * as repository from "@/server/repositories/student-repository";
import * as plans from "@/server/repositories/study-plan-repository";
import { getCourseAccessStatus, requireStudentProfileId } from "@/server/services/student-service";
import {
  addDays,
  buildSchedule,
  diffDays,
  FALLBACK_LESSON_SECONDS,
  minutesPerDayForDeadline,
  totalSeconds,
  type PlannerLesson,
} from "@/server/services/study-planner";

const MIN_DAILY_MINUTES = 5;
const MAX_DAILY_MINUTES = 16 * 60;

export type StudyPlanInput = { targetDate?: string; days?: number; hoursPerDay?: number };
export type StudyPlanError = "no_lessons" | "past_date" | "no_study_days" | "after_expiry";

const saoPauloDate = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" });

export function todayInSaoPaulo() {
  return saoPauloDate.format(new Date());
}

async function requireAvailableCourse(studentId: string, courseId: string) {
  const enrollment = await repository.findEnrollmentForCourse(studentId, courseId);

  if (!enrollment || getCourseAccessStatus(enrollment) !== "AVAILABLE") {
    redirect("/app/forbidden");
  }

  return enrollment;
}

async function loadPlannerContext(studentId: string, courseId: string) {
  const [rows, prefs] = await Promise.all([
    plans.listRemainingLessons(studentId, courseId),
    plans.getStudyPreferences(studentId),
  ]);
  const lessons: PlannerLesson[] = rows.map((row) => ({
    id: row.id,
    title: row.title,
    moduleTitle: row.module.title,
    seconds: row.durationSeconds ?? FALLBACK_LESSON_SECONDS,
  }));
  const estimatedLessons = rows.filter((row) => row.durationSeconds === null).length;
  return { lessons, estimatedLessons, prefs };
}

export async function getStudyPlanView(courseId: string) {
  const studentId = await requireStudentProfileId();
  const enrollment = await requireAvailableCourse(studentId, courseId);
  const [{ lessons, estimatedLessons, prefs }, plan] = await Promise.all([
    loadPlannerContext(studentId, courseId),
    plans.getStudyPlan(studentId, courseId),
  ]);
  const today = todayInSaoPaulo();
  const days = plan ? await hydrateSchedule(studentId, plan.schedule) : [];
  const targetDate = plan ? plan.targetDate.toISOString().slice(0, 10) : null;
  const finishDate = days.length > 0 ? days[days.length - 1].date : null;
  const overdue = days.flatMap((day) => (day.date < today ? day.lessons : [])).filter((lesson) => !lesson.completed).length;

  return {
    course: enrollment.course,
    prefs,
    today,
    remaining: { lessons: lessons.length, seconds: totalSeconds(lessons), estimatedLessons },
    plan: plan && {
      targetDate,
      dailyMinutes: plan.dailyMinutes,
      days,
      finishDate,
      overdue,
    },
  };
}

// Retorna o codigo do erro ou null quando o plano foi salvo.
export async function saveStudyPlan(courseId: string, input: StudyPlanInput): Promise<StudyPlanError | null> {
  const studentId = await requireStudentProfileId();
  const enrollment = await requireAvailableCourse(studentId, courseId);
  const { lessons, prefs } = await loadPlannerContext(studentId, courseId);

  if (lessons.length === 0) {
    return "no_lessons";
  }

  const today = todayInSaoPaulo();
  const base = { lessons, startDate: today, weekdays: prefs.studyWeekdays, startMinute: prefs.studyStartMinute };
  let dailyMinutes: number;
  let targetDate: string;

  if (input.hoursPerDay !== undefined) {
    dailyMinutes = clampMinutes(Math.round(input.hoursPerDay * 60));
    const days = buildSchedule({ ...base, dailyMinutes });
    targetDate = days[days.length - 1]?.date ?? today;
  } else {
    targetDate = input.targetDate ?? addDays(today, input.days ?? 1);

    if (targetDate < today) {
      return "past_date";
    }

    const minutes = minutesPerDayForDeadline({ ...base, targetDate });

    if (minutes === null) {
      return "no_study_days";
    }

    dailyMinutes = clampMinutes(minutes);
  }

  if (enrollment.expiresAt && diffDays(saoPauloDate.format(enrollment.expiresAt), targetDate) > 0) {
    return "after_expiry";
  }

  const schedule = buildSchedule({ ...base, dailyMinutes }).map((day) => ({
    date: day.date,
    lessons: day.lessons.map((lesson) => ({ id: lesson.id, start: lesson.startMinute, end: lesson.endMinute })),
  }));
  await plans.upsertStudyPlan(studentId, courseId, new Date(`${targetDate}T00:00:00.000Z`), dailyMinutes, schedule);
  return null;
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
