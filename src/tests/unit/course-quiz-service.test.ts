import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  lesson: { findMany: vi.fn() },
  quizAttempt: { findMany: vi.fn(), create: vi.fn((args: unknown) => args) },
  flashcardReview: { findMany: vi.fn(), upsert: vi.fn((args: unknown) => args) },
  $transaction: vi.fn(),
}));
const courses = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db/prisma", () => ({ prisma: db }));
vi.mock("@/server/services/student-service", () => ({ requireStudentProfileId: vi.fn().mockResolvedValue("s1") }));
vi.mock("@/server/services/study-access", () => ({ listAvailableCourses: courses }));

import { cardKey } from "@/lib/study/srs";
import { listQuizCourses, startCourseDeck, startCourseQuiz, submitCourseQuiz } from "@/server/services/course-quiz-service";

const quiz = (...questions: string[]) => JSON.stringify({ questions: questions.map((q) => ({ q, options: ["a", "b", "c", "d"], correct: 1, explanation: "porque" })) });
const lesson = (id: string, courseId: string, content: string) => ({ id, title: `Aula ${id}`, module: { courseId, title: "Modulo" }, aiContents: [{ content }] });

beforeEach(() => {
  vi.clearAllMocks();
  courses.mockResolvedValue([{ id: "c1", title: "Curso" }]);
  db.quizAttempt.findMany.mockResolvedValue([{ courseId: "c1", score: 1, total: 2 }]);
  db.flashcardReview.findMany.mockResolvedValue([]);
  db.lesson.findMany.mockResolvedValue([lesson("l1", "c1", quiz("Pergunta A", "Pergunta B")), lesson("l2", "c1", quiz("Pergunta C"))]);
});

describe("course quiz", () => {
  it("lists the courses with generated quizzes and the student history", async () => {
    expect(await listQuizCourses()).toEqual([{ courseId: "c1", title: "Curso", questions: 3, lessons: 2, attempts: 1, bestPercent: 50 }]);
  });

  it("only reads quizzes of lessons the student already completed", async () => {
    await startCourseQuiz("c1", 2);

    expect(db.lesson.findMany.mock.calls.at(-1)?.[0].where.progress).toEqual({ some: { studentId: expect.any(String), status: "COMPLETED" } });
  });

  it("draws the requested number of questions from the whole course", async () => {
    const result = await startCourseQuiz("c1", 2);

    expect(result.ok && result.quiz.questions).toHaveLength(2);
    expect(result.ok && result.refs).toHaveLength(2);
  });

  it("mixes the questions of every available course when no course is given", async () => {
    courses.mockResolvedValue([
      { id: "c1", title: "Curso 1" },
      { id: "c2", title: "Curso 2" },
    ]);
    db.lesson.findMany.mockResolvedValue([lesson("l1", "c1", quiz("Pergunta A")), lesson("l3", "c2", quiz("Pergunta Z"))]);

    const result = await startCourseQuiz(null, 10);

    expect(result.ok && result.refs.map((ref) => ref.courseId).sort()).toEqual(["c1", "c2"]);
  });

  it("refuses a course the student cannot access", async () => {
    expect(await startCourseQuiz("outro", 5)).toEqual({ ok: false, error: "forbidden" });
  });

  it("builds a deck with front, back and the course, lesson and new flag", async () => {
    db.flashcardReview.findMany.mockResolvedValue([{ lessonId: "l2", cardKey: `quiz:${cardKey("Pergunta C")}`, dueAt: new Date(0) }]);

    const result = await startCourseDeck("c1", 10);

    expect(result.ok).toBe(true);

    if (!result.ok) return;

    const card = result.cards.find((item) => item.q === "Pergunta C");

    expect(card).toMatchObject({ courseId: "c1", courseTitle: "Curso", lessonId: "l2", cardKey: `quiz:${cardKey("Pergunta C")}`, a: "b - porque", isNew: false });
    expect(result.cards.find((item) => item.q === "Pergunta A")?.isNew).toBe(true);
  });

  it("puts questions that are due before the ones still inside their interval", async () => {
    const future = new Date(Date.now() + 5 * 86_400_000);

    db.flashcardReview.findMany.mockResolvedValue([
      { lessonId: "l1", cardKey: `quiz:${cardKey("Pergunta A")}`, dueAt: future },
      { lessonId: "l1", cardKey: `quiz:${cardKey("Pergunta B")}`, dueAt: future },
    ]);

    const result = await startCourseQuiz("c1", 1);

    expect(result.ok && result.quiz.questions[0].q).toBe("Pergunta C");
  });

  it("grades on the server, saves the attempt and schedules every answered question", async () => {
    const refs = [
      { courseId: "c1", lessonId: "l1", key: cardKey("Pergunta A") },
      { courseId: "c1", lessonId: "l2", key: cardKey("Pergunta C") },
    ];
    const result = await submitCourseQuiz({ refs, answers: [1, 0] });

    expect(result).toMatchObject({ ok: true, score: 1, total: 2 });
    expect(db.quizAttempt.create).toHaveBeenCalledWith({ data: expect.objectContaining({ studentId: "s1", courseId: "c1", score: 1, total: 2 }) });
    expect(db.flashcardReview.upsert).toHaveBeenCalledTimes(2);
    // Acerto avanca para amanha (intervalo 1); erro volta hoje.
    expect(db.flashcardReview.upsert).toHaveBeenCalledWith(expect.objectContaining({ create: expect.objectContaining({ lessonId: "l1", intervalDays: 1, reps: 1 }) }));
    expect(db.flashcardReview.upsert).toHaveBeenCalledWith(expect.objectContaining({ create: expect.objectContaining({ lessonId: "l2", cardKey: `quiz:${cardKey("Pergunta C")}`, intervalDays: 0, lapses: 1 }) }));
  });

  it("saves one attempt per course when the quiz is mixed", async () => {
    courses.mockResolvedValue([
      { id: "c1", title: "Curso 1" },
      { id: "c2", title: "Curso 2" },
    ]);
    db.lesson.findMany.mockResolvedValue([lesson("l1", "c1", quiz("Pergunta A")), lesson("l3", "c2", quiz("Pergunta Z"))]);

    const result = await submitCourseQuiz({
      refs: [
        { courseId: "c1", lessonId: "l1", key: cardKey("Pergunta A") },
        { courseId: "c2", lessonId: "l3", key: cardKey("Pergunta Z") },
      ],
      answers: [1, 0],
    });

    expect(result).toMatchObject({ ok: true, score: 1, total: 2 });
    expect(db.quizAttempt.create).toHaveBeenCalledTimes(2);
    expect(db.quizAttempt.create).toHaveBeenCalledWith({ data: expect.objectContaining({ courseId: "c1", score: 1, total: 1 }) });
    expect(db.quizAttempt.create).toHaveBeenCalledWith({ data: expect.objectContaining({ courseId: "c2", score: 0, total: 1 }) });
  });

  it("rejects references outside the bank or from courses the student cannot access", async () => {
    const missing = await submitCourseQuiz({ refs: [{ courseId: "c1", lessonId: "l1", key: "inexistente" }], answers: [0] });
    const forbidden = await submitCourseQuiz({ refs: [{ courseId: "outro", lessonId: "l1", key: cardKey("Pergunta A") }], answers: [0] });

    expect(missing).toEqual({ ok: false, error: "invalid" });
    expect(forbidden).toEqual({ ok: false, error: "forbidden" });
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("onlyDue skips questions still inside their interval and reports none_pending when nothing is due", async () => {
    const future = new Date(Date.now() + 5 * 86_400_000);
    const row = (q: string, lessonId: string) => ({ lessonId, cardKey: `quiz:${cardKey(q)}`, dueAt: future });

    db.flashcardReview.findMany.mockResolvedValue([row("Pergunta A", "l1")]);

    const some = await startCourseQuiz("c1", 10, { onlyDue: true });

    expect(some.ok && some.quiz.questions.map((item) => item.q).sort()).toEqual(["Pergunta B", "Pergunta C"]);

    db.flashcardReview.findMany.mockResolvedValue([row("Pergunta A", "l1"), row("Pergunta B", "l1"), row("Pergunta C", "l2")]);

    expect(await startCourseQuiz("c1", 10, { onlyDue: true })).toEqual({ ok: false, error: "none_pending" });
    expect((await startCourseDeck("c1", 10, { onlyDue: true })).ok).toBe(false);
  });
});
