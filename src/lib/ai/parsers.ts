export type Flashcard = { q: string; a: string };
export type MindMapNode = { title: string; children?: MindMapNode[] };

const MAX_DEPTH = 3;

function parseJson(raw: string): unknown {
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");

  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

const text = (value: unknown) => (typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "");

export function parseFlashcards(raw: string): Flashcard[] | null {
  const data = parseJson(raw);
  const list = Array.isArray(data) ? data : data && typeof data === "object" ? (data as { cards?: unknown }).cards : null;

  if (!Array.isArray(list)) return null;

  const cards = list.flatMap((item): Flashcard[] => {
    const q = text((item as { q?: unknown })?.q);
    const a = text((item as { a?: unknown })?.a);
    return q && a ? [{ q, a }] : [];
  });

  return cards.length > 0 ? cards : null;
}

function toNode(value: unknown, depth: number): MindMapNode | null {
  const title = text((value as { title?: unknown })?.title).slice(0, 120);

  if (!title) return null;

  const rawChildren = (value as { children?: unknown })?.children;
  const children =
    depth < MAX_DEPTH && Array.isArray(rawChildren)
      ? rawChildren.flatMap((child) => toNode(child, depth + 1) ?? [])
      : [];

  return children.length > 0 ? { title, children } : { title };
}

// Raiz + ate 3 niveis abaixo dela; o que passar disso e descartado.
export function parseMindMap(raw: string): MindMapNode | null {
  return toNode(parseJson(raw), 0);
}
