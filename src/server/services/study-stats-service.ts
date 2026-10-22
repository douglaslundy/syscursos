import { prisma } from "@/lib/db/prisma";
import { normalizeRate } from "@/lib/study/playback";
import { currentStreak, dayKey, longestStreak, weekStart } from "@/lib/study/streak";
import { requireStudentProfileId } from "@/server/services/student-service";
import { findTranscribableLesson } from "@/server/services/transcript-service";

// Cada batimento do navegador conta no maximo 60 s (ele envia a cada 30 s); impede inflar o tempo por chamada manual.
const MAX_BEAT_SECONDS = 60;
const DAYS_SHOWN = 14;

const asDate = (key: string) => new Date(`${key}T00:00:00.000Z`);

export async function recordStudyTime(input: { courseId: string; lessonId: string; seconds: number }) {
  const found = await findTranscribableLesson(input.courseId, input.lessonId);

  if (!found) return false;

  const seconds = Math.max(1, Math.min(MAX_BEAT_SECONDS, Math.round(input.seconds)));
  const day = asDate(dayKey(new Date()));

  await prisma.studyDay.upsert({
    where: { studentId_day: { studentId: found.studentId, day } },
    create: { studentId: found.studentId, day, seconds },
    update: { seconds: { increment: seconds } },
  });

  return true;
}

// Conta a aula concluida no dia (usada na meta e nas metricas).
export async function recordLessonCompleted() {
  const studentId = await requireStudentProfileId();
  const day = asDate(dayKey(new Date()));

  await prisma.studyDay.upsert({
    where: { studentId_day: { studentId, day } },
    create: { studentId, day, lessons: 1 },
    update: { lessons: { increment: 1 } },
  });
}

export async function saveWeeklyGoal(minutes: number) {
  const studentId = await requireStudentProfileId();

  await prisma.studentProfile.update({ where: { id: studentId }, data: { weeklyGoalMinutes: Math.max(0, Math.min(7 * 24 * 60, Math.round(minutes))) } });
}

export async function getPlaybackRate() {
  const studentId = await requireStudentProfileId();
  const profile = await prisma.studentProfile.findUnique({ where: { id: studentId }, select: { playbackRate: true } });

  return normalizeRate(profile?.playbackRate);
}

export async function savePlaybackRate(rate: number) {
  const studentId = await requireStudentProfileId();

  await prisma.studentProfile.update({ where: { id: studentId }, data: { playbackRate: normalizeRate(rate) } });
}

export async function getProgressSummary(now = new Date()) {
  const studentId = await requireStudentProfileId();
  const since = asDate(dayKey(new Date(now.getTime() - 120 * 86_400_000)));
  const [days, profile, attempts, completedTotal, dueTotal] = await Promise.all([
    prisma.studyDay.findMany({ where: { studentId, day: { gte: since } }, orderBy: { day: "asc" } }),
    prisma.studentProfile.findUnique({ where: { id: studentId }, select: { weeklyGoalMinutes: true } }),
    prisma.quizAttempt.findMany({ where: { studentId }, orderBy: { createdAt: "desc" }, take: 30, select: { score: true, total: true } }),
    prisma.lessonProgress.count({ where: { studentId, status: "COMPLETED" } }),
    prisma.flashcardReview.count({ where: { studentId, dueAt: { lte: now } } }),
  ]);
  const byDay = new Map(days.map((row) => [row.day.toISOString().slice(0, 10), row]));
  const studied = days.filter((row) => row.seconds >= 60 || row.lessons > 0).map((row) => row.day.toISOString().slice(0, 10));
  const monday = weekStart(now);
  const weekSeconds = days.filter((row) => row.day.toISOString().slice(0, 10) >= monday).reduce((sum, row) => sum + row.seconds, 0);
  const weekLessons = days.filter((row) => row.day.toISOString().slice(0, 10) >= monday).reduce((sum, row) => sum + row.lessons, 0);
  const recent = Array.from({ length: DAYS_SHOWN }, (_, index) => {
    const key = dayKey(new Date(now.getTime() - (DAYS_SHOWN - 1 - index) * 86_400_000));

    return { day: key, minutes: Math.round((byDay.get(key)?.seconds ?? 0) / 60) };
  });
  const quizPoints = attempts.reduce((sum, row) => sum + row.score, 0);
  const quizTotal = attempts.reduce((sum, row) => sum + row.total, 0);

  return {
    streak: currentStreak(studied, now),
    longestStreak: longestStreak(studied),
    todayMinutes: Math.round((byDay.get(dayKey(now))?.seconds ?? 0) / 60),
    weekMinutes: Math.round(weekSeconds / 60),
    weekLessons,
    weeklyGoalMinutes: profile?.weeklyGoalMinutes ?? 0,
    recent,
    completedTotal,
    quizAverage: quizTotal > 0 ? Math.round((quizPoints / quizTotal) * 100) : null,
    dueCards: dueTotal,
  };
}
