import type { ReviewGrade } from "@/lib/study/srs";

const tokens = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 2);

// Porcentagem (0-100) de semelhança entre a resposta digitada e o gabarito, por palavras (sem IA).
// Gabarito longo (alternativa + explicação): quem acerta a alternativa, que vem antes do " - ", já pontua alto.
// shortcut: compara palavras, não sentido; paráfrase pode pontuar baixo. O agente pode ajustar a nota.
export function matchAnswer(userAnswer: string, expected: string) {
  const given = new Set(tokens(userAnswer));
  const head = tokens(expected.split(" - ")[0]);
  const all = new Set(tokens(expected));

  if (given.size === 0 || all.size === 0) return 0;

  const dice = (target: Set<string>) => (2 * [...given].filter((word) => target.has(word)).length) / (given.size + target.size);
  const headSet = new Set(head);

  return Math.round(Math.max(dice(all), headSet.size > 0 && headSet.size < all.size ? dice(headSet) : 0) * 100);
}

// Nota sugerida do SRS a partir do acerto; o aluno pode trocar.
export function suggestGrade(percent: number): ReviewGrade {
  if (percent >= 90) return "easy";
  if (percent >= 70) return "good";
  if (percent >= 40) return "hard";
  return "again";
}
