import type { Flashcard } from "@/lib/ai/parsers";

const REVIEW_GAP = 3;

// Estilo Anki: "good" tira o cartao do baralho; "again" devolve o cartao alguns cartoes adiante.
export function gradeCard(queue: Flashcard[], grade: "again" | "good"): Flashcard[] {
  const [current, ...rest] = queue;

  if (!current || grade === "good") return rest;

  rest.splice(Math.min(REVIEW_GAP, rest.length), 0, current);
  return rest;
}
