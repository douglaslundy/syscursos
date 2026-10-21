import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  lessonAiContent: { findUnique: vi.fn(), create: vi.fn() },
  aiUsage: { create: vi.fn() },
}));
const callProvider = vi.hoisted(() => vi.fn());
const findLesson = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db/prisma", () => ({ prisma: db }));
vi.mock("@/server/services/ai/providers", () => ({ callProvider }));
vi.mock("@/server/services/transcript-service", () => ({ findTranscribableLesson: findLesson }));
vi.mock("@/server/services/ai/ai-settings-service", () => ({
  getActiveAiCredentials: vi.fn().mockResolvedValue({ provider: "openai", key: "sk" }),
  getActiveAiProvider: vi.fn().mockResolvedValue("openai"),
  getActiveTechniques: vi.fn().mockResolvedValue(["pareto", "cornell"]),
}));

import { generateAiContent, resetAiRateLimit } from "@/server/services/ai/ai-content-service";

const ids = { courseId: "c1", lessonId: "l1" };
const row = (content: string, kind = "SUMMARY", technique = "pareto") => ({
  kind,
  technique,
  content,
  provider: "openai",
  createdAt: new Date("2026-10-21T12:00:00Z"),
});

beforeEach(() => {
  vi.clearAllMocks();
  resetAiRateLimit();
  findLesson.mockResolvedValue({ studentId: "s1", lesson: { title: "Aula", transcript: "texto da aula" } });
  db.lessonAiContent.findUnique.mockResolvedValue(null);
  db.lessonAiContent.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ ...row(String(data.content), String(data.kind), String(data.technique)) }));
});

describe("generateAiContent", () => {
  it("returns saved content without calling the AI (no tokens spent)", async () => {
    db.lessonAiContent.findUnique.mockResolvedValueOnce(row("resumo salvo"));

    const result = await generateAiContent({ ...ids, kind: "SUMMARY", technique: "pareto" });

    expect(result).toMatchObject({ ok: true, cached: true, item: { content: "resumo salvo" } });
    expect(callProvider).not.toHaveBeenCalled();
    expect(db.aiUsage.create).not.toHaveBeenCalled();
  });

  it("generates once, records the token usage and saves the content", async () => {
    callProvider.mockResolvedValue({ ok: true, text: "## Resumo", inputTokens: 900, outputTokens: 100, model: "gpt-4o-mini" });

    const result = await generateAiContent({ ...ids, kind: "SUMMARY", technique: "cornell" });

    expect(result).toMatchObject({ ok: true, cached: false });
    expect(db.aiUsage.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ provider: "openai", inputTokens: 900, outputTokens: 100, studentId: "s1", courseId: "c1", kind: "SUMMARY" }),
    });
    expect(db.lessonAiContent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ lessonId: "l1", kind: "SUMMARY", technique: "cornell", content: "## Resumo" }),
    });
  });

  it("stores flashcards as validated JSON and still records usage when the output is unusable", async () => {
    callProvider.mockResolvedValueOnce({ ok: true, text: '{"cards":[{"q":"a?","a":"b"}]}', inputTokens: 10, outputTokens: 5, model: "m" });
    const good = await generateAiContent({ ...ids, kind: "FLASHCARDS" });

    expect(good.ok && JSON.parse(good.item.content)).toEqual([{ q: "a?", a: "b" }]);

    callProvider.mockResolvedValueOnce({ ok: true, text: "lixo", inputTokens: 10, outputTokens: 5, model: "m" });
    const bad = await generateAiContent({ ...ids, kind: "FLASHCARDS" });

    expect(bad).toEqual({ ok: false, error: "failed" });
    expect(db.aiUsage.create).toHaveBeenCalledTimes(2);
  });

  const quizJson = JSON.stringify({ questions: [{ q: "Qual?", options: ["A", "B", "C", "D"], correct: 1, explanation: "Porque B." }] });

  it("generates the quiz once, saves it for everyone and reuses it for the next student without spending tokens", async () => {
    callProvider.mockResolvedValue({ ok: true, text: quizJson, inputTokens: 500, outputTokens: 200, model: "m" });

    const first = await generateAiContent({ ...ids, kind: "QUIZ" });

    expect(first).toMatchObject({ ok: true, cached: false, item: { kind: "QUIZ", technique: "" } });
    expect(db.lessonAiContent.create).toHaveBeenCalledWith({ data: expect.objectContaining({ kind: "QUIZ", technique: "" }) });
    expect(db.aiUsage.create).toHaveBeenCalledWith({ data: expect.objectContaining({ kind: "QUIZ" }) });

    // Outro aluno, depois: a linha salva no banco e devolvida e a IA nao e chamada de novo.
    findLesson.mockResolvedValue({ studentId: "s2", lesson: { title: "Aula", transcript: "texto da aula" } });
    db.lessonAiContent.findUnique.mockResolvedValueOnce(row(quizJson, "QUIZ", ""));
    callProvider.mockClear();
    db.aiUsage.create.mockClear();

    const second = await generateAiContent({ ...ids, kind: "QUIZ" });

    expect(second).toMatchObject({ ok: true, cached: true });
    expect(callProvider).not.toHaveBeenCalled();
    expect(db.aiUsage.create).not.toHaveBeenCalled();
  });

  it("rejects a quiz the model returned in an invalid format", async () => {
    callProvider.mockResolvedValueOnce({ ok: true, text: '{"questions":[{"q":"x","options":["A","B"],"correct":0}]}', inputTokens: 1, outputTokens: 1, model: "m" });

    expect(await generateAiContent({ ...ids, kind: "QUIZ" })).toEqual({ ok: false, error: "failed" });
    expect(db.lessonAiContent.create).not.toHaveBeenCalled();
  });

  it("limits how many generations one student can trigger per minute", async () => {
    callProvider.mockResolvedValue({ ok: true, text: "## Resumo", inputTokens: 1, outputTokens: 1, model: "m" });
    findLesson.mockResolvedValue({ studentId: "spammer", lesson: { title: "Aula", transcript: "texto" } });

    const results = [];
    for (let index = 0; index < 6; index += 1) {
      results.push(await generateAiContent({ courseId: "c1", lessonId: `l${index}`, kind: "SUMMARY", technique: "pareto" }));
    }

    expect(results.slice(0, 5).every((item) => item.ok)).toBe(true);
    expect(results[5]).toEqual({ ok: false, error: "rate_limited" });
  });

  it("needs the summary of the technique before building a mind map", async () => {
    const result = await generateAiContent({ ...ids, kind: "MINDMAP", technique: "pareto" });

    expect(result).toEqual({ ok: false, error: "no_summary" });
    expect(callProvider).not.toHaveBeenCalled();
  });

  it("rejects inactive techniques, missing access and missing transcript", async () => {
    expect(await generateAiContent({ ...ids, kind: "SUMMARY", technique: "feynman" })).toEqual({ ok: false, error: "invalid_technique" });

    findLesson.mockResolvedValueOnce(null);
    expect(await generateAiContent({ ...ids, kind: "FLASHCARDS" })).toEqual({ ok: false, error: "forbidden" });

    findLesson.mockResolvedValueOnce({ studentId: "s1", lesson: { title: "Aula", transcript: null } });
    expect(await generateAiContent({ ...ids, kind: "FLASHCARDS" })).toEqual({ ok: false, error: "no_transcript" });
  });

  it("maps provider failures", async () => {
    callProvider.mockResolvedValueOnce({ ok: false, reason: "quota" });

    expect(await generateAiContent({ ...ids, kind: "FLASHCARDS" })).toEqual({ ok: false, error: "quota" });
    expect(db.aiUsage.create).not.toHaveBeenCalled();
  });
});
