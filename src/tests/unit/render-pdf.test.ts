// @vitest-environment node
import { describe, expect, it } from "vitest";

import { renderFlashcardsPdf, renderMarkdownPdf, renderMindMapPdf } from "@/server/pdf/render-pdf";

const header = { course: "Curso de Filosofia", module: "Módulo 1", lesson: "Aula inicial" };
const isPdf = (bytes: Buffer) => bytes.subarray(0, 5).toString("latin1") === "%PDF-";

describe("render pdf", () => {
  it("renders a long markdown document across pages with the lesson identification", () => {
    const markdown = ["# Resumo", ...Array.from({ length: 120 }, (_, i) => `- ponto ${i} com acentuação e **negrito**`)].join("\n");
    const bytes = renderMarkdownPdf({ header, title: "Resumo - 80/20", markdown });

    expect(isPdf(bytes)).toBe(true);
    expect(bytes.toString("latin1")).toMatch(/\/Count [2-9]/);
  });

  it("renders flashcards and a mind map", () => {
    expect(isPdf(renderFlashcardsPdf({ header, cards: [{ q: "O que é ética?", a: "Estudo da conduta." }] }))).toBe(true);
    expect(
      isPdf(renderMindMapPdf({ header, map: { title: "Tema", children: [{ title: "A", children: [{ title: "A1" }] }, { title: "B" }] } })),
    ).toBe(true);
  });
});
