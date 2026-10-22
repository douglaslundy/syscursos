import { describe, expect, it } from "vitest";

import { gradeCard } from "@/lib/ai/deck";
import { parseFlashcards, parseMindMap } from "@/lib/ai/parsers";
import { layoutMindMap, markdownToBlocks, toPdfText } from "@/lib/ai/pdf-content";
import { buildPrompt } from "@/lib/ai/prompts";
import { SUMMARY_TECHNIQUES, parseActiveTechniques } from "@/lib/ai/techniques";
import { monthRange } from "@/lib/ai/usage-range";

describe("summary techniques", () => {
  it("has unique ids and all of them are enabled when nothing is stored", () => {
    const ids = SUMMARY_TECHNIQUES.map((item) => item.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(parseActiveTechniques(null)).toEqual(ids);
  });

  it("keeps only known ids from the stored list and falls back to all on garbage", () => {
    expect(parseActiveTechniques('["pareto","nope","cornell"]')).toEqual(["pareto", "cornell"]);
    expect(parseActiveTechniques("not json")).toEqual(SUMMARY_TECHNIQUES.map((item) => item.id));
    expect(parseActiveTechniques("[]")).toEqual([]);
  });
});

describe("prompts", () => {
  it("embeds the transcript and the technique instruction in the summary prompt", () => {
    const prompt = buildPrompt({ kind: "SUMMARY", technique: "pareto", lessonTitle: "Aula 1", transcript: "texto da aula" });

    expect(prompt.user).toContain("texto da aula");
    expect(prompt.user).toContain("Aula 1");
    expect(prompt.system).toMatch(/80\/20|Pareto/i);
    expect(prompt.json).toBe(false);
  });

  it("asks for JSON in flashcards and mind map prompts", () => {
    expect(buildPrompt({ kind: "FLASHCARDS", lessonTitle: "A", transcript: "t" }).json).toBe(true);
    expect(buildPrompt({ kind: "MINDMAP", technique: "cornell", lessonTitle: "A", summary: "## Resumo" }).user).toContain("## Resumo");
  });
});

describe("parsers", () => {
  it("parses flashcards from a fenced JSON answer and drops incomplete cards", () => {
    const raw = '```json\n{"cards":[{"q":" O que e X? ","a":"Y"},{"q":"sem resposta"},{"q":"Z?","a":"W"}]}\n```';

    expect(parseFlashcards(raw)).toEqual([
      { q: "O que e X?", a: "Y" },
      { q: "Z?", a: "W" },
    ]);
  });

  it("accepts a bare array and rejects empty or invalid output", () => {
    expect(parseFlashcards('[{"q":"a","a":"b"}]')).toHaveLength(1);
    expect(parseFlashcards("nada")).toBeNull();
    expect(parseFlashcards('{"cards":[]}')).toBeNull();
  });

  it("parses a mind map, trims depth to 3 levels and rejects a missing root", () => {
    const raw = JSON.stringify({
      title: "Tema",
      children: [{ title: "A", children: [{ title: "A1", children: [{ title: "A1a", children: [{ title: "deep" }] }] }] }],
    });
    const map = parseMindMap(raw);

    expect(map?.title).toBe("Tema");
    expect(map?.children?.[0].children?.[0].children?.[0].children).toBeUndefined();
    expect(parseMindMap('{"children":[]}')).toBeNull();
  });
});

describe("pdf content", () => {
  it("turns markdown into blocks", () => {
    const blocks = markdownToBlocks("# Titulo\n\ntexto **forte** aqui\ncontinua\n\n- item um\n* item dois\n1. passo");

    expect(blocks).toEqual([
      { type: "heading", level: 1, text: "Titulo" },
      { type: "paragraph", text: "texto forte aqui continua" },
      { type: "bullet", text: "item um" },
      { type: "bullet", text: "item dois" },
      { type: "bullet", text: "passo" },
    ]);
  });

  it("keeps portuguese accents and replaces glyphs the PDF font cannot draw", () => {
    expect(toPdfText("Ação é útil — “ok” → 😀")).toBe("Ação é útil — “ok” ? ?");
  });

  it("lays out a mind map left to right without overlapping leaves", () => {
    const layout = layoutMindMap({
      title: "R",
      children: [{ title: "A", children: [{ title: "A1" }, { title: "A2" }] }, { title: "B" }],
    });
    const leaves = layout.nodes.filter((node) => ["A1", "A2", "B"].includes(node.text));
    const ys = leaves.map((node) => node.y).sort((a, b) => a - b);

    expect(layout.nodes).toHaveLength(5);
    expect(layout.edges).toHaveLength(4);
    expect(new Set(ys).size).toBe(3);
    expect(layout.nodes.find((node) => node.text === "R")?.x).toBeLessThan(layout.nodes.find((node) => node.text === "A1")?.x ?? 0);
    expect(layout.width).toBeGreaterThan(0);
    expect(layout.height).toBeGreaterThan(0);
  });
});

describe("mind map labels", () => {
  it("keeps the whole title and never overlaps nodes of the same column", () => {
    const long = "Importancia de ouvir com atencao e respeito durante toda a conversa com outra pessoa";
    const layout = layoutMindMap({ title: "Raiz", children: [{ title: long }, { title: "Curto" }] });
    const node = layout.nodes.find((item) => item.text === long);
    const short = layout.nodes.find((item) => item.text === "Curto");

    expect(node?.lines.join(" ")).toBe(long);
    expect(node?.lines.length).toBeGreaterThan(2);
    expect(node?.height).toBeGreaterThan(46);
    expect((short?.y ?? 0) >= (node?.y ?? 0) + (node?.height ?? 0)).toBe(true);
  });
});

describe("usage range", () => {
  it("returns the Sao Paulo month boundaries for a valid month", () => {
    const range = monthRange("2026-10");

    expect(range?.from.toISOString()).toBe("2026-10-01T03:00:00.000Z");
    expect(range?.to.toISOString()).toBe("2026-11-01T03:00:00.000Z");
    expect(monthRange("2026-12")?.to.toISOString()).toBe("2027-01-01T03:00:00.000Z");
  });

  it("rejects malformed months", () => {
    expect(monthRange("2026-13")).toBeNull();
    expect(monthRange("abc")).toBeNull();
    expect(monthRange(undefined)).toBeNull();
  });
});

describe("flashcard deck", () => {
  const cards = ["a", "b", "c", "d", "e"].map((q) => ({ q, a: q.toUpperCase() }));

  it("removes a card answered right and brings a missed one back a few cards later", () => {
    expect(gradeCard(cards, "good").map((c) => c.q)).toEqual(["b", "c", "d", "e"]);
    expect(gradeCard(cards, "again").map((c) => c.q)).toEqual(["b", "c", "d", "a", "e"]);
  });

  it("puts a missed card at the end of a short deck and empties the deck at the end", () => {
    expect(gradeCard(cards.slice(0, 2), "again").map((c) => c.q)).toEqual(["b", "a"]);
    expect(gradeCard(cards.slice(0, 1), "good")).toEqual([]);
  });
});
