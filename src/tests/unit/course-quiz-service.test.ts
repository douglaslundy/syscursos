import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  lesson: { findMany: vi.fn() },
  quizAttempt: { findMany: vi.fn(), create: vi.fn() },
  flashcardReview: { upsert: vi.fn() },
  $transaction: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({ prisma: db }));
vi.mock("@/server/services/student-service", () => ({ requireStudentProfileId: vi.fn().mockResolvedValue("s1") }));
vi.mock("@/server/services/study-access", () => ({ listAvailableCourses: vi.fn().mockResolvedValue([{ id: "c1", title: "Curso" }]) }));

import { cardKey } from "@/lib/study/srs";
import { listQuizCourses, startCourseQuiz, submitCourseQuiz } from "@/server/services/course-quiz-service";

const quiz = (...questions: string[]) => JSON.stringify({ questions: questions.map((q) => ({ q, options: ["a", "b", "c", "d"], correct: 1, explanation: "porque" })) });

beforeEach(() => {
  vi.clearAllMocks();
  db.quizAttempt.findMany.mockResolvedValue([{ courseId: "c1", score: 1, total: 2 }]);
  db.lesson.findMany.mockResolvedValue([
    { id: "l1", module: { courseId: "c1" }, aiContents: [{ content: quiz("Pergunta A", "Pergunta B") }] },
    { id: "l2", module: { courseId: "c1" }, aiContents: [{ content: quiz("Pergunta C") }] },
  ]);
});

describe("course quiz", () => {
  it("lists the courses with generated quizzes and the student history", async () => {
    expect(await listQuizCourses()).toEqual([{ courseId: "c1", title: "Curso", questions: 3, lessons: 2, attempts: 1, bestPercent: 50 }]);
  });

  it("draws the requested number of questions from the whole course", async () => {
    const result = await startCourseQuiz("c1", 2);

    expect(result.ok && result.quiz.questions).toHaveLength(2);
    expect(result.ok && result.refs).toHaveLength(2);
  });

  it("grades on the server, saves the attempt and sends wrong answers to review", async () => {
    const refs = [
      { lessonId: "l1", key: cardKey("Pergunta A") },
      { lessonId: "l2", key: cardKey("Pergunta C") },
    ];
    const result = await submitCourseQuiz({ courseId: "c1", refs, answers: [1, 0] });

    expect(result).toMatchObject({ ok: true, score: 1, total: 2 });
    expect(db.quizAttempt.create).toHaveBeenCalledWith({ data: expect.objectContaining({ studentId: "s1", courseId: "c1", score: 1, total: 2 }) });
    expect(db.flashcardReview.upsert).toHaveBeenCalledTimes(1);
    expect(db.flashcardReview.upsert).toHaveBeenCalledWith(expect.objectContaining({ create: expect.objectContaining({ lessonId: "l2", cardKey: `quiz:${cardKey("Pergunta C")}` }) }));
  });

  it("rejects references that are not in the course bank", async () => {
    const result = await submitCourseQuiz({ courseId: "c1", refs: [{ lessonId: "l1", key: "inexistente" }], answers: [0] });

    expect(result).toEqual({ ok: false, error: "invalid" });
    expect(db.$transaction).not.toHaveBeenCalled();
  });
});
