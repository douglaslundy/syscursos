import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  courseExam: { findUnique: vi.fn(), create: vi.fn() },
  course: { findUnique: vi.fn() },
  lesson: { findMany: vi.fn(), count: vi.fn() },
  lessonProgress: { count: vi.fn() },
  quizAttempt: { create: vi.fn(), findMany: vi.fn() },
  certificate: { findUnique: vi.fn(), create: vi.fn() },
  studentProfile: { findUnique: vi.fn() },
  aiUsage: { create: vi.fn() },
}));
const callProvider = vi.hoisted(() => vi.fn());
const aiEnabled = vi.hoisted(() => ({ value: true }));

vi.mock("@/lib/db/prisma", () => ({ prisma: db }));
vi.mock("@/server/services/ai/providers", () => ({ callProvider }));
vi.mock("@/server/services/ai/ai-settings-service", () => ({ getActiveAiCredentials: vi.fn().mockResolvedValue({ provider: "openai", key: "sk" }) }));
vi.mock("@/server/services/ai/ai-content-service", async (original) => ({
  ...(await original<typeof import("@/server/services/ai/ai-content-service")>()),
  getAiAvailability: vi.fn(async () => ({ enabled: aiEnabled.value, techniques: [] })),
}));
vi.mock("@/server/services/student-service", () => ({ requireStudentProfileId: vi.fn().mockResolvedValue("s1") }));
vi.mock("@/server/services/study-access", () => ({ listAvailableCourses: vi.fn().mockResolvedValue([{ id: "c1", title: "Curso" }]) }));
vi.mock("@/server/services/notification-service", () => ({ notifyUser: vi.fn() }));

import { renderCertificatePdf } from "@/server/pdf/render-pdf";
import { resetAiRateLimit } from "@/server/services/ai/ai-content-service";
import { getCertificateState, issueCertificate, newCertificateCode, verifyCertificate } from "@/server/services/certificate-service";
import { ensureCourseExam, submitExam } from "@/server/services/exam-service";

const examJson = JSON.stringify({ questions: [{ q: "Q1?", options: ["A", "B", "C", "D"], correct: 0, explanation: "e" }, { q: "Q2?", options: ["A", "B", "C", "D"], correct: 1, explanation: "e" }] });

beforeEach(() => {
  vi.clearAllMocks();
  resetAiRateLimit();
  aiEnabled.value = true;
  db.courseExam.findUnique.mockResolvedValue(null);
  db.quizAttempt.findMany.mockResolvedValue([]);
  db.lesson.findMany.mockResolvedValue([{ title: "Aula 1", transcript: "conteudo", aiContents: [] }]);
  db.course.findUnique.mockResolvedValue({ title: "Curso" });
  callProvider.mockResolvedValue({ ok: true, text: examJson, inputTokens: 1000, outputTokens: 300, model: "m" });
});

describe("course exam", () => {
  it("generates once, saves it for the whole course and reuses it without calling the AI again", async () => {
    const first = await ensureCourseExam("c1");

    expect(first).toMatchObject({ ok: true, created: true });
    expect(db.courseExam.create).toHaveBeenCalledWith({ data: expect.objectContaining({ courseId: "c1" }) });
    expect(db.aiUsage.create).toHaveBeenCalledWith({ data: expect.objectContaining({ kind: "EXAM", courseId: "c1" }) });

    db.courseExam.findUnique.mockResolvedValue({ content: examJson });
    callProvider.mockClear();

    expect(await ensureCourseExam("c1")).toMatchObject({ ok: true, created: false });
    expect(callProvider).not.toHaveBeenCalled();
  });

  it("refuses without material or for a course the student cannot access", async () => {
    db.lesson.findMany.mockResolvedValue([]);
    expect(await ensureCourseExam("c1")).toEqual({ ok: false, error: "no_material" });
    expect(await ensureCourseExam("outro")).toEqual({ ok: false, error: "forbidden" });
  });

  it("grades the final exam on the server and stores the attempt", async () => {
    db.courseExam.findUnique.mockResolvedValue({ content: examJson });

    const result = await submitExam({ courseId: "c1", answers: [0, 3] });

    expect(result).toMatchObject({ ok: true, score: 1, total: 2 });
    expect(db.quizAttempt.create).toHaveBeenCalledWith({ data: expect.objectContaining({ studentId: "s1", courseId: "c1", score: 1, total: 2 }) });
    expect(await submitExam({ courseId: "c1", answers: [0] })).toEqual({ ok: false, error: "invalid" });
  });
});

describe("certificate", () => {
  const progress = (total: number, completed: number) => {
    db.certificate.findUnique.mockResolvedValue(null);
    db.lesson.count.mockResolvedValue(total);
    db.lessonProgress.count.mockResolvedValue(completed);
  };

  it("generates readable unique-looking codes", () => {
    const code = newCertificateCode();

    expect(code).toMatch(/^SC-[A-HJ-NP-Z2-9]{10}$/);
    expect(newCertificateCode()).not.toBe(code);
  });

  it("is locked until every lesson is completed", async () => {
    progress(10, 9);

    expect(await getCertificateState("c1")).toEqual({ status: "locked", completed: 9, total: 10 });
  });

  it("asks for a passing final exam when AI is enabled, and is ready after a 70% score", async () => {
    progress(10, 10);
    db.quizAttempt.findMany.mockResolvedValue([{ score: 6, total: 10 }]);

    expect(await getCertificateState("c1")).toMatchObject({ status: "needs_exam", bestScore: 0.6 });

    db.quizAttempt.findMany.mockResolvedValue([{ score: 6, total: 10 }, { score: 7, total: 10 }]);
    expect(await getCertificateState("c1")).toEqual({ status: "ready" });
  });

  it("needs no exam when AI is off and no exam exists", async () => {
    aiEnabled.value = false;
    progress(2, 2);
    db.quizAttempt.findMany.mockResolvedValue([]);

    expect(await getCertificateState("c1")).toEqual({ status: "ready" });
  });

  it("only issues when eligible, and returns the existing code if already issued", async () => {
    progress(10, 5);
    expect(await issueCertificate("c1")).toEqual({ ok: false, error: "not_eligible" });
    expect(db.certificate.create).not.toHaveBeenCalled();

    db.certificate.findUnique.mockResolvedValue({ code: "SC-ABCDEFGHJK", issuedAt: new Date() });
    expect(await issueCertificate("c1")).toEqual({ ok: true, code: "SC-ABCDEFGHJK" });
  });

  it("verifies only well-formed codes and exposes just name, course and date", async () => {
    expect(await verifyCertificate("qualquer coisa")).toBeNull();
    expect(db.certificate.findUnique).not.toHaveBeenCalled();

    db.certificate.findUnique.mockResolvedValue({ issuedAt: new Date("2026-10-21T12:00:00Z"), course: { title: "Curso" }, student: { user: { name: "Ana" } } });

    expect(await verifyCertificate("SC-ABCDEFGHJK")).toEqual({ studentName: "Ana", courseTitle: "Curso", issuedAt: "2026-10-21T12:00:00.000Z" });
  });

  it("renders a PDF", () => {
    const pdf = renderCertificatePdf({ studentName: "Ana Maria", courseTitle: "Curso de Física", code: "SC-ABCDEFGHJK", issuedAt: new Date(), verifyUrl: "https://x/verificar/SC-ABCDEFGHJK" });

    expect(pdf.subarray(0, 4).toString()).toBe("%PDF");
  });
});
