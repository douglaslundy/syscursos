import { parseQuiz, gradeQuiz, type Quiz } from "@/lib/ai/quiz";
import { cardKey } from "@/lib/study/srs";
import { prisma } from "@/lib/db/prisma";
import { scheduleQuizCards } from "@/server/services/quiz-srs";
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

// Corrige no servidor contra o quiz salvo, grava a tentativa e agenda todas as questoes na repeticao espacada (erros voltam hoje).
export async function submitQuiz(input: { courseId: string; lessonId: string; answers: Array<number | null> }): Promise<QuizSubmitResult> {
  const found = await findTranscribableLesson(input.courseId, input.lessonId);

  if (!found || !found.completed) return { ok: false, error: "forbidden" };

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
  const schedule = await scheduleQuizCards(
    found.studentId,
    quiz.questions.map((question, index) => ({ lessonId: input.lessonId, cardKey: QUIZ_CARD_PREFIX + cardKey(question.q), correct: results[index].correct })),
    now,
  );

  await prisma.$transaction([
    prisma.quizAttempt.create({
      data: { studentId: found.studentId, lessonId: input.lessonId, courseId: input.courseId, score, total: quiz.questions.length, answers: input.answers },
    }),
    ...schedule,
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
