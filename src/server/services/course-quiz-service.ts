import { parseQuiz, type Quiz, type QuizQuestion } from "@/lib/ai/quiz";
import { prisma } from "@/lib/db/prisma";
import { MAX_QUIZ_QUESTIONS, pickQuestions } from "@/lib/study/quiz-pick";
import { cardKey } from "@/lib/study/srs";
import { QUIZ_CARD_PREFIX, type QuizResult, type QuizSubmitResult } from "@/server/services/quiz-service";
import { requireStudentProfileId } from "@/server/services/student-service";
import { listAvailableCourses } from "@/server/services/study-access";

type BankItem = { lessonId: string; key: string; question: QuizQuestion };
export type QuizRef = { lessonId: string; key: string };

export type CourseQuizSummary = { courseId: string; title: string; questions: number; lessons: number; attempts: number; bestPercent: number | null };

// Quizzes gerados por IA sao da aula (o que um aluno gerou serve para todos); aqui so se le o que ja existe.
async function loadBank(courseIds: string[]) {
  const lessons = await prisma.lesson.findMany({
    where: { status: "ACTIVE", module: { courseId: { in: courseIds }, status: "ACTIVE" }, aiContents: { some: { kind: "QUIZ" } } },
    orderBy: [{ module: { position: "asc" } }, { position: "asc" }],
    select: { id: true, module: { select: { courseId: true } }, aiContents: { where: { kind: "QUIZ" }, select: { content: true } } },
  });
  const byCourse = new Map<string, { lessons: number; items: BankItem[] }>();

  for (const lesson of lessons) {
    const entry = byCourse.get(lesson.module.courseId) ?? { lessons: 0, items: [] };

    entry.lessons += 1;
    for (const row of lesson.aiContents) {
      for (const question of parseQuiz(row.content)?.questions ?? []) entry.items.push({ lessonId: lesson.id, key: cardKey(question.q), question });
    }
    byCourse.set(lesson.module.courseId, entry);
  }

  return byCourse;
}

// Cursos liberados que ja tem quiz gerado, com o historico do aluno.
export async function listQuizCourses(): Promise<CourseQuizSummary[]> {
  const studentId = await requireStudentProfileId();
  const courses = await listAvailableCourses(studentId);
  const ids = courses.map((course) => course.id);

  if (ids.length === 0) return [];

  const [bank, attempts] = await Promise.all([
    loadBank(ids),
    prisma.quizAttempt.findMany({ where: { studentId, courseId: { in: ids } }, select: { courseId: true, score: true, total: true } }),
  ]);

  return courses
    .map((course) => {
      const mine = attempts.filter((attempt) => attempt.courseId === course.id && attempt.total > 0);
      const entry = bank.get(course.id);

      return {
        courseId: course.id,
        title: course.title,
        questions: entry?.items.length ?? 0,
        lessons: entry?.lessons ?? 0,
        attempts: mine.length,
        bestPercent: mine.length > 0 ? Math.round(Math.max(...mine.map((attempt) => attempt.score / attempt.total)) * 100) : null,
      };
    })
    .filter((course) => course.questions > 0)
    .sort((a, b) => a.title.localeCompare(b.title, "pt-BR"));
}

export async function getCourseQuizSummary(courseId: string) {
  return (await listQuizCourses()).find((course) => course.courseId === courseId) ?? null;
}

export type StartCourseQuizResult = { ok: true; quiz: Quiz; refs: QuizRef[] } | { ok: false; error: "forbidden" | "no_quiz" };

// Sorteia as perguntas do banco do curso. As referencias voltam na correcao.
export async function startCourseQuiz(courseId: string, count: number): Promise<StartCourseQuizResult> {
  const studentId = await requireStudentProfileId();

  if (!(await listAvailableCourses(studentId)).some((course) => course.id === courseId)) return { ok: false, error: "forbidden" };

  const items = (await loadBank([courseId])).get(courseId)?.items ?? [];

  if (items.length === 0) return { ok: false, error: "no_quiz" };

  const picked = pickQuestions(items, count);

  return { ok: true, quiz: { questions: picked.map((item) => item.question) }, refs: picked.map(({ lessonId, key }) => ({ lessonId, key })) };
}

// Corrige no servidor contra o banco, grava a tentativa do curso e manda as erradas para a fila de revisao.
export async function submitCourseQuiz(input: { courseId: string; refs: QuizRef[]; answers: Array<number | null> }): Promise<QuizSubmitResult> {
  const studentId = await requireStudentProfileId();

  if (!(await listAvailableCourses(studentId)).some((course) => course.id === input.courseId)) return { ok: false, error: "forbidden" };
  if (input.refs.length === 0 || input.refs.length > MAX_QUIZ_QUESTIONS || input.refs.length !== input.answers.length) return { ok: false, error: "invalid" };

  const items = (await loadBank([input.courseId])).get(input.courseId)?.items ?? [];
  const byRef = new Map(items.map((item) => [`${item.lessonId}:${item.key}`, item.question]));
  const questions: QuizQuestion[] = [];

  for (const ref of input.refs) {
    const question = byRef.get(`${ref.lessonId}:${ref.key}`);

    if (!question) return { ok: false, error: "invalid" };
    questions.push(question);
  }

  const results: QuizResult["results"] = questions.map((question, index) => ({
    correct: input.answers[index] === question.correct,
    chosen: input.answers[index],
    answer: question.correct,
    explanation: question.explanation,
  }));
  const score = results.filter((result) => result.correct).length;
  const now = new Date();
  const missed = input.refs.filter((_, index) => !results[index].correct);

  await prisma.$transaction([
    prisma.quizAttempt.create({ data: { studentId, courseId: input.courseId, score, total: questions.length, answers: input.answers } }),
    ...missed.map((ref) => {
      const cardId = QUIZ_CARD_PREFIX + ref.key;

      return prisma.flashcardReview.upsert({
        where: { studentId_lessonId_cardKey: { studentId, lessonId: ref.lessonId, cardKey: cardId } },
        create: { studentId, lessonId: ref.lessonId, cardKey: cardId, dueAt: now },
        update: { dueAt: now, lapses: { increment: 1 }, intervalDays: 0, reps: 0 },
      });
    }),
  ]);

  return { ok: true, score, total: questions.length, results };
}
