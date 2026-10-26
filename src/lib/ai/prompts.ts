import { getTechnique, type SummaryTechniqueId } from "@/lib/ai/techniques";

export type AiKind = "SUMMARY" | "FLASHCARDS" | "MINDMAP" | "QUIZ";

type PromptInput = {
  kind: AiKind;
  lessonTitle: string;
  technique?: SummaryTechniqueId;
  transcript?: string;
  summary?: string;
};

// Regra OBRIGATORIA de todo material gerado (resumo, quiz, cartoes, mapa mental, prova): precisa fazer sentido sozinho.
const SENSE =
  "REGRA OBRIGATORIA: tudo que voce escrever deve fazer sentido para quem NAO viu a aula. Nunca use referencias soltas como uma letra ou sigla sem explicacao (\"V\", \"X\", \"ele\", \"o autor\", \"o professor\", \"o texto\", \"o personagem\"), nem expressoes como \"na aula\" ou \"conforme dito\" sem dizer do que se trata. Se a transcricao chamar alguem ou algo de forma generica ou ambigua (ex.: uma letra, um apelido, um codinome), diga de quem ou do que se trata pela funcao ou descricao (\"o interlocutor\", \"a tecnica da respiracao diafragmatica\") ou deixe esse detalhe de fora. Escreva em linguagem natural, como uma pessoa explicaria, com sentido completo; nao copie frases truncadas ou erros da transcricao. Prefira omitir um item a incluir algo confuso, ambiguo ou sem contexto.";
const BASE =
  `Voce e um assistente pedagogico. Responda sempre em portugues do Brasil, com base somente no conteudo fornecido, sem inventar fatos. O conteudo e a transcricao de uma aula gravada e pode ter erros de reconhecimento de fala: corrija-os quando o contexto deixar claro. ${SENSE}`;
const MARKDOWN = "Formate em markdown simples: titulos com '#', listas com '-' e negrito com '**'. Nao use tabelas nem HTML.";

const QUIZ_RULES = (min: number, max: number) =>
  `Crie um quiz de multipla escolha para testar a compreensao do conteudo, com ${min} a ${max} questoes conforme a extensao do material. Cada questao tem, sempre que possivel, um contexto (context): 1 a 3 frases curtas (ate 5 linhas) que situam o assunto e dao o minimo necessario para a pergunta fazer sentido para quem NAO leu o resumo nem assistiu a aula, sem entregar a resposta e sem repetir o enunciado; omita o campo (ou use \"\") apenas quando o enunciado ja for totalmente autoexplicativo. Nunca escreva perguntas que dependam de \"na aula\", \"o professor disse\" ou \"conforme o texto\" sem esse contexto. Depois do contexto vem o enunciado claro (q), exatamente 4 alternativas distintas (options), o indice da alternativa correta de 0 a 3 (correct) e uma explicacao curta do porque (explanation). Misture niveis de dificuldade, varie a posicao da resposta correta e evite pegadinhas e "todas as anteriores". Responda somente com JSON no formato {"questions":[{"context":"...","q":"...","options":["...","...","...","..."],"correct":0,"explanation":"..."}]}.`;

// Crivo de quiz e cartoes: um revisor humaniza cada item para fazer sentido sozinho. So reescreve o texto; gabarito e alternativas nao mudam.
export function buildReviewPrompt(input: { kind: "QUIZ" | "FLASHCARDS"; lessonTitle: string; source: string; draft: string }) {
  const isQuiz = input.kind === "QUIZ";
  const task = isQuiz
    ? 'Para cada questao, reescreva o contexto ("context", 1 a 3 frases, ate 5 linhas, que situam o assunto) e o enunciado ("q") para que a pergunta faca sentido completo para quem NAO viu a aula. Nao altere as alternativas, a ordem delas nem o indice correto; mantenha a mesma quantidade e ordem de questoes. Formato: {"questions":[{"context":"...","q":"..."}]}.'
    : 'Para cada cartao, reescreva a pergunta ("q") e a resposta ("a") para que facam sentido completo para quem NAO viu a aula, mantendo o mesmo conteudo, a mesma quantidade e a mesma ordem. Formato: {"cards":[{"q":"...","a":"..."}]}.';

  return {
    system: `${BASE} Voce e um revisor editorial exigente. Receba o rascunho e o conteudo da aula e corrija tudo que seja confuso: perguntas com referencias soltas (uma letra, sigla, "ele", "o autor", "o professor", "na aula"), nomes que nao aparecem de forma clara no conteudo, trechos sem contexto ou frases truncadas. Troque cada referencia vaga pelo que ela e de fato, usando so o conteudo fornecido; se nao der para saber, reformule a pergunta sobre a ideia em si. ${task} Responda somente com JSON.`,
    user: `Aula: ${input.lessonTitle}\n\nConteudo da aula:\n${input.source}\n\nRascunho:\n${input.draft}`,
    json: true,
  };
}

// Prova final do curso: parte dos titulos das aulas e de trechos do que cada uma ensina.
export function buildExamPrompt(input: { courseTitle: string; lessons: Array<{ title: string; excerpt: string }> }) {
  const material = input.lessons.map((lesson, index) => `${index + 1}. ${lesson.title}\n${lesson.excerpt}`).join("\n\n");

  return {
    system: `${BASE} ${QUIZ_RULES(15, 25)} Distribua as questoes entre todas as aulas, priorizando o que e mais importante no curso.`,
    user: `Curso: ${input.courseTitle}\n\nConteudo das aulas:\n${material}`,
    json: true,
  };
}

// Pergunta do aluno respondida so com a transcricao da aula.
export function buildChatPrompt(input: { lessonTitle: string; transcript: string; question: string }) {
  return {
    system: `${BASE} Responda a pergunta do aluno usando somente a transcricao da aula. Quando a resposta estiver na aula, cite o minuto entre colchetes no formato [mm:ss] (use os tempos que aparecem na transcricao). Se a aula nao tratar do assunto, diga isso de forma clara em vez de inventar. Seja didatico e direto, em ate 8 frases. ${MARKDOWN}`,
    user: `Aula: ${input.lessonTitle}\n\nTranscricao:\n${input.transcript}\n\nPergunta do aluno: ${input.question}`,
    json: false,
  };
}

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

  if (input.kind === "QUIZ") {
    return {
      system: `${BASE} ${QUIZ_RULES(5, 10)}`,
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
