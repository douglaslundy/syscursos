import { getTechnique, type SummaryTechniqueId } from "@/lib/ai/techniques";

export type AiKind = "SUMMARY" | "FLASHCARDS" | "MINDMAP";

type PromptInput = {
  kind: AiKind;
  lessonTitle: string;
  technique?: SummaryTechniqueId;
  transcript?: string;
  summary?: string;
};

const BASE =
  "Voce e um assistente pedagogico. Responda sempre em portugues do Brasil, com base somente no conteudo fornecido, sem inventar fatos. O conteudo e a transcricao de uma aula gravada e pode ter erros de reconhecimento de fala: corrija-os quando o contexto deixar claro.";
const MARKDOWN = "Formate em markdown simples: titulos com '#', listas com '-' e negrito com '**'. Nao use tabelas nem HTML.";

export function buildPrompt(input: PromptInput): { system: string; user: string; json: boolean } {
  if (input.kind === "SUMMARY") {
    const technique = getTechnique(input.technique ?? "pareto");

    return {
      system: `${BASE} ${MARKDOWN} ${technique.instruction}`,
      user: `Aula: ${input.lessonTitle}\n\nTranscricao:\n${input.transcript ?? ""}`,
      json: false,
    };
  }

  if (input.kind === "FLASHCARDS") {
    return {
      system: `${BASE} Crie flashcards no estilo Anki a partir da aula: cada cartao tem uma pergunta objetiva (q) e uma resposta curta e completa (a). Cubra os principais temas e os pontos mais importantes e relevantes; a quantidade de cartoes depende do conteudo (normalmente de 5 a 30), sem repetir assuntos nem criar cartoes triviais. Responda somente com JSON no formato {"cards":[{"q":"...","a":"..."}]}.`,
      user: `Aula: ${input.lessonTitle}\n\nTranscricao:\n${input.transcript ?? ""}`,
      json: true,
    };
  }

  return {
    system: `${BASE} Monte um mapa mental do resumo recebido. A raiz e o tema central da aula; abaixo dela ate 3 niveis (ramos principais, subtopicos e detalhes), com titulos curtos (no maximo 8 palavras). Entre 3 e 7 ramos principais. Responda somente com JSON no formato {"title":"...","children":[{"title":"...","children":[...]}]}.`,
    user: `Aula: ${input.lessonTitle}\n\nResumo:\n${input.summary ?? ""}`,
    json: true,
  };
}
