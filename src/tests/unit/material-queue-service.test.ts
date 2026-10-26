import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({ findMany: vi.fn(), generate: vi.fn(), student: vi.fn(), courses: vi.fn(), techniques: vi.fn() }));

vi.mock("@/lib/db/prisma", () => ({ prisma: { lesson: { findMany: m.findMany } } }));
vi.mock("@/server/services/student-service", () => ({ requireStudentProfileId: m.student }));
vi.mock("@/server/services/study-access", () => ({ listAvailableCourses: m.courses }));
vi.mock("@/server/services/ai/ai-settings-service", () => ({ getActiveTechniques: m.techniques }));
vi.mock("@/server/services/ai/ai-content-service", () => ({ generateAiContent: m.generate }));

import { generatePendingMaterials } from "@/server/services/material-queue-service";

const lessons = (count: number) => Array.from({ length: count }, (_, index) => ({ id: `l${index}`, title: `Aula ${index}`, transcript: "texto", aiContents: [] }));

beforeEach(() => {
  vi.resetAllMocks();
  m.student.mockResolvedValue("s1");
  m.courses.mockResolvedValue([{ id: "c1" }]);
  m.techniques.mockResolvedValue(["pareto"]);
});

describe("generatePendingMaterials", () => {
  it("gera todas as aulas pendentes de uma vez, sem o limite por minuto", async () => {
    m.findMany.mockResolvedValue(lessons(7));
    m.generate.mockResolvedValue({ ok: true });

    const result = await generatePendingMaterials("c1", "quiz");

    expect(result).toMatchObject({ remaining: 0, failed: [] });
    expect(result?.generated).toHaveLength(7);
    expect(m.generate).toHaveBeenCalledWith(expect.objectContaining({ bulk: true }));
  });

  it("erro global para a geracao e mantem as aulas em remaining", async () => {
    m.findMany.mockResolvedValue(lessons(7));
    m.generate.mockResolvedValue({ ok: false, error: "rate_limited" });

    expect(await generatePendingMaterials("c1", "quiz")).toMatchObject({ generated: [], failed: [], remaining: 7, stoppedBy: "rate_limited" });
  });

  it("erro proprio de uma aula entra em failed e nao para as outras", async () => {
    m.findMany.mockResolvedValue(lessons(3));
    m.generate.mockImplementation(async ({ lessonId }: { lessonId: string }) => (lessonId === "l1" ? { ok: false, error: "failed" } : { ok: true }));

    expect(await generatePendingMaterials("c1", "quiz")).toMatchObject({ generated: ["Aula 0", "Aula 2"], failed: [{ title: "Aula 1", error: "failed" }], remaining: 0 });
  });
});
