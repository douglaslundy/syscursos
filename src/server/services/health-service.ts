import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/server/auth/guards";
import { getActiveAiProvider } from "@/server/services/ai/ai-settings-service";
import { listAuditLogs } from "@/server/services/audit-service";
import { getGeminiApiKey, getGoogleApiKey, isRegistrationOpen } from "@/server/services/settings-service";

const DAY_MS = 86_400_000;

// Painel de saude do admin: configuracao, lacunas de conteudo, custo de IA e ultimas acoes sensiveis.
export async function getSystemHealth() {
  const admin = await requireRole("ADMIN");
  const orgLessons = { status: "ACTIVE" as const, module: { course: { organizationId: admin.organizationId } } };
  const since = new Date(Date.now() - 30 * DAY_MS);
  const [lessons, noDuration, noTranscript, usage, aiProvider, googleKey, geminiKey, registrationOpen, logs, pendingQuestions] = await Promise.all([
    prisma.lesson.count({ where: orgLessons }),
    prisma.lesson.count({ where: { ...orgLessons, durationSeconds: null } }),
    prisma.lesson.count({ where: { ...orgLessons, transcript: null } }),
    prisma.aiUsage.groupBy({ by: ["courseId"], where: { createdAt: { gte: since } }, _sum: { inputTokens: true, outputTokens: true }, _count: { _all: true } }),
    getActiveAiProvider(),
    getGoogleApiKey(),
    getGeminiApiKey(),
    isRegistrationOpen(),
    listAuditLogs(50),
    prisma.lessonQuestion.count({ where: { answeredAt: null, course: { organizationId: admin.organizationId } } }),
  ]);
  const courseIds = usage.flatMap((row) => (row.courseId ? [row.courseId] : []));
  const [courses, actors] = await Promise.all([
    prisma.course.findMany({ where: { id: { in: courseIds } }, select: { id: true, title: true } }),
    prisma.user.findMany({ where: { id: { in: logs.flatMap((log) => (log.actorId ? [log.actorId] : [])) } }, select: { id: true, name: true } }),
  ]);
  const courseTitle = new Map(courses.map((course) => [course.id, course.title]));
  const actorName = new Map(actors.map((actor) => [actor.id, actor.name]));

  return {
    lessons,
    noDuration,
    noTranscript,
    aiProvider,
    hasGoogleKey: googleKey !== null,
    hasGeminiKey: geminiKey !== null,
    hasEncryptionKey: Boolean(process.env.SETTINGS_ENCRYPTION_KEY),
    hasCronSecret: Boolean(process.env.CRON_SECRET),
    registrationOpen,
    pendingQuestions,
    aiCost: usage
      .map((row) => ({
        course: row.courseId ? (courseTitle.get(row.courseId) ?? "Curso removido") : "Sem curso",
        calls: row._count._all,
        tokens: (row._sum.inputTokens ?? 0) + (row._sum.outputTokens ?? 0),
      }))
      .sort((a, b) => b.tokens - a.tokens)
      .slice(0, 8),
    audit: logs.map((log) => ({
      id: log.id,
      when: log.createdAt.toISOString(),
      who: log.actorId ? (actorName.get(log.actorId) ?? "Usuario removido") : "Sistema",
      action: log.action,
      entity: log.entity,
      entityId: log.entityId,
    })),
  };
}
