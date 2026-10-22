import { parseFlashcards } from "@/lib/ai/parsers";
import { parseQuiz } from "@/lib/ai/quiz";
import { INITIAL_REVIEW, cardKey, nextReview, type ReviewGrade } from "@/lib/study/srs";
import { prisma } from "@/lib/db/prisma";
import { QUIZ_CARD_PREFIX } from "@/server/services/quiz-service";
import { requireStudentProfileId } from "@/server/services/student-service";
import { listAvailableCourses } from "@/server/services/study-access";
import { findTranscribableLesson } from "@/server/services/transcript-service";

export type ReviewCard = { courseId: string; courseTitle: string; moduleTitle: string; lessonId: string; lessonTitle: string; cardKey: string; q: string; a: string; isNew: boolean };

const NEW_PER_DAY = 10;
const MAX_QUEUE = 40;

type LessonCards = { lessonId: string; courseId: string; courseTitle: string; moduleTitle: string; lessonTitle: string; cards: Map<string, { q: string; a: string }> };

// Cartoes de uma aula indexados pela chave de revisao: flashcards da IA e questoes de quiz (resposta correta + explicacao).
function cardsOf(rows: Array<{ kind: string; content: string }>) {
  const cards = new Map<string, { q: string; a: string }>();

  for (const row of rows) {
    if (row.kind === "FLASHCARDS") {
      for (const card of parseFlashcards(row.content) ?? []) cards.set(cardKey(card.q), card);
    } else if (row.kind === "QUIZ") {
      for (const question of parseQuiz(row.content)?.questions ?? []) {
        cards.set(QUIZ_CARD_PREFIX + cardKey(question.q), {
          q: question.q,
          a: `${question.options[question.correct]}${question.explanation ? ` - ${question.explanation}` : ""}`,
        });
      }
    }
  }

  return cards;
}

async function lessonsCards(lessonIds: string[], courseIds: string[]): Promise<Map<string, LessonCards>> {
  if (lessonIds.length === 0 || courseIds.length === 0) return new Map();

  const lessons = await prisma.lesson.findMany({
    where: { id: { in: lessonIds }, status: "ACTIVE", module: { courseId: { in: courseIds } } },
    select: { id: true, title: true, module: { select: { title: true, courseId: true, course: { select: { title: true } } } }, aiContents: { where: { kind: { in: ["FLASHCARDS", "QUIZ"] } }, select: { kind: true, content: true } } },
  });

  return new Map(lessons.map((lesson) => [lesson.id, { lessonId: lesson.id, courseId: lesson.module.courseId, courseTitle: lesson.module.course.title, moduleTitle: lesson.module.title, lessonTitle: lesson.title, cards: cardsOf(lesson.aiContents) }]));
}

// Fila do dia: cartoes vencidos primeiro e, se sobrar espaco, cartoes novos de aulas ja concluidas pelo aluno.
export async function getReviewQueue(now = new Date()): Promise<{ due: ReviewCard[]; fresh: ReviewCard[]; dueTotal: number }> {
  const studentId = await requireStudentProfileId();
  const courseIds = (await listAvailableCourses(studentId)).map((course) => course.id);
  const dueRows = await prisma.flashcardReview.findMany({
    where: { studentId, dueAt: { lte: now } },
    orderBy: { dueAt: "asc" },
    take: MAX_QUEUE,
    select: { lessonId: true, cardKey: true },
  });
  const dueTotal = await prisma.flashcardReview.count({ where: { studentId, dueAt: { lte: now } } });
  const completed = await prisma.lessonProgress.findMany({
    where: { studentId, status: "COMPLETED" },
    orderBy: { completedAt: "desc" },
    take: 30,
    select: { lessonId: true },
  });
  const reviewed = await prisma.flashcardReview.findMany({
    where: { studentId, lessonId: { in: completed.map((row) => row.lessonId) } },
    select: { lessonId: true, cardKey: true },
  });
  const seen = new Set(reviewed.map((row) => `${row.lessonId}:${row.cardKey}`));
  const byLesson = await lessonsCards(Array.from(new Set([...dueRows.map((row) => row.lessonId), ...completed.map((row) => row.lessonId)])), courseIds);
  const toCard = (lessonId: string, key: string, isNew: boolean): ReviewCard[] => {
    const lesson = byLesson.get(lessonId);
    const card = lesson?.cards.get(key);

    return lesson && card ? [{ courseId: lesson.courseId, courseTitle: lesson.courseTitle, moduleTitle: lesson.moduleTitle, lessonId, lessonTitle: lesson.lessonTitle, cardKey: key, q: card.q, a: card.a, isNew }] : [];
  };
  const due = dueRows.flatMap((row) => toCard(row.lessonId, row.cardKey, false));
  const fresh: ReviewCard[] = [];

  for (const row of completed) {
    for (const key of byLesson.get(row.lessonId)?.cards.keys() ?? []) {
      if (fresh.length < NEW_PER_DAY && !seen.has(`${row.lessonId}:${key}`)) fresh.push(...toCard(row.lessonId, key, true));
    }
  }

  return { due, fresh, dueTotal };
}

// Registra a nota de um cartao e agenda a proxima revisao. Vale para cartoes de aulas as quais o aluno tem acesso.
export async function reviewCard(input: { courseId: string; lessonId: string; cardKey: string; grade: ReviewGrade }) {
  const found = await findTranscribableLesson(input.courseId, input.lessonId);

  if (!found) return null;

  const where = { studentId_lessonId_cardKey: { studentId: found.studentId, lessonId: input.lessonId, cardKey: input.cardKey } };
  const current = (await prisma.flashcardReview.findUnique({ where })) ?? INITIAL_REVIEW;
  const now = new Date();
  const next = nextReview(current, input.grade, now);
  const data = { ease: next.ease, intervalDays: next.intervalDays, reps: next.reps, lapses: next.lapses, dueAt: next.dueAt, lastReviewedAt: now };

  await prisma.flashcardReview.upsert({
    where,
    create: { studentId: found.studentId, lessonId: input.lessonId, cardKey: input.cardKey, ...data },
    update: data,
  });

  return { intervalDays: next.intervalDays, dueAt: next.dueAt.toISOString() };
}
