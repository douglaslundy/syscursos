// source: "Curso - Aula" de onde a questao saiu; so para exibir (nao e gravado no quiz).
// context: contexto curto (ate ~5 linhas) que antecede o enunciado, para a pergunta fazer sentido sem ter lido o resumo. Opcional (quizzes antigos nao tem).
export type QuizQuestion = { q: string; options: string[]; correct: number; explanation: string; context?: string; source?: string };
export type Quiz = { questions: QuizQuestion[] };

const OPTIONS = 4;

const text = (value: unknown) => (typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "");
const MAX_CONTEXT = 600;

// Enunciado precedido do contexto, para telas que mostram a pergunta como um texto so (baralho, WhatsApp).
export const withContext = (question: QuizQuestion) => (question.context ? `${question.context}

${question.q}` : question.q);

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
    const entry = item as { q?: unknown; options?: unknown; correct?: unknown; explanation?: unknown; context?: unknown };
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

    const context = text(entry.context).slice(0, MAX_CONTEXT);

    return valid ? [{ q: text(entry.q), options, correct, explanation: text(entry.explanation), ...(context ? { context } : {}) }] : [];
  });

  return questions.length > 0 ? { questions } : null;
}

// answers[i] e o indice escolhido na questao i (ou null se em branco). Devolve o total de acertos.
export function gradeQuiz(quiz: Quiz, answers: Array<number | null>) {
  return quiz.questions.reduce((score, question, index) => score + (answers[index] === question.correct ? 1 : 0), 0);
}

// Verso do cartao de uma questao: alternativa correta e, se houver, a explicacao.
export const quizAnswerText = (question: QuizQuestion) => `${question.options[question.correct]}${question.explanation ? ` - ${question.explanation}` : ""}`;
