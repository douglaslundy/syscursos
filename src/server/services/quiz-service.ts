import { parseQuiz, gradeQuiz, type Quiz } from "@/lib/ai/quiz";
import { cardKey } from "@/lib/study/srs";
import { prisma } from "@/lib/db/prisma";
import { findTranscribableLesson } from "@/server/services/transcript-service";

export type QuizResult = {
  score: number;
  total: number;
  results: Array<{ correct: boolean; chosen: number | null; answer: number; explanation: string }>;
};

export type QuizSubmitResult = ({ ok: true } & QuizResult) | { ok: false; error: "forbidden" | "no_quiz" | "invalid" };

// Prefixo das chaves de revisao que vem de questoes de quiz (os cartoes de IA nao usam prefixo).
export const QUIZ_CARD_PREFIX = "quiz:";

export async function getLessonQuiz(lessonId: string): Promise<Quiz | null> {
  const row = await prisma.lessonAiContent.findUnique({
    where: { lessonId_kind_technique: { lessonId, kind: "QUIZ", technique: "" } },
    select: { content: true },
  });

  return row ? parseQuiz(row.content) : null;
}

// Corrige no servidor contra o quiz salvo, grava a tentativa e manda as questoes erradas para a fila de revisao.
export async function submitQuiz(input: { courseId: string; lessonId: string; answers: Array<number | null> }): Promise<QuizSubmitResult> {
  const found = await findTranscribableLesson(input.courseId, input.lessonId);

  if (!found) return { ok: false, error: "forbidden" };

  const quiz = await getLessonQuiz(input.lessonId);

  if (!quiz) return { ok: false, error: "no_quiz" };
  if (input.answers.length !== quiz.questions.length) return { ok: false, error: "invalid" };

  const score = gradeQuiz(quiz, input.answers);
  const results = quiz.questions.map((question, index) => ({
    correct: input.answers[index] === question.correct,
    chosen: input.answers[index],
    answer: question.correct,
    explanation: question.explanation,
  }));
  const now = new Date();
  const missed = quiz.questions.filter((_, index) => !results[index].correct);

  await prisma.$transaction([
    prisma.quizAttempt.create({
      data: { studentId: found.studentId, lessonId: input.lessonId, courseId: input.courseId, score, total: quiz.questions.length, answers: input.answers },
    }),
    ...missed.map((question) => {
      const key = QUIZ_CARD_PREFIX + cardKey(question.q);

      return prisma.flashcardReview.upsert({
        where: { studentId_lessonId_cardKey: { studentId: found.studentId, lessonId: input.lessonId, cardKey: key } },
        create: { studentId: found.studentId, lessonId: input.lessonId, cardKey: key, dueAt: now },
        update: { dueAt: now, lapses: { increment: 1 }, intervalDays: 0, reps: 0 },
      });
    }),
  ]);

  return { ok: true, score, total: quiz.questions.length, results };
}

export async function listQuizAttempts(studentId: string, lessonId: string) {
  const rows = await prisma.quizAttempt.findMany({
    where: { studentId, lessonId },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { score: true, total: true, createdAt: true },
  });

  return rows.map((row) => ({ score: row.score, total: row.total, createdAt: row.createdAt.toISOString() }));
}
