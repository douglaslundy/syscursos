import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  lessonAiContent: { findUnique: vi.fn() },
  quizAttempt: { create: vi.fn((args: unknown) => args), findMany: vi.fn() },
  flashcardReview: { upsert: vi.fn((args: unknown) => args) },
  $transaction: vi.fn(async (ops: unknown[]) => ops),
}));
const findLesson = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db/prisma", () => ({ prisma: db }));
vi.mock("@/server/services/transcript-service", () => ({ findTranscribableLesson: findLesson }));

import { cardKey } from "@/lib/study/srs";
import { QUIZ_CARD_PREFIX, submitQuiz } from "@/server/services/quiz-service";

const quiz = {
  questions: [
    { q: "Primeira?", options: ["A", "B", "C", "D"], correct: 0, explanation: "e A" },
    { q: "Segunda?", options: ["A", "B", "C", "D"], correct: 3, explanation: "e D" },
  ],
};
const input = { courseId: "c1", lessonId: "l1" };

beforeEach(() => {
  vi.clearAllMocks();
  findLesson.mockResolvedValue({ studentId: "s1", lesson: {} });
  db.lessonAiContent.findUnique.mockResolvedValue({ content: JSON.stringify(quiz) });
});

describe("submitQuiz", () => {
  it("grades on the server, stores the attempt and queues only the missed questions for review", async () => {
    const result = await submitQuiz({ ...input, answers: [0, 1] });

    expect(result).toMatchObject({ ok: true, score: 1, total: 2 });
    expect(result.ok && result.results.map((item) => item.correct)).toEqual([true, false]);
    expect(db.quizAttempt.create).toHaveBeenCalledWith({ data: expect.objectContaining({ studentId: "s1", lessonId: "l1", score: 1, total: 2 }) });
    expect(db.flashcardReview.upsert).toHaveBeenCalledTimes(1);
    expect(db.flashcardReview.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ create: expect.objectContaining({ cardKey: QUIZ_CARD_PREFIX + cardKey("Segunda?") }) }),
    );
  });

  it("does not queue anything when every answer is right", async () => {
    await submitQuiz({ ...input, answers: [0, 3] });

    expect(db.flashcardReview.upsert).not.toHaveBeenCalled();
  });

  it("rejects wrong answer counts, missing quiz and no access", async () => {
    expect(await submitQuiz({ ...input, answers: [0] })).toEqual({ ok: false, error: "invalid" });

    db.lessonAiContent.findUnique.mockResolvedValueOnce(null);
    expect(await submitQuiz({ ...input, answers: [0, 0] })).toEqual({ ok: false, error: "no_quiz" });

    findLesson.mockResolvedValueOnce(null);
    expect(await submitQuiz({ ...input, answers: [0, 0] })).toEqual({ ok: false, error: "forbidden" });
    expect(db.quizAttempt.create).not.toHaveBeenCalled();
  });
});
