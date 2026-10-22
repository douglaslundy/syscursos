export type SummaryTechniqueId = "pareto" | "cornell" | "feynman" | "outline" | "recall";

export type SummaryTechnique = {
  id: SummaryTechniqueId;
  label: string;
  description: string;
  // Como a tecnica funciona, em linguagem para o aluno (dica ao passar o mouse).
  how: string;
  // Base cientifica resumida, exibida ao administrador.
  evidence: string;
  // Instrucao enviada a IA.
  instruction: string;
};

export const SUMMARY_TECHNIQUES: readonly SummaryTechnique[] = [
  {
    id: "pareto",
    label: "80/20 (Pareto)",
    description: "Os 20% do conteudo que entregam 80% do valor: so o essencial, em poucos pontos.",
    how: "A IA separa as 3 a 7 ideias mais importantes da aula, ordena por relevancia e fecha com a unica coisa que voce nao pode esquecer. Bom para revisar rapido.",
    evidence:
      "Principio de Pareto aplicado ao estudo. E uma heuristica de priorizacao, nao um resultado experimental; funciona bem para reduzir carga e focar no essencial.",
    instruction:
      "Aplique a tecnica 80/20 (Pareto): identifique os 20% das ideias que respondem por 80% do valor da aula. Liste de 3 a 7 pontos essenciais, cada um com 1 ou 2 frases, ordenados por importancia, e feche com uma frase 'Se voce so lembrar de uma coisa'. Deixe de fora o que for secundario.",
  },
  {
    id: "cornell",
    label: "Metodo Cornell",
    description: "Palavras-chave e perguntas a esquerda, anotacoes a direita e um resumo final.",
    how: "A IA divide o resumo em tres partes: perguntas e palavras-chave, anotacoes em topicos e um paragrafo de sintese. Bom para estudar e se autotestar depois.",
    evidence:
      "Metodo de Walter Pauk (Cornell University). Combina anotacao, perguntas-gatilho e revisao; apoiado por estudos de anotacao estruturada e de pratica de recuperacao.",
    instruction:
      "Aplique o Metodo Cornell. Use tres secoes em markdown: '## Palavras-chave e perguntas' (lista de perguntas-gatilho e termos-chave), '## Anotacoes' (os pontos principais da aula, em topicos) e '## Resumo' (um paragrafo de 3 a 5 frases com a sintese da aula).",
  },
  {
    id: "feynman",
    label: "Tecnica Feynman",
    description: "Explica a aula em linguagem simples, como para um iniciante, apontando lacunas.",
    how: "A IA explica a aula com palavras simples e analogias, como para um iniciante, e lista os conceitos mais dificeis ou faceis de confundir.",
    evidence:
      "Baseada em autoexplicacao e elaboracao (Dunlosky et al., 2013, utilidade moderada): explicar com as proprias palavras revela o que nao foi entendido.",
    instruction:
      "Aplique a Tecnica Feynman. Explique o conteudo da aula em linguagem simples, como se falasse com um iniciante, usando analogias e exemplos curtos. Depois inclua '## Pontos que merecem atencao' com os conceitos mais dificeis ou facilmente confundidos.",
  },
  {
    id: "outline",
    label: "Topicos hierarquicos",
    description: "Estrutura em niveis: tema, subtemas e detalhes, para enxergar a organizacao da aula.",
    how: "A IA organiza a aula em temas, subtemas e detalhes, na ordem em que aparecem. Bom para ver a estrutura do conteudo de uma vez.",
    evidence:
      "Organizacao hierarquica do conteudo (outlining) reduz carga cognitiva e favorece a memorizacao de relacoes entre ideias.",
    instruction:
      "Faca um resumo em topicos hierarquicos: titulos '##' para os grandes temas na ordem da aula e, abaixo de cada um, listas com '-' e subitens recuados para os detalhes. Seja objetivo, sem paragrafos longos.",
  },
  {
    id: "recall",
    label: "Recuperacao ativa",
    description: "Perguntas-chave com respostas curtas, para o aluno se testar antes de ler a resposta.",
    how: "A IA cria de 6 a 12 perguntas sobre as ideias principais, cada uma com resposta curta. Tente responder de cabeca antes de ler a resposta.",
    evidence:
      "Pratica de recuperacao (efeito do teste; Roediger e Karpicke, 2006; Dunlosky et al., 2013, utilidade alta): se testar fixa mais do que reler.",
    instruction:
      "Aplique recuperacao ativa. Escreva de 6 a 12 perguntas que cobrem as ideias principais da aula; abaixo de cada pergunta, a resposta curta em 1 ou 2 frases. Use o formato '### Pergunta' seguido da resposta.",
  },
];

const ALL_IDS = SUMMARY_TECHNIQUES.map((item) => item.id);

export function isTechniqueId(value: unknown): value is SummaryTechniqueId {
  return typeof value === "string" && (ALL_IDS as string[]).includes(value);
}

export function getTechnique(id: SummaryTechniqueId) {
  return SUMMARY_TECHNIQUES.find((item) => item.id === id) as SummaryTechnique;
}

// Sem valor salvo (ou valor ilegivel) todas as tecnicas ficam ativas; lista vazia salva desativa o resumo.
export function parseActiveTechniques(raw: string | null | undefined): SummaryTechniqueId[] {
  if (raw === null || raw === undefined) return [...ALL_IDS];

  try {
    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) return [...ALL_IDS];

    return ALL_IDS.filter((id) => parsed.includes(id));
  } catch {
    return [...ALL_IDS];
  }
}
