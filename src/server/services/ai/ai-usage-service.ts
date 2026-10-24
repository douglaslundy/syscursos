import { Prisma } from "@prisma/client";

import { monthRange } from "@/lib/ai/usage-range";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/server/auth/guards";

export type UsageFilters = { month?: string; provider?: string; courseId?: string; studentId?: string };
export type UsageTotals = { calls: number; inputTokens: number; outputTokens: number; totalTokens: number };
export type UsageRow = { label: string; totals: UsageTotals };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PROVIDERS = ["openai", "gemini", "anthropic"];

function toTotals(sum: { inputTokens: number | null; outputTokens: number | null }, calls: number): UsageTotals {
  const inputTokens = sum.inputTokens ?? 0;
  const outputTokens = sum.outputTokens ?? 0;

  return { calls, inputTokens, outputTokens, totalTokens: inputTokens + outputTokens };
}

const byTotal = (a: UsageRow, b: UsageRow) => b.totals.totalTokens - a.totals.totalTokens;

export async function getAiUsageReport(filters: UsageFilters) {
  await requireRole("ADMIN");

  const range = monthRange(filters.month);
  const provider = filters.provider && PROVIDERS.includes(filters.provider) ? filters.provider : null;
  const courseId = filters.courseId && UUID.test(filters.courseId) ? filters.courseId : null;
  const studentId = filters.studentId && UUID.test(filters.studentId) ? filters.studentId : null;
  const where: Prisma.AiUsageWhereInput = {
    ...(range ? { createdAt: { gte: range.from, lt: range.to } } : {}),
    ...(provider ? { provider } : {}),
    ...(courseId ? { courseId } : {}),
    ...(studentId ? { studentId } : {}),
  };
  const sum = { inputTokens: true, outputTokens: true } as const;

  // A tabela por mes ignora o filtro de mes: serve para comparar os meses entre si.
  const [total, byProvider, byCourse, byStudent, byMonth, courses, students] = await Promise.all([
    prisma.aiUsage.aggregate({ where, _sum: sum, _count: true }),
    prisma.aiUsage.groupBy({ by: ["provider"], where, _sum: sum, _count: true }),
    prisma.aiUsage.groupBy({ by: ["courseId"], where, _sum: sum, _count: true }),
    prisma.aiUsage.groupBy({ by: ["studentId"], where, _sum: sum, _count: true }),
    prisma.$queryRaw<Array<{ month: string; input: bigint; output: bigint; calls: bigint }>>`
      SELECT to_char(created_at AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM') AS month,
             SUM(input_tokens)::bigint AS input, SUM(output_tokens)::bigint AS output, COUNT(*)::bigint AS calls
      FROM ai_usage_logs
      WHERE (${provider}::text IS NULL OR provider = ${provider}::text)
        AND (${courseId}::uuid IS NULL OR course_id = ${courseId}::uuid)
        AND (${studentId}::uuid IS NULL OR student_id = ${studentId}::uuid)
      GROUP BY 1 ORDER BY 1 DESC LIMIT 24`,
    prisma.course.findMany({ where: { aiUsages: { some: {} } }, select: { id: true, title: true }, orderBy: { title: "asc" } }),
    prisma.studentProfile.findMany({
      where: { aiUsages: { some: {} } },
      select: { id: true, user: { select: { name: true } } },
      orderBy: { user: { name: "asc" } },
    }),
  ]);
  const courseName = new Map(courses.map((course) => [course.id, course.title]));
  const studentName = new Map(students.map((student) => [student.id, student.user.name]));

  return {
    total: toTotals(total._sum, total._count),
    byProvider: byProvider.map((row): UsageRow => ({ label: row.provider, totals: toTotals(row._sum, row._count) })).sort(byTotal),
    byCourse: byCourse
      .map((row): UsageRow => ({ label: courseName.get(row.courseId ?? "") ?? "Curso removido", totals: toTotals(row._sum, row._count) }))
      .sort(byTotal),
    byStudent: byStudent
      .map((row): UsageRow => ({ label: studentName.get(row.studentId ?? "") ?? "Aluno removido", totals: toTotals(row._sum, row._count) }))
      .sort(byTotal),
    byMonth: byMonth.map(
      (row): UsageRow => ({
        label: row.month,
        totals: toTotals({ inputTokens: Number(row.input), outputTokens: Number(row.output) }, Number(row.calls)),
      }),
    ),
    courses,
    students: students.map((student) => ({ id: student.id, name: student.user.name })),
  };
}
