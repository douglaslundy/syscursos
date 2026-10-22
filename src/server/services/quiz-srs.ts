import { prisma } from "@/lib/db/prisma";
import { quizReview } from "@/lib/study/srs";

// cardKey ja com o prefixo de quiz (QUIZ_CARD_PREFIX).
export type QuizOutcome = { lessonId: string; cardKey: string; correct: boolean };

// Operacoes de agenda (repeticao espacada) para as questoes respondidas num quiz, para entrar na mesma transacao da tentativa.
export async function scheduleQuizCards(studentId: string, outcomes: QuizOutcome[], now: Date) {
  if (outcomes.length === 0) return [];

  const rows = await prisma.flashcardReview.findMany({
    where: { studentId, lessonId: { in: outcomes.map((item) => item.lessonId) }, cardKey: { in: outcomes.map((item) => item.cardKey) } },
    select: { lessonId: true, cardKey: true, ease: true, intervalDays: true, reps: true, lapses: true, dueAt: true },
  });
  const stored = new Map(rows.map((row) => [`${row.lessonId}:${row.cardKey}`, row]));

  return outcomes.flatMap((item) => {
    const { cardKey } = item;
    const next = quizReview(stored.get(`${item.lessonId}:${cardKey}`) ?? null, item.correct, now);

    if (!next) return [];

    const data = { ease: next.ease, intervalDays: next.intervalDays, reps: next.reps, lapses: next.lapses, dueAt: next.dueAt, lastReviewedAt: now };

    return [
      prisma.flashcardReview.upsert({
        where: { studentId_lessonId_cardKey: { studentId, lessonId: item.lessonId, cardKey } },
        create: { studentId, lessonId: item.lessonId, cardKey, ...data },
        update: data,
      }),
    ];
  });
}
