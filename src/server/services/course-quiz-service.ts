import { parseQuiz, quizAnswerText, type Quiz, type QuizQuestion } from "@/lib/ai/quiz";
import { prisma } from "@/lib/db/prisma";
import { MAX_QUIZ_QUESTIONS, pickDueFirst } from "@/lib/study/quiz-pick";
import { cardKey } from "@/lib/study/srs";
import { QUIZ_CARD_PREFIX, type QuizResult, type QuizSubmitResult } from "@/server/services/quiz-service";
import { scheduleQuizCards } from "@/server/services/quiz-srs";
import type { ReviewCard } from "@/server/services/review-service";
import { requireStudentProfileId } from "@/server/services/student-service";
import { listAvailableCourses } from "@/server/services/study-access";

type BankItem = { courseId: string; lessonId: string; lessonTitle: string; moduleTitle: string; key: string; question: QuizQuestion };
export type QuizRef = { courseId: string; lessonId: string; key: string };

export type CourseQuizSummary = { courseId: string; title: string; questions: number; lessons: number; attempts: number; bestPercent: number | null };

// Quizzes gerados por IA sao da aula (o que um aluno gerou serve para todos); aqui so se le o que ja existe.
async function loadBank(courseIds: string[]) {
  const lessons = await prisma.lesson.findMany({
    where: { status: "ACTIVE", module: { courseId: { in: courseIds }, status: "ACTIVE" }, aiContents: { some: { kind: "QUIZ" } } },
    orderBy: [{ module: { position: "asc" } }, { position: "asc" }],
    select: { id: true, title: true, module: { select: { courseId: true, title: true } }, aiContents: { where: { kind: "QUIZ" }, select: { content: true } } },
  });
  const byCourse = new Map<string, { lessons: number; items: BankItem[] }>();

  for (const lesson of lessons) {
    const courseId = lesson.module.courseId;
    const entry = byCourse.get(courseId) ?? { lessons: 0, items: [] };

    entry.lessons += 1;
    for (const row of lesson.aiContents) {
      for (const question of parseQuiz(row.content)?.questions ?? []) {
        entry.items.push({ courseId, lessonId: lesson.id, lessonTitle: lesson.title, moduleTitle: lesson.module.title, key: cardKey(question.q), question });
      }
    }
    byCourse.set(courseId, entry);
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
export type StartCourseDeckResult = { ok: true; cards: ReviewCard[] } | { ok: false; error: "forbidden" | "no_quiz" };

// courseId null = todos os cursos liberados ao aluno, misturados.
async function drawQuestions(courseId: string | null, count: number) {
  const studentId = await requireStudentProfileId();
  const courses = await listAvailableCourses(studentId);

  if (courseId && !courses.some((course) => course.id === courseId)) return { ok: false as const, error: "forbidden" as const };

  const scope = courseId ? [courseId] : courses.map((course) => course.id);
  const items = Array.from((await loadBank(scope)).values()).flatMap((entry) => entry.items);

  if (items.length === 0) return { ok: false as const, error: "no_quiz" as const };

  // Repeticao espacada: o que e novo ou ja venceu entra antes do que ainda esta dentro do intervalo.
  const now = new Date();
  const rows = await prisma.flashcardReview.findMany({
    where: { studentId, lessonId: { in: Array.from(new Set(items.map((item) => item.lessonId))) }, cardKey: { startsWith: QUIZ_CARD_PREFIX } },
    select: { lessonId: true, cardKey: true, dueAt: true },
  });
  const idOf = (item: BankItem) => `${item.lessonId}:${QUIZ_CARD_PREFIX}${item.key}`;
  const reviewed = new Map(rows.map((row) => [`${row.lessonId}:${row.cardKey}`, row.dueAt]));
  const picked = pickDueFirst(items, (item) => (reviewed.get(idOf(item))?.getTime() ?? 0) <= now.getTime(), count);

  return { ok: true as const, picked, courses, isNew: (item: BankItem) => !reviewed.has(idOf(item)) };
}

// Sorteia as perguntas do banco (de um curso ou de todos). As referencias voltam na correcao.
export async function startCourseQuiz(courseId: string | null, count: number): Promise<StartCourseQuizResult> {
  const drawn = await drawQuestions(courseId, count);

  if (!drawn.ok) return drawn;

  return { ok: true, quiz: { questions: drawn.picked.map((item) => item.question) }, refs: drawn.picked.map(({ courseId: course, lessonId, key }) => ({ courseId: course, lessonId, key })) };
}

// Mesmas perguntas em formato de baralho (frente = pergunta, verso = resposta); a nota de cada cartao agenda a revisao.
export async function startCourseDeck(courseId: string | null, count: number): Promise<StartCourseDeckResult> {
  const drawn = await drawQuestions(courseId, count);

  if (!drawn.ok) return drawn;

  const titles = new Map(drawn.courses.map((course) => [course.id, course.title]));

  return {
    ok: true,
    cards: drawn.picked.map((item) => ({
      courseId: item.courseId,
      courseTitle: titles.get(item.courseId) ?? "",
      moduleTitle: item.moduleTitle,
      lessonId: item.lessonId,
      lessonTitle: item.lessonTitle,
      cardKey: QUIZ_CARD_PREFIX + item.key,
      q: item.question.q,
      a: quizAnswerText(item.question),
      isNew: drawn.isNew(item),
    })),
  };
}

// Corrige no servidor contra o banco, grava uma tentativa por curso e agenda todas as questoes na repeticao espacada.
export async function submitCourseQuiz(input: { refs: QuizRef[]; answers: Array<number | null> }): Promise<QuizSubmitResult> {
  const studentId = await requireStudentProfileId();

  if (input.refs.length === 0 || input.refs.length > MAX_QUIZ_QUESTIONS || input.refs.length !== input.answers.length) return { ok: false, error: "invalid" };

  const allowed = new Set((await listAvailableCourses(studentId)).map((course) => course.id));
  const courseIds = Array.from(new Set(input.refs.map((ref) => ref.courseId)));

  if (courseIds.some((id) => !allowed.has(id))) return { ok: false, error: "forbidden" };

  const bank = await loadBank(courseIds);
  const byRef = new Map(Array.from(bank.values()).flatMap((entry) => entry.items).map((item) => [`${item.courseId}:${item.lessonId}:${item.key}`, item.question]));
  const questions: QuizQuestion[] = [];

  for (const ref of input.refs) {
    const question = byRef.get(`${ref.courseId}:${ref.lessonId}:${ref.key}`);

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
  const schedule = await scheduleQuizCards(
    studentId,
    input.refs.map((ref, index) => ({ lessonId: ref.lessonId, cardKey: QUIZ_CARD_PREFIX + ref.key, correct: results[index].correct })),
    new Date(),
  );
  const attempts = courseIds.map((courseId) => {
    const indexes = input.refs.flatMap((ref, index) => (ref.courseId === courseId ? [index] : []));

    return prisma.quizAttempt.create({
      data: { studentId, courseId, score: indexes.filter((index) => results[index].correct).length, total: indexes.length, answers: indexes.map((index) => input.answers[index]) },
    });
  });

  await prisma.$transaction([...attempts, ...schedule]);

  return { ok: true, score, total: questions.length, results };
}
