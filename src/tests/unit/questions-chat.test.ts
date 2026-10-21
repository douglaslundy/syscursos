import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  lessonQuestion: { count: vi.fn(), create: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
  course: { findUnique: vi.fn() },
  aiUsage: { count: vi.fn(), create: vi.fn() },
}));
const findLesson = vi.hoisted(() => vi.fn());
const notifyUser = vi.hoisted(() => vi.fn());
const callProvider = vi.hoisted(() => vi.fn());
const requireAnyRole = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db/prisma", () => ({ prisma: db }));
vi.mock("@/server/services/transcript-service", () => ({ findTranscribableLesson: findLesson }));
vi.mock("@/server/services/notification-service", () => ({ notifyUser }));
vi.mock("@/server/services/student-service", () => ({ requireStudentProfileId: vi.fn().mockResolvedValue("s1") }));
vi.mock("@/server/auth/guards", () => ({ requireAnyRole }));
vi.mock("@/server/services/ai/providers", () => ({ callProvider }));
vi.mock("@/server/services/ai/ai-settings-service", () => ({ getActiveAiCredentials: vi.fn().mockResolvedValue({ provider: "openai", key: "sk" }) }));

import { askLessonChat } from "@/server/services/ai/chat-service";
import { resetAiRateLimit } from "@/server/services/ai/ai-content-service";
import { answerQuestion, askQuestion } from "@/server/services/question-service";

const ids = { courseId: "c1", lessonId: "l1" };

beforeEach(() => {
  vi.clearAllMocks();
  resetAiRateLimit();
  findLesson.mockResolvedValue({ studentId: "s1", lesson: { title: "Aula", transcript: "[00:10] texto da aula" } });
});

describe("askQuestion", () => {
  it("saves the question and notifies the course producer", async () => {
    db.lessonQuestion.count.mockResolvedValue(0);
    db.course.findUnique.mockResolvedValue({ producerId: "prod1", title: "Curso" });

    expect(await askQuestion({ ...ids, body: "  Como funciona?  " })).toEqual({ ok: true });
    expect(db.lessonQuestion.create).toHaveBeenCalledWith({ data: expect.objectContaining({ studentId: "s1", body: "Como funciona?" }) });
    expect(notifyUser).toHaveBeenCalledWith("prod1", expect.objectContaining({ kind: "question_new", href: "/admin/questions" }));
  });

  it("stops after 10 questions in 24 hours and rejects blanks or no access", async () => {
    db.lessonQuestion.count.mockResolvedValue(10);
    expect(await askQuestion({ ...ids, body: "oi" })).toEqual({ ok: false, error: "limit" });

    expect(await askQuestion({ ...ids, body: "   " })).toEqual({ ok: false, error: "invalid" });

    findLesson.mockResolvedValueOnce(null);
    expect(await askQuestion({ ...ids, body: "oi" })).toEqual({ ok: false, error: "invalid" });
  });
});

describe("answerQuestion", () => {
  it("scopes a producer to the own courses and notifies the student", async () => {
    requireAnyRole.mockResolvedValue({ id: "prod1", role: "PRODUCER", organizationId: "org1" });
    db.lessonQuestion.findFirst.mockResolvedValue({ id: "q1", courseId: "c1", lessonId: "l1", lesson: { title: "Aula" }, student: { userId: "u9" } });

    expect(await answerQuestion("q1", " Resposta ")).toBe(true);
    expect(db.lessonQuestion.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "q1", course: { organizationId: "org1", producerId: "prod1" } } }));
    expect(db.lessonQuestion.update).toHaveBeenCalledWith({ where: { id: "q1" }, data: expect.objectContaining({ answer: "Resposta", answeredById: "prod1" }) });
    expect(notifyUser).toHaveBeenCalledWith("u9", expect.objectContaining({ kind: "question_answered" }));
  });

  it("does not answer a question outside the producer's courses", async () => {
    requireAnyRole.mockResolvedValue({ id: "prod1", role: "PRODUCER", organizationId: "org1" });
    db.lessonQuestion.findFirst.mockResolvedValue(null);

    expect(await answerQuestion("q2", "x")).toBe(false);
    expect(db.lessonQuestion.update).not.toHaveBeenCalled();
  });
});

describe("askLessonChat", () => {
  it("answers from the transcript and records CHAT usage", async () => {
    db.aiUsage.count.mockResolvedValue(0);
    callProvider.mockResolvedValue({ ok: true, text: "Foi dito em [00:10].", inputTokens: 100, outputTokens: 20, model: "m" });

    const result = await askLessonChat({ ...ids, question: "O que foi dito?" });

    expect(result).toEqual({ ok: true, answer: "Foi dito em [00:10]." });
    expect(callProvider.mock.calls[0][2].user).toContain("[00:10] texto da aula");
    expect(db.aiUsage.create).toHaveBeenCalledWith({ data: expect.objectContaining({ kind: "CHAT", studentId: "s1", courseId: "c1" }) });
  });

  it("enforces the daily limit and requires a transcript", async () => {
    db.aiUsage.count.mockResolvedValue(30);
    expect(await askLessonChat({ ...ids, question: "pergunta valida" })).toEqual({ ok: false, error: "daily_limit" });
    expect(callProvider).not.toHaveBeenCalled();

    findLesson.mockResolvedValueOnce({ studentId: "s1", lesson: { title: "Aula", transcript: null } });
    expect(await askLessonChat({ ...ids, question: "pergunta valida" })).toEqual({ ok: false, error: "no_transcript" });
  });
});
