export type QuizQuestion = { q: string; options: string[]; correct: number; explanation: string };
export type Quiz = { questions: QuizQuestion[] };

const OPTIONS = 4;

const text = (value: unknown) => (typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "");

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, ""));
  } catch {
    return null;
  }
}

// Valida o JSON da IA: cada questao precisa de enunciado, exatamente 4 alternativas distintas e uma correta valida.
export function parseQuiz(raw: string): Quiz | null {
  const data = parseJson(raw);
  const list = Array.isArray(data) ? data : data && typeof data === "object" ? (data as { questions?: unknown }).questions : null;

  if (!Array.isArray(list)) return null;

  const questions = list.flatMap((item): QuizQuestion[] => {
    const entry = item as { q?: unknown; options?: unknown; correct?: unknown; explanation?: unknown };
    const options = Array.isArray(entry.options) ? entry.options.map(text) : [];
    const correct = Number(entry.correct);
    const valid =
      text(entry.q) !== "" &&
      options.length === OPTIONS &&
      options.every(Boolean) &&
      new Set(options).size === OPTIONS &&
      Number.isInteger(correct) &&
      correct >= 0 &&
      correct < OPTIONS;

    return valid ? [{ q: text(entry.q), options, correct, explanation: text(entry.explanation) }] : [];
  });

  return questions.length > 0 ? { questions } : null;
}

// answers[i] e o indice escolhido na questao i (ou null se em branco). Devolve o total de acertos.
export function gradeQuiz(quiz: Quiz, answers: Array<number | null>) {
  return quiz.questions.reduce((score, question, index) => score + (answers[index] === question.correct ? 1 : 0), 0);
}
