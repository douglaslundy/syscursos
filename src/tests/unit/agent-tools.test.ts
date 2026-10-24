import { beforeEach, describe, expect, it, vi } from "vitest";

const svc = vi.hoisted(() => ({
  dashboard: vi.fn(),
  startQuiz: vi.fn(),
  startDeck: vi.fn(),
  submit: vi.fn(),
  queue: vi.fn(),
  findCard: vi.fn(),
  review: vi.fn(),
  generate: vi.fn(),
  chat: vi.fn(),
}));

vi.mock("@/server/services/student-service", () => ({ getStudentDashboard: svc.dashboard, getStudentCourse: vi.fn() }));
vi.mock("@/server/services/course-quiz-service", () => ({ startCourseQuiz: svc.startQuiz, startCourseDeck: svc.startDeck, submitCourseQuiz: svc.submit }));
vi.mock("@/server/services/review-service", () => ({ getReviewQueue: svc.queue, findReviewCard: svc.findCard, reviewCard: svc.review }));
vi.mock("@/server/services/ai/ai-content-service", () => ({ generateAiContent: svc.generate, listLessonAiItems: vi.fn() }));
vi.mock("@/server/services/ai/chat-service", () => ({ askLessonChat: svc.chat }));
vi.mock("@/server/services/transcript-service", () => ({ findTranscribableLesson: vi.fn(), generateLessonTranscript: vi.fn() }));

import { AGENT_TOOLS, callAgentTool } from "@/server/agent/agent-tools";

const C = "11111111-1111-4111-8111-111111111111";
const L = "22222222-2222-4222-8222-222222222222";

beforeEach(() => vi.resetAllMocks());

describe("agent tools", () => {
  it("expõe nomes únicos com schema de objeto", () => {
    const names = AGENT_TOOLS.map((tool) => tool.name);

    expect(new Set(names).size).toBe(names.length);
    expect(AGENT_TOOLS.every((tool) => tool.inputSchema.type === "object" && tool.description.length > 20)).toBe(true);
  });

  it("list_courses lista só cursos disponíveis e em andamento, com porcentagem", async () => {
    const card = (id: string, enrollmentStatus: string, percentage: number) => ({ id, title: `Curso ${id}`, enrollmentStatus, progress: { completedLessons: percentage, totalLessons: 100, percentage } });

    svc.dashboard.mockResolvedValue({ courses: [card("a", "AVAILABLE", 40), card("b", "AVAILABLE", 100), card("c", "EXPIRED", 10), card("d", "AVAILABLE", 0)] });

    expect(await callAgentTool("list_courses", {})).toMatchObject({ ok: true, data: { courses: [{ courseId: "a", percent: 40 }, { courseId: "d", percent: 0 }] } });
    expect(await callAgentTool("list_courses", { includeFinished: true })).toMatchObject({ data: { courses: [{ courseId: "a" }, { courseId: "b" }, { courseId: "d" }] } });
  });

  it("start_session quiz de múltipla escolha esconde o gabarito e usa só pendentes", async () => {
    svc.startQuiz.mockResolvedValue({
      ok: true,
      quiz: { questions: [{ q: "P1", options: ["a", "b", "c", "d"], correct: 2, explanation: "x" }] },
      refs: [{ courseId: C, lessonId: L, key: "k1" }],
    });

    const result = await callAgentTool("start_session", { kind: "quiz", format: "choice", scope: "pending", courseId: C, count: 5 });

    expect(svc.startQuiz).toHaveBeenCalledWith(C, 5, { onlyDue: true });
    expect(result).toMatchObject({ ok: true, data: { format: "choice", questions: [{ n: 1, q: "P1", options: ["a", "b", "c", "d"] }], refs: [{ key: "k1" }] } });
    expect(JSON.stringify(result)).not.toContain("explanation");
    expect(JSON.stringify(result)).not.toContain('"correct"');
  });

  it("start_session sem courseId e scope all busca todos os cursos, incluindo já respondidas", async () => {
    svc.startQuiz.mockResolvedValue({ ok: false, error: "no_quiz" });

    const result = await callAgentTool("start_session", { kind: "quiz", format: "choice", scope: "all" });

    expect(svc.startQuiz).toHaveBeenCalledWith(null, 10, { onlyDue: false });
    expect(result).toEqual({ ok: false, error: "no_quiz" });
  });

  it("start_session review em baralho usa a fila de revisão sem expor o verso", async () => {
    const card = (cardKey: string, courseId: string) => ({ courseId, courseTitle: "Curso", moduleTitle: "M", lessonId: L, lessonTitle: "Aula", cardKey, q: `Pergunta ${cardKey}`, a: "SEGREDO", isNew: false });

    svc.queue.mockResolvedValue({ due: [card("a", C), card("b", "outro")], fresh: [card("c", C)], dueTotal: 2 });

    const result = await callAgentTool("start_session", { kind: "review", format: "deck", scope: "pending", courseId: C });

    expect(result).toMatchObject({ ok: true, data: { format: "deck", cards: [{ cardKey: "a", q: "Pergunta a" }, { cardKey: "c" }] } });
    expect(JSON.stringify(result)).not.toContain("SEGREDO");
  });

  it("start_session review pendente vazio devolve none_pending", async () => {
    svc.queue.mockResolvedValue({ due: [], fresh: [], dueTotal: 0 });

    expect(await callAgentTool("start_session", { kind: "review", format: "deck", scope: "pending" })).toEqual({ ok: false, error: "none_pending" });
  });

  it("start_session baralho do banco de quiz usa startCourseDeck", async () => {
    svc.startDeck.mockResolvedValue({ ok: true, cards: [{ courseId: C, courseTitle: "Curso", moduleTitle: "M", lessonId: L, lessonTitle: "Aula", cardKey: "quiz:k", q: "P", a: "R", isNew: true }] });

    const result = await callAgentTool("start_session", { kind: "quiz", format: "deck", scope: "all", count: 3 });

    expect(svc.startDeck).toHaveBeenCalledWith(null, 3, { onlyDue: false });
    expect(result).toMatchObject({ ok: true, data: { cards: [{ cardKey: "quiz:k", q: "P" }] } });
  });

  it("submit_quiz corrige no servidor e devolve acertos, letra certa e explicação", async () => {
    svc.submit.mockResolvedValue({ ok: true, score: 1, total: 2, results: [{ correct: true, chosen: 1, answer: 1, explanation: "e1" }, { correct: false, chosen: null, answer: 3, explanation: "e2" }] });

    const result = await callAgentTool("submit_quiz", { refs: [{ courseId: C, lessonId: L, key: "a" }, { courseId: C, lessonId: L, key: "b" }], answers: [1, null] });

    expect(result).toMatchObject({ ok: true, data: { score: 1, total: 2, percent: 50, results: [{ correct: true }, { correct: false, correctLetter: "D", explanation: "e2" }] } });
  });

  it("answer_card compara a resposta digitada e sugere a nota", async () => {
    svc.findCard.mockResolvedValue({ a: "Mitocôndria - produz energia" });

    const result = await callAgentTool("answer_card", { courseId: C, lessonId: L, cardKey: "k", userAnswer: "mitocondria" });

    expect(result).toMatchObject({ ok: true, data: { expected: "Mitocôndria - produz energia", suggestedGrade: expect.any(String) } });
    expect((result as { data: { percent: number } }).data.percent).toBeGreaterThanOrEqual(70);
  });

  it("answer_card com cartão inexistente devolve not_found", async () => {
    svc.findCard.mockResolvedValue(null);

    expect(await callAgentTool("answer_card", { courseId: C, lessonId: L, cardKey: "k", userAnswer: "x" })).toEqual({ ok: false, error: "not_found" });
  });

  it("rate_card grava só as 4 notas do SRS", async () => {
    svc.review.mockResolvedValue({ intervalDays: 3, dueAt: "2026-10-27T00:00:00.000Z" });

    expect(await callAgentTool("rate_card", { courseId: C, lessonId: L, cardKey: "k", grade: "good" })).toMatchObject({ ok: true, data: { nextReviewInDays: 3 } });
    expect(await callAgentTool("rate_card", { courseId: C, lessonId: L, cardKey: "k", grade: "muito_facil" })).toMatchObject({ ok: false, error: "invalid_input" });
  });

  it("tool desconhecida e entrada inválida não lançam", async () => {
    expect(await callAgentTool("nada", {})).toEqual({ ok: false, error: "unknown_tool" });
    expect(await callAgentTool("submit_quiz", { refs: [], answers: "x" })).toMatchObject({ ok: false, error: "invalid_input" });
  });

  it("erro inesperado vira erro genérico sem vazar detalhes", async () => {
    svc.dashboard.mockRejectedValue(new Error("senha do banco"));
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    expect(await callAgentTool("list_courses", {})).toEqual({ ok: false, error: "internal_error" });
  });
});
