import { Prisma } from "@prisma/client";

import { gradeQuiz, parseQuiz } from "@/lib/ai/quiz";
import { buildPrompt } from "@/lib/ai/prompts";
import { isTechniqueId } from "@/lib/ai/techniques";
import { lessonInputSchema, lessonSourceText, notebookInputSchema } from "@/lib/external-notebook";
import { prisma } from "@/lib/db/prisma";
import { INITIAL_REVIEW, cardKey, nextReview, quizReview, type ReviewGrade } from "@/lib/study/srs";
import {
  MAX_PROMPT_CHARS,
  TECHNIQUELESS,
  callAndRecord,
  toItem,
  type AiGenerateResult,
  type LessonAiKind,
} from "@/server/services/ai/ai-content-service";
import { getActiveTechniques } from "@/server/services/ai/ai-settings-service";
import { QUIZ_CARD_PREFIX, type QuizSubmitResult } from "@/server/services/quiz-service";
import { cardsOf, type ReviewCard } from "@/server/services/review-service";
import { requireStudentProfileId } from "@/server/services/student-service";

export const MAX_NOTEBOOKS = 50;
export const MAX_LESSONS_PER_NOTEBOOK = 300;
const NEW_PER_DAY = 10;
const MAX_QUEUE = 40;
const AI_KINDS = ["SUMMARY", "FLASHCARDS", "MINDMAP", "QUIZ"];

export type ExternalError = "invalid" | "limit" | "forbidden";
export type ExternalResult<T = object> = ({ ok: true } & T) | { ok: false; error: ExternalError; message?: string };

// Toda leitura/escrita de aula passa por aqui: a aula so existe para quem e dono do caderno.
async function ownedLesson(lessonId: string) {
  const studentId = await requireStudentProfileId();
  const lesson = await prisma.externalLesson.findFirst({
    where: { id: lessonId, notebook: { studentId } },
    include: { notebook: { select: { id: true, title: true } } },
  });

  return lesson ? { studentId, lesson } : null;
}

export async function listExternalNotebooks() {
  const studentId = await requireStudentProfileId();
  const rows = await prisma.externalNotebook.findMany({
    where: { studentId },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, updatedAt: true, _count: { select: { lessons: true } } },
  });

  return rows.map((row) => ({ id: row.id, title: row.title, updatedAt: row.updatedAt, lessonCount: row._count.lessons }));
}

export async function getExternalNotebook(id: string) {
  const studentId = await requireStudentProfileId();

  return prisma.externalNotebook.findFirst({
    where: { id, studentId },
    select: { id: true, title: true, lessons: { orderBy: { createdAt: "asc" }, select: { id: true, title: true, updatedAt: true } } },
  });
}

export async function createExternalNotebook(input: { title: string }): Promise<ExternalResult<{ id: string }>> {
  const parsed = notebookInputSchema.safeParse(input);

  if (!parsed.success) return { ok: false, error: "invalid", message: parsed.error.issues[0]?.message };

  const studentId = await requireStudentProfileId();

  if ((await prisma.externalNotebook.count({ where: { studentId } })) >= MAX_NOTEBOOKS) {
    return { ok: false, error: "limit", message: `Limite de ${MAX_NOTEBOOKS} cadernos atingido.` };
  }

  const created = await prisma.externalNotebook.create({ data: { studentId, title: parsed.data.title }, select: { id: true } });

  return { ok: true, id: created.id };
}

export async function renameExternalNotebook(id: string, input: { title: string }): Promise<ExternalResult> {
  const parsed = notebookInputSchema.safeParse(input);

  if (!parsed.success) return { ok: false, error: "invalid", message: parsed.error.issues[0]?.message };

  const studentId = await requireStudentProfileId();
  const { count } = await prisma.externalNotebook.updateMany({ where: { id, studentId }, data: { title: parsed.data.title } });

  return count ? { ok: true } : { ok: false, error: "forbidden" };
}

export async function deleteExternalNotebook(id: string): Promise<boolean> {
  const studentId = await requireStudentProfileId();
  const { count } = await prisma.externalNotebook.deleteMany({ where: { id, studentId } });

  return count > 0;
}

export async function addExternalLesson(notebookId: string, input: unknown): Promise<ExternalResult<{ id: string }>> {
  const parsed = lessonInputSchema.safeParse(input);

  if (!parsed.success) return { ok: false, error: "invalid", message: parsed.error.issues[0]?.message };

  const studentId = await requireStudentProfileId();
  const notebook = await prisma.externalNotebook.findFirst({
    where: { id: notebookId, studentId },
    select: { id: true, _count: { select: { lessons: true } } },
  });

  if (!notebook) return { ok: false, error: "forbidden" };
  if (notebook._count.lessons >= MAX_LESSONS_PER_NOTEBOOK) {
    return { ok: false, error: "limit", message: `Limite de ${MAX_LESSONS_PER_NOTEBOOK} aulas por caderno atingido.` };
  }

  const created = await prisma.externalLesson.create({ data: { notebookId, ...parsed.data }, select: { id: true } });

  return { ok: true, id: created.id };
}

// Mudou o texto-fonte: o material de IA e os cartoes antigos deixam de valer e saem junto.
export async function updateExternalLesson(lessonId: string, input: unknown): Promise<ExternalResult> {
  const parsed = lessonInputSchema.safeParse(input);

  if (!parsed.success) return { ok: false, error: "invalid", message: parsed.error.issues[0]?.message };

  const owned = await ownedLesson(lessonId);

  if (!owned) return { ok: false, error: "forbidden" };

  const sourceChanged = lessonSourceText(owned.lesson) !== lessonSourceText(parsed.data);

  await prisma.$transaction([
    prisma.externalLesson.update({ where: { id: lessonId }, data: parsed.data }),
    ...(sourceChanged
      ? [prisma.externalAiContent.deleteMany({ where: { lessonId } }), prisma.externalCardReview.deleteMany({ where: { lessonId } })]
      : []),
  ]);

  return { ok: true };
}

export async function deleteExternalLesson(lessonId: string): Promise<boolean> {
  const owned = await ownedLesson(lessonId);

  if (!owned) return false;

  await prisma.externalLesson.delete({ where: { id: lessonId } });
  return true;
}

export async function getExternalLesson(lessonId: string) {
  const owned = await ownedLesson(lessonId);

  if (!owned) return null;

  const rows = await prisma.externalAiContent.findMany({ where: { lessonId }, orderBy: { createdAt: "asc" } });
  const items = rows.filter((row) => AI_KINDS.includes(row.kind)).map((row) => toItem({ ...row, kind: row.kind as LessonAiKind }));

  return { lesson: owned.lesson, items };
}

export async function generateExternalAiContent(input: { lessonId: string; kind: LessonAiKind; technique?: string }): Promise<AiGenerateResult> {
  const owned = await ownedLesson(input.lessonId);

  if (!owned) return { ok: false, error: "forbidden" };

  const { lesson, studentId } = owned;
  const technique = TECHNIQUELESS.has(input.kind) ? "" : (input.technique ?? "");

  if (!TECHNIQUELESS.has(input.kind) && (!isTechniqueId(technique) || !(await getActiveTechniques()).includes(technique))) {
    return { ok: false, error: "invalid_technique" };
  }

  const where = { lessonId_kind_technique: { lessonId: lesson.id, kind: input.kind, technique } };
  const existing = await prisma.externalAiContent.findUnique({ where });

  if (existing) return { ok: true, item: toItem({ ...existing, kind: input.kind }), cached: true };

  const summary =
    input.kind === "MINDMAP"
      ? await prisma.externalAiContent.findUnique({ where: { lessonId_kind_technique: { lessonId: lesson.id, kind: "SUMMARY", technique } } })
      : null;

  if (input.kind === "MINDMAP" && !summary) return { ok: false, error: "no_summary" };

  const prompt = buildPrompt({
    kind: input.kind,
    technique: isTechniqueId(technique) ? technique : undefined,
    lessonTitle: lesson.title,
    transcript: lessonSourceText(lesson).slice(0, MAX_PROMPT_CHARS),
    summary: summary?.content,
  });
  const generated = await callAndRecord({ kind: input.kind, prompt, studentId, courseId: null });

  if (!generated.ok) return generated;

  try {
    const created = await prisma.externalAiContent.create({
      data: { lessonId: lesson.id, kind: input.kind, technique, content: generated.content, provider: generated.provider, model: generated.model },
    });

    return { ok: true, item: toItem({ ...created, kind: input.kind }), cached: false };
  } catch (error) {
    // Pedido duplicado ao mesmo tempo: usa o que ficou salvo.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const saved = await prisma.externalAiContent.findUnique({ where });

      if (saved) return { ok: true, item: toItem({ ...saved, kind: input.kind }), cached: true };
    }
    throw error;
  }
}

type NextReview = ReturnType<typeof nextReview>;

const reviewData = (next: NextReview, now: Date) => ({
  ease: next.ease,
  intervalDays: next.intervalDays,
  reps: next.reps,
  lapses: next.lapses,
  dueAt: next.dueAt,
  lastReviewedAt: now,
});

// Corrige no servidor contra o quiz salvo e agenda as questoes na revisao (erro volta hoje).
export async function submitExternalQuiz(input: { lessonId: string; answers: Array<number | null> }): Promise<QuizSubmitResult> {
  const owned = await ownedLesson(input.lessonId);

  if (!owned) return { ok: false, error: "forbidden" };

  const row = await prisma.externalAiContent.findUnique({
    where: { lessonId_kind_technique: { lessonId: input.lessonId, kind: "QUIZ", technique: "" } },
    select: { content: true },
  });
  const quiz = row ? parseQuiz(row.content) : null;

  if (!quiz) return { ok: false, error: "no_quiz" };
  if (input.answers.length !== quiz.questions.length) return { ok: false, error: "invalid" };

  const results = quiz.questions.map((question, index) => ({
    correct: input.answers[index] === question.correct,
    chosen: input.answers[index],
    answer: question.correct,
    explanation: question.explanation,
  }));
  const keys = quiz.questions.map((question) => QUIZ_CARD_PREFIX + cardKey(question.q));
  const stored = new Map(
    (await prisma.externalCardReview.findMany({ where: { studentId: owned.studentId, lessonId: input.lessonId, cardKey: { in: keys } } })).map((item) => [item.cardKey, item]),
  );
  const now = new Date();
  const writes = keys.flatMap((key, index) => {
    const next = quizReview(stored.get(key) ?? null, results[index].correct, now);

    return next
      ? [
          prisma.externalCardReview.upsert({
            where: { studentId_lessonId_cardKey: { studentId: owned.studentId, lessonId: input.lessonId, cardKey: key } },
            create: { studentId: owned.studentId, lessonId: input.lessonId, cardKey: key, ...reviewData(next, now) },
            update: reviewData(next, now),
          }),
        ]
      : [];
  });

  await prisma.$transaction(writes);

  return { ok: true, score: gradeQuiz(quiz, input.answers), total: quiz.questions.length, results };
}

export async function reviewExternalCard(input: { lessonId: string; cardKey: string; grade: ReviewGrade }) {
  const owned = await ownedLesson(input.lessonId);

  if (!owned) return null;

  const key = { studentId: owned.studentId, lessonId: input.lessonId, cardKey: input.cardKey };
  const current = (await prisma.externalCardReview.findUnique({ where: { studentId_lessonId_cardKey: key } })) ?? INITIAL_REVIEW;
  const now = new Date();
  const next = nextReview(current, input.grade, now);

  await prisma.externalCardReview.upsert({
    where: { studentId_lessonId_cardKey: key },
    create: { ...key, ...reviewData(next, now) },
    update: reviewData(next, now),
  });

  return { intervalDays: next.intervalDays, dueAt: next.dueAt.toISOString() };
}

// Fila do dia dos cadernos externos: vencidos primeiro, depois ate 10 cartoes novos (de um caderno so, se informado).
export async function getExternalReviewQueue(notebookId?: string, now = new Date()): Promise<{ due: ReviewCard[]; fresh: ReviewCard[]; dueTotal: number }> {
  const studentId = await requireStudentProfileId();
  const lessons = await prisma.externalLesson.findMany({
    where: { notebook: { studentId, ...(notebookId ? { id: notebookId } : {}) } },
    select: {
      id: true,
      title: true,
      notebook: { select: { id: true, title: true } },
      aiContents: { where: { kind: { in: ["FLASHCARDS", "QUIZ"] } }, select: { kind: true, content: true } },
    },
  });
  const byId = new Map(lessons.map((lesson) => [lesson.id, { lesson, cards: cardsOf(lesson.aiContents) }]));
  const reviews = await prisma.externalCardReview.findMany({
    where: { studentId, lessonId: { in: [...byId.keys()] } },
    select: { lessonId: true, cardKey: true, dueAt: true },
  });
  const toCard = (lessonId: string, key: string, isNew: boolean): ReviewCard[] => {
    const entry = byId.get(lessonId);
    const card = entry?.cards.get(key);

    return entry && card
      ? [{ courseId: entry.lesson.notebook.id, courseTitle: entry.lesson.notebook.title, moduleTitle: "Caderno externo", lessonId, lessonTitle: entry.lesson.title, cardKey: key, q: card.q, a: card.a, isNew }]
      : [];
  };
  const dueRows = reviews.filter((row) => row.dueAt <= now).sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime());
  const due = dueRows.slice(0, MAX_QUEUE).flatMap((row) => toCard(row.lessonId, row.cardKey, false));
  const seen = new Set(reviews.map((row) => `${row.lessonId}:${row.cardKey}`));
  const fresh: ReviewCard[] = [];

  for (const [lessonId, entry] of byId) {
    for (const key of entry.cards.keys()) {
      if (fresh.length < NEW_PER_DAY && !seen.has(`${lessonId}:${key}`)) fresh.push(...toCard(lessonId, key, true));
    }
  }

  return { due, fresh, dueTotal: dueRows.length };
}
