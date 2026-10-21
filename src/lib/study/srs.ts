// Repeticao espacada (SM-2 simplificado) para os flashcards.
export type ReviewState = { ease: number; intervalDays: number; reps: number; lapses: number };
export type ReviewGrade = "again" | "hard" | "good" | "easy";

export const INITIAL_REVIEW: ReviewState = { ease: 2.5, intervalDays: 0, reps: 0, lapses: 0 };

const MIN_EASE = 1.3;
const DAY_MS = 86_400_000;

// Errar volta o cartao para amanha (intervalo 1) e reduz a facilidade; acertar multiplica o intervalo pela facilidade.
export function nextReview(state: ReviewState, grade: ReviewGrade, now: Date) {
  let { ease, intervalDays, reps, lapses } = state;

  if (grade === "again") {
    lapses += 1;
    reps = 0;
    intervalDays = 1;
    ease = Math.max(MIN_EASE, ease - 0.2);
  } else {
    reps += 1;
    if (grade === "hard") ease = Math.max(MIN_EASE, ease - 0.15);
    if (grade === "easy") ease += 0.15;

    const base = reps === 1 ? 1 : reps === 2 ? 3 : Math.round(Math.max(intervalDays, 1) * ease);
    const factor = grade === "hard" ? 0.7 : grade === "easy" ? 1.3 : 1;

    intervalDays = Math.max(1, Math.round(base * factor));
  }

  return { ease, intervalDays, reps, lapses, dueAt: new Date(now.getTime() + intervalDays * DAY_MS) };
}

// Chave estavel de um cartao dentro da aula (FNV-1a do enunciado): sobrevive a regerar a lista na mesma ordem ou em outra.
export function cardKey(question: string) {
  let hash = 0x811c9dc5;
  const normalized = question.toLowerCase().replace(/\s+/g, " ").trim();

  for (let index = 0; index < normalized.length; index += 1) {
    hash ^= normalized.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }

  return `${hash.toString(16).padStart(8, "0")}${normalized.length.toString(16)}`;
}
