// Agrupa cartoes de revisao por curso (ordem alfabetica) para a tela de revisao.
export function groupByCourse<T extends { courseId: string; courseTitle: string }>(cards: readonly T[]) {
  const groups = new Map<string, { courseId: string; courseTitle: string; cards: T[] }>();

  for (const card of cards) {
    const group = groups.get(card.courseId) ?? { courseId: card.courseId, courseTitle: card.courseTitle, cards: [] };

    group.cards.push(card);
    groups.set(card.courseId, group);
  }

  return Array.from(groups.values()).sort((a, b) => a.courseTitle.localeCompare(b.courseTitle, "pt-BR"));
}

export type ReviewView = "courses" | "random";

// Padrao: por curso.
export const parseReviewView = (value: unknown): ReviewView => (value === "random" ? "random" : "courses");
