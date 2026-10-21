import { prisma } from "@/lib/db/prisma";
import { currentStreak, dayKey } from "@/lib/study/streak";

const LOOKBACK_DAYS = 7;
const MAX_ROWS = 5_000;

const asDate = (key: string) => new Date(`${key}T00:00:00.000Z`);

// Aviso no sistema para quem vinha estudando nos ultimos 7 dias e ainda nao estudou hoje. Roda 1x por dia (cron).
// Sem e-mail: a plataforma nao tem provedor de envio configurado.
export async function sendStudyReminders(now = new Date()) {
  const today = dayKey(now);
  const rows = await prisma.studyDay.findMany({
    where: { day: { gte: asDate(dayKey(new Date(now.getTime() - LOOKBACK_DAYS * 86_400_000))) }, OR: [{ seconds: { gte: 60 } }, { lessons: { gt: 0 } }] },
    select: { studentId: true, day: true },
    take: MAX_ROWS,
  });
  const byStudent = new Map<string, string[]>();

  for (const row of rows) byStudent.set(row.studentId, [...(byStudent.get(row.studentId) ?? []), row.day.toISOString().slice(0, 10)]);

  const pending = Array.from(byStudent.entries()).filter(([, days]) => !days.includes(today));

  if (pending.length === 0) return 0;

  const profiles = await prisma.studentProfile.findMany({ where: { id: { in: pending.map(([id]) => id) } }, select: { id: true, userId: true } });
  const userIds = profiles.map((profile) => profile.userId);
  const already = await prisma.notification.findMany({
    where: { userId: { in: userIds }, kind: "study_reminder", createdAt: { gte: asDate(today) } },
    select: { userId: true },
  });
  const skip = new Set(already.map((row) => row.userId));
  const streaks = new Map(pending.map(([id, days]) => [id, currentStreak(days, now)]));
  const data = profiles
    .filter((profile) => !skip.has(profile.userId))
    .map((profile) => {
      const streak = streaks.get(profile.id) ?? 0;

      return {
        userId: profile.userId,
        kind: "study_reminder",
        title: streak > 0 ? `Voce esta ha ${streak} ${streak === 1 ? "dia" : "dias"} seguidos estudando. Estude hoje para manter a sequencia!` : "Vamos retomar os estudos hoje?",
        href: "/app/review",
      };
    });

  if (data.length > 0) await prisma.notification.createMany({ data });

  return data.length;
}
