// Sorteio de perguntas do banco de quizzes de um curso.
export const DEFAULT_QUIZ_QUESTIONS = 10;
export const MAX_QUIZ_QUESTIONS = 100;

// Quantidade pedida dentro de 1..max (valor invalido volta ao padrao, limitado ao que existe).
export function clampCount(value: unknown, available: number) {
  const requested = Number.isFinite(Number(value)) && Number(value) >= 1 ? Math.floor(Number(value)) : DEFAULT_QUIZ_QUESTIONS;

  return Math.max(0, Math.min(requested, available, MAX_QUIZ_QUESTIONS));
}

// Fisher-Yates; `random` injetavel para teste.
export function shuffle<T>(items: readonly T[], random: () => number = Math.random) {
  const out = [...items];

  for (let index = out.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));

    [out[index], out[other]] = [out[other], out[index]];
  }

  return out;
}

export const pickQuestions = <T>(bank: readonly T[], count: number, random?: () => number) => shuffle(bank, random).slice(0, clampCount(count, bank.length));
