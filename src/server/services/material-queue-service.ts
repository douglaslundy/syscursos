import type { LessonAiKind } from "@/server/services/ai/ai-content-service";
import { generateAiContent } from "@/server/services/ai/ai-content-service";
import { getActiveTechniques } from "@/server/services/ai/ai-settings-service";
import { prisma } from "@/lib/db/prisma";
import { requireStudentProfileId } from "@/server/services/student-service";
import { listAvailableCourses } from "@/server/services/study-access";

export type MaterialKind = "quiz" | "summary" | "mindmap" | "flashcards";

const KIND: Record<MaterialKind, LessonAiKind> = { quiz: "QUIZ", summary: "SUMMARY", mindmap: "MINDMAP", flashcards: "FLASHCARDS" };
const BATCH = 3;

// Aulas CONCLUIDAS (e com transcricao) do curso que ainda nao tem o material pedido. Um curso por vez.
async function pendingLessons(courseId: string, kind: MaterialKind, technique: string) {
  const studentId = await requireStudentProfileId();

  if (!(await listAvailableCourses(studentId)).some((course) => course.id === courseId)) return null;

  const withTechnique = kind === "summary" || kind === "mindmap";
  const lessons = await prisma.lesson.findMany({
    where: { status: "ACTIVE", module: { courseId, status: "ACTIVE" }, progress: { some: { studentId, status: "COMPLETED" } } },
    orderBy: [{ module: { position: "asc" } }, { position: "asc" }],
    select: { id: true, title: true, transcript: true, aiContents: { where: { kind: { in: ["SUMMARY", KIND[kind]] } }, select: { kind: true, technique: true } } },
  });
  const has = (lesson: (typeof lessons)[number], k: LessonAiKind) => lesson.aiContents.some((row) => row.kind === k && (!withTechnique || k === "QUIZ" || row.technique === technique));
  const missing = lessons.filter((lesson) => !has(lesson, KIND[kind]));

  return {
    completed: lessons.length,
    withoutTranscript: missing.filter((lesson) => !lesson.transcript).length,
    // Mapa mental parte do resumo da mesma tecnica.
    withoutSummary: kind === "mindmap" ? missing.filter((lesson) => lesson.transcript && !has(lesson, "SUMMARY")).length : 0,
    ready: missing.filter((lesson) => lesson.transcript && (kind !== "mindmap" || has(lesson, "SUMMARY"))).map((lesson) => ({ lessonId: lesson.id, title: lesson.title })),
  };
}

async function resolveTechnique(kind: MaterialKind, technique?: string) {
  if (kind !== "summary" && kind !== "mindmap") return "";

  const active = await getActiveTechniques();

  return technique && active.includes(technique as never) ? technique : (active[0] ?? "");
}

export async function countPendingMaterials(courseId: string, kind: MaterialKind, technique?: string) {
  const tech = await resolveTechnique(kind, technique);
  const found = await pendingLessons(courseId, kind, tech);

  return found && { technique: tech || undefined, completedLessons: found.completed, pending: found.ready.length, withoutTranscript: found.withoutTranscript, withoutSummary: found.withoutSummary, lessons: found.ready.slice(0, 20).map((lesson) => lesson.title) };
}

// Gera ate BATCH aulas por chamada (cada geracao e uma chamada de IA); o agente repete ate acabar.
export async function generatePendingMaterials(courseId: string, kind: MaterialKind, technique?: string) {
  const tech = await resolveTechnique(kind, technique);
  const found = await pendingLessons(courseId, kind, tech);

  if (!found) return null;

  const generated: string[] = [];
  const failed: Array<{ title: string; error: string }> = [];

  for (const lesson of found.ready.slice(0, BATCH)) {
    const result = await generateAiContent({ courseId, lessonId: lesson.lessonId, kind: KIND[kind], technique: tech || undefined });

    if (result.ok) generated.push(lesson.title);
    else {
      failed.push({ title: lesson.title, error: result.error });
      // Erro que vale para todas as aulas: para aqui em vez de repetir a falha.
      if (["no_provider", "invalid_key", "quota", "rate_limited"].includes(result.error)) break;
    }
  }

  return { generated, failed, remaining: Math.max(0, found.ready.length - generated.length - failed.length) };
}
