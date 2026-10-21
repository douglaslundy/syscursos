import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  module: { findMany: vi.fn() },
  lessonNote: { findMany: vi.fn() },
  playlist: { findFirst: vi.fn() },
  playlistItem: { findFirst: vi.fn(), update: vi.fn((args: unknown) => args) },
  $transaction: vi.fn(async (ops: unknown[]) => ops),
}));

vi.mock("@/lib/db/prisma", () => ({ prisma: db }));
vi.mock("@/server/services/student-service", () => ({ requireStudentProfileId: vi.fn().mockResolvedValue("s1") }));
vi.mock("@/server/services/study-access", () => ({ listAvailableCourses: vi.fn().mockResolvedValue([{ id: "c1", title: "Curso de Física" }]) }));

import { makeSnippet } from "@/lib/study/search";
import { buildCourseExport } from "@/server/services/export-service";
import { moveInPlaylist } from "@/server/services/playlist-service";

describe("makeSnippet", () => {
  it("centers on the match ignoring accents and case", () => {
    const text = `${"a ".repeat(100)}Fotossíntese ocorre nas folhas ${"b ".repeat(100)}`;
    const snippet = makeSnippet(text, "fotossintese", 20);

    expect(snippet).toContain("Fotossíntese");
    expect(snippet.startsWith("...")).toBe(true);
    expect(snippet.length).toBeLessThan(80);
  });

  it("falls back to the start of the text", () => {
    expect(makeSnippet("texto curto", "xyz")).toBe("texto curto");
  });
});

describe("buildCourseExport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.module.findMany.mockResolvedValue([
      {
        title: "Modulo 1",
        lessons: [
          {
            id: "l1",
            title: "Aula 1",
            aiContents: [
              { kind: "FLASHCARDS", technique: "", content: JSON.stringify([{ q: "O que e\tX?", a: "Linha 1\nLinha 2" }]) },
              { kind: "SUMMARY", technique: "pareto", content: "## Resumo" },
              { kind: "QUIZ", technique: "", content: JSON.stringify({ questions: [{ q: "Q?", options: ["A", "B", "C", "D"], correct: 2, explanation: "porque" }] }) },
            ],
          },
        ],
      },
    ]);
    db.lessonNote.findMany.mockResolvedValue([{ lessonId: "l1", content: "minha nota" }]);
  });

  it("builds an Anki tab-separated file with flashcards and quiz questions, with tabs and line breaks normalized", async () => {
    const file = await buildCourseExport("c1", "anki");
    const rows = file?.body.split("\n") ?? [];

    expect(rows).toHaveLength(2);
    expect(rows[0]).toBe("O que e X?\tLinha 1 Linha 2\tcurso-de-fisica aula-1");
    expect(rows[1]).toContain("Q?\tC porque");
  });

  it("builds Markdown with the student's notes and summaries", async () => {
    const file = await buildCourseExport("c1", "md");

    expect(file?.body).toContain("# Curso de Física");
    expect(file?.body).toContain("minha nota");
    expect(file?.body).toContain("**Resumo (pareto)**");
  });

  it("returns null for a course the student cannot access", async () => {
    expect(await buildCourseExport("outro", "md")).toBeNull();
  });
});

describe("moveInPlaylist", () => {
  it("swaps positions with the neighbor", async () => {
    db.playlistItem.findFirst
      .mockResolvedValueOnce({ id: "i2", playlistId: "p1", position: 2 })
      .mockResolvedValueOnce({ id: "i1", position: 1 });

    expect(await moveInPlaylist("i2", "up")).toBe(true);
    expect(db.playlistItem.update).toHaveBeenCalledWith({ where: { id: "i2" }, data: { position: 1 } });
    expect(db.playlistItem.update).toHaveBeenCalledWith({ where: { id: "i1" }, data: { position: 2 } });
  });

  it("does nothing at the edge", async () => {
    db.playlistItem.findFirst.mockResolvedValueOnce({ id: "i1", playlistId: "p1", position: 1 }).mockResolvedValueOnce(null);

    expect(await moveInPlaylist("i1", "up")).toBe(false);
  });
});
