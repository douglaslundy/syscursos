import { Prisma } from "@prisma/client";

import { gradeQuiz, parseQuiz, type Quiz } from "@/lib/ai/quiz";
import { buildExamPrompt } from "@/lib/ai/prompts";
import { prisma } from "@/lib/db/prisma";
import { allowAiCall } from "@/server/services/ai/ai-content-service";
import { getActiveAiCredentials } from "@/server/services/ai/ai-settings-service";
import { callProvider } from "@/server/services/ai/providers";
import type { QuizSubmitResult } from "@/server/services/quiz-service";
import { requireStudentProfileId } from "@/server/services/student-service";
import { listAvailableCourses } from "@/server/services/study-access";

export const PASS_SCORE = 0.7;

const MAX_LESSONS = 80;
const EXCERPT_CHARS = 1_500;
const MAX_MATERIAL_CHARS = 120_000;

export type ExamError = "forbidden" | "no_material" | "no_provider" | "rate_limited" | "invalid_key" | "quota" | "failed";

async function canTakeExam(courseId: string) {
  const studentId = await requireStudentProfileId();
  const allowed = (await listAvailableCourses(studentId)).some((course) => course.id === courseId);

  return allowed ? studentId : null;
}

export async function getCourseExam(courseId: string): Promise<Quiz | null> {
  const row = await prisma.courseExam.findUnique({ where: { courseId }, select: { content: true } });

  return row ? parseQuiz(row.content) : null;
}

// Trecho de cada aula que serve de base da prova: resumo (se houver) ou o comeco da transcricao.
async function examMaterial(courseId: string) {
  const lessons = await prisma.lesson.findMany({
    where: { status: "ACTIVE", module: { courseId, status: "ACTIVE" } },
    orderBy: [{ module: { position: "asc" } }, { position: "asc" }],
    take: MAX_LESSONS,
    select: { title: true, transcript: true, aiContents: { where: { kind: "SUMMARY" }, take: 1, select: { content: true } } },
  });
  let budget = MAX_MATERIAL_CHARS;

  return lessons.flatMap((lesson) => {
    const source = lesson.aiContents[0]?.content ?? lesson.transcript;

    if (!source || budget <= 0) return [];

    const excerpt = source.slice(0, Math.min(EXCERPT_CHARS, budget));
    budget -= excerpt.length;
    return [{ title: lesson.title, excerpt }];
  });
}

const inFlight = new Map<string, Promise<{ ok: true; quiz: Quiz; created: boolean } | { ok: false; error: ExamError }>>();

// Devolve a prova final salva ou gera uma unica vez (compartilhada por todos os alunos do curso, sem novo gasto de IA).
export function ensureCourseExam(courseId: string) {
  const pending = inFlight.get(courseId) ?? runEnsure(courseId).finally(() => inFlight.delete(courseId));

  inFlight.set(courseId, pending);
  return pending;
}

async function runEnsure(courseId: string): Promise<{ ok: true; quiz: Quiz; created: boolean } | { ok: false; error: ExamError }> {
  const studentId = await canTakeExam(courseId);

  if (!studentId) return { ok: false, error: "forbidden" };

  const existing = await getCourseExam(courseId);

  if (existing) return { ok: true, quiz: existing, created: false };

  const material = await examMaterial(courseId);

  if (material.length === 0) return { ok: false, error: "no_material" };

  const credentials = await getActiveAiCredentials();

  if (!credentials) return { ok: false, error: "no_provider" };
  if (!allowAiCall(studentId)) return { ok: false, error: "rate_limited" };

  const course = await prisma.course.findUnique({ where: { id: courseId }, select: { title: true } });
  const result = await callProvider(credentials.provider, credentials.key, buildExamPrompt({ courseTitle: course?.title ?? "Curso", lessons: material }));

  if (!result.ok) return { ok: false, error: result.reason === "invalid_key" || result.reason === "quota" ? result.reason : "failed" };

  await prisma.aiUsage.create({
    data: { provider: credentials.provider, model: result.model, kind: "EXAM", inputTokens: result.inputTokens, outputTokens: result.outputTokens, studentId, courseId },
  });

  const quiz = parseQuiz(result.text);

  if (!quiz) return { ok: false, error: "failed" };

  try {
    await prisma.courseExam.create({ data: { courseId, content: JSON.stringify(quiz), provider: credentials.provider, model: result.model, createdById: studentId } });
  } catch (error) {
    // Outro aluno gerou ao mesmo tempo: vale a prova que ficou salva.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const saved = await getCourseExam(courseId);
      if (saved) return { ok: true, quiz: saved, created: false };
    }
    throw error;
  }

  return { ok: true, quiz, created: true };
}

export async function submitExam(input: { courseId: string; answers: Array<number | null> }): Promise<QuizSubmitResult> {
  const studentId = await canTakeExam(input.courseId);

  if (!studentId) return { ok: false, error: "forbidden" };

  const quiz = await getCourseExam(input.courseId);

  if (!quiz) return { ok: false, error: "no_quiz" };
  if (input.answers.length !== quiz.questions.length) return { ok: false, error: "invalid" };

  const score = gradeQuiz(quiz, input.answers);

  await prisma.quizAttempt.create({ data: { studentId, courseId: input.courseId, score, total: quiz.questions.length, answers: input.answers } });

  return {
    ok: true,
    score,
    total: quiz.questions.length,
    results: quiz.questions.map((question, index) => ({
      correct: input.answers[index] === question.correct,
      chosen: input.answers[index],
      answer: question.correct,
      explanation: question.explanation,
    })),
  };
}

// Melhor nota do aluno na prova final (0 a 1) ou null se nunca fez.
export async function bestExamScore(studentId: string, courseId: string) {
  const attempts = await prisma.quizAttempt.findMany({ where: { studentId, courseId, lessonId: null }, select: { score: true, total: true } });

  return attempts.length === 0 ? null : Math.max(...attempts.map((attempt) => attempt.score / attempt.total));
}
