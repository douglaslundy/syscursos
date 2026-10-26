import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  externalLesson: { findFirst: vi.fn(), update: vi.fn((args: unknown) => args), create: vi.fn() },
  externalNotebook: { findFirst: vi.fn(), count: vi.fn(), create: vi.fn() },
  externalAiContent: { findUnique: vi.fn(), deleteMany: vi.fn((args: unknown) => args) },
  externalCardReview: { deleteMany: vi.fn((args: unknown) => args) },
  $transaction: vi.fn(async (ops: unknown[]) => ops),
}));

vi.mock("@/lib/db/prisma", () => ({ prisma: db }));
vi.mock("@/server/services/student-service", () => ({ requireStudentProfileId: vi.fn(async () => "s1") }));
vi.mock("@/server/services/ai/ai-content-service", () => ({ MAX_PROMPT_CHARS: 1000, TECHNIQUELESS: new Set(["FLASHCARDS", "QUIZ"]), callAndRecord: vi.fn(), toItem: vi.fn() }));
vi.mock("@/server/services/ai/ai-settings-service", () => ({ getActiveTechniques: vi.fn(async () => []) }));
vi.mock("@/server/services/review-service", () => ({ cardsOf: vi.fn() }));
vi.mock("@/server/services/quiz-service", () => ({ QUIZ_CARD_PREFIX: "quiz:" }));

import { lessonInputSchema, lessonSourceText, MAX_EXTERNAL_TEXT } from "@/lib/external-notebook";
import { addExternalLesson, deleteExternalNotebook, submitExternalQuiz, updateExternalLesson } from "@/server/services/external-notebook-service";

beforeEach(() => vi.clearAllMocks());

describe("lessonInputSchema", () => {
  it("requires a title and at least one of transcript or summary", () => {
    expect(lessonInputSchema.safeParse({ title: "Aula 1", transcript: "  ", summary: "" }).success).toBe(false);
    expect(lessonInputSchema.safeParse({ title: "", transcript: "texto" }).success).toBe(false);
    expect(lessonInputSchema.parse({ title: " Aula 1 ", summary: " resumo " })).toEqual({ title: "Aula 1", transcript: null, summary: "resumo" });
  });

  it("rejects oversized text", () => {
    expect(lessonInputSchema.safeParse({ title: "Aula", transcript: "a".repeat(MAX_EXTERNAL_TEXT + 1) }).success).toBe(false);
  });

  it("uses the transcript as source and falls back to the summary", () => {
    expect(lessonSourceText({ transcript: "t", summary: "s" })).toBe("t");
    expect(lessonSourceText({ transcript: null, summary: "s" })).toBe("s");
  });
});

describe("ownership", () => {
  it("does not add a lesson to a notebook of another student", async () => {
    db.externalNotebook.findFirst.mockResolvedValue(null);

    expect(await addExternalLesson("n1", { title: "Aula", transcript: "texto" })).toMatchObject({ ok: false, error: "forbidden" });
    expect(db.externalNotebook.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "n1", studentId: "s1" } }));
    expect(db.externalLesson.create).not.toHaveBeenCalled();
  });

  it("scopes lesson reads to the notebook owner and blocks the quiz for foreign lessons", async () => {
    db.externalLesson.findFirst.mockResolvedValue(null);

    expect(await submitExternalQuiz({ lessonId: "l1", answers: [0] })).toEqual({ ok: false, error: "forbidden" });
    expect(db.externalLesson.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "l1", notebook: { studentId: "s1" } } }));
  });
});

describe("updateExternalLesson", () => {
  const lesson = { id: "l1", title: "Aula", transcript: "antigo", summary: null, notebook: { id: "n1", title: "C" } };

  it("clears generated material and review cards when the source text changes", async () => {
    db.externalLesson.findFirst.mockResolvedValue(lesson);

    expect(await updateExternalLesson("l1", { title: "Aula", transcript: "novo" })).toEqual({ ok: true });
    expect(db.externalAiContent.deleteMany).toHaveBeenCalledWith({ where: { lessonId: "l1" } });
    expect(db.externalCardReview.deleteMany).toHaveBeenCalledWith({ where: { lessonId: "l1" } });
  });

  it("keeps generated material when only the title changes", async () => {
    db.externalLesson.findFirst.mockResolvedValue(lesson);

    await updateExternalLesson("l1", { title: "Outro titulo", transcript: "antigo" });

    expect(db.externalAiContent.deleteMany).not.toHaveBeenCalled();
  });
});

describe("deleteExternalNotebook", () => {
  it("only deletes notebooks owned by the student", async () => {
    const deleteMany = vi.fn().mockResolvedValue({ count: 0 });

    Object.assign(db.externalNotebook, { deleteMany });

    expect(await deleteExternalNotebook("n1")).toBe(false);
    expect(deleteMany).toHaveBeenCalledWith({ where: { id: "n1", studentId: "s1" } });
  });
});
