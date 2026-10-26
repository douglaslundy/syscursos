import { z } from "zod";

import { matchAnswer, suggestGrade } from "@/lib/study/answer-match";
import { DEFAULT_QUIZ_QUESTIONS } from "@/lib/study/quiz-pick";
import { generateAiContent, listLessonAiItems } from "@/server/services/ai/ai-content-service";
import { askLessonChat } from "@/server/services/ai/chat-service";
import { checkCourseQuizAnswer, countPendingQuizByCourse, startCourseDeck, startCourseQuiz, submitCourseQuiz } from "@/server/services/course-quiz-service";
import { countPendingMaterials, pendingGenerationByCourse, generatePendingMaterials } from "@/server/services/material-queue-service";
import { isFeatureEnabled } from "@/server/services/feature-service";
import { findReviewCard, getReviewQueue, reviewCard, type ReviewCard } from "@/server/services/review-service";
import { getStudentCourse, getStudentDashboard } from "@/server/services/student-service";
import { findTranscribableLesson, generateLessonTranscript } from "@/server/services/transcript-service";

export type AgentToolResult = { ok: true; data: unknown } | { ok: false; error: string; details?: string };
export type AgentTool = { name: string; description: string; inputSchema: { type: "object"; properties: Record<string, unknown>; required?: string[] }; schema: z.ZodTypeAny; run: (args: never) => Promise<AgentToolResult> };

const id = z.string().uuid();
const ref = z.object({ courseId: id, lessonId: id, key: z.string().min(1).max(64) });
const cardRef = z.object({ courseId: id, lessonId: id, cardKey: z.string().min(1).max(64) });
const count = z.number().int().min(1).max(100).optional();
const MAX_TEXT = 12_000;

const ok = (data: unknown): AgentToolResult => ({ ok: true, data });
const fail = (error: string): AgentToolResult => ({ ok: false, error });
const uuid = { type: "string", format: "uuid" };
const LETTERS = ["A", "B", "C", "D"];

// Cartão para o agente: só a frente. O verso fica no servidor (answer_card) para o agente não vazar a resposta antes de o aluno responder.
const frontOf = (card: ReviewCard) => ({ courseId: card.courseId, courseTitle: card.courseTitle, lessonId: card.lessonId, lessonTitle: card.lessonTitle, cardKey: card.cardKey, q: card.q, isNew: card.isNew });

const listCourses = z.object({ includeFinished: z.boolean().optional(), scope: z.enum(["pending", "all"]).optional(), kind: z.enum(["quiz", "review", "material", "generate"]).optional() });
const startSession = z.object({
  kind: z.enum(["quiz", "review"]),
  format: z.enum(["choice", "deck"]),
  scope: z.enum(["pending", "all"]),
  courseId: id.optional(),
  count,
});
const checkAnswer = z.object({ ref, choice: z.number().int().min(0).max(3) });
const submitQuiz = z.object({ refs: z.array(ref).min(1).max(100), answers: z.array(z.number().int().min(0).max(3).nullable()).min(1).max(100) });
const answerCard = cardRef.extend({ userAnswer: z.string().max(4000) });
const rateCard = cardRef.extend({ grade: z.enum(["again", "hard", "good", "easy"]) });
const courseOnly = z.object({ courseId: id });
const lessonRef = z.object({ courseId: id, lessonId: id });
const material = lessonRef.extend({ kind: z.enum(["summary", "mindmap", "flashcards", "quiz", "transcript"]), technique: z.string().max(32).optional() });
const generate = lessonRef.extend({ kind: z.enum(["summary", "mindmap", "flashcards", "quiz"]), technique: z.string().max(32).optional() });
const pendingArgs = z.object({ courseId: id, kind: z.enum(["quiz", "summary", "mindmap", "flashcards"]), technique: z.string().max(32).optional() });
const ask = lessonRef.extend({ question: z.string().min(3).max(2000) });

// Quantidade pendente por curso para o menu de cursos do agente (so aulas concluidas entram).
async function pendingCounts(kind: "quiz" | "review" | "material" | "generate", courses: Array<{ id: string; progress: { completedLessons: number } }>) {
  if (kind === "quiz") return countPendingQuizByCourse();
  if (kind === "generate") return new Map(Array.from(await pendingGenerationByCourse(), ([course, lessons]) => [course, lessons.length]));
  if (kind === "material") return new Map(courses.map((course) => [course.id, course.progress.completedLessons]));

  const queue = await getReviewQueue();
  const counts = new Map<string, number>();

  for (const card of [...queue.due, ...queue.fresh]) counts.set(card.courseId, (counts.get(card.courseId) ?? 0) + 1);

  return counts;
}

async function runStartSession(args: z.infer<typeof startSession>): Promise<AgentToolResult> {
  const courseId = args.courseId ?? null;
  const limit = args.count ?? DEFAULT_QUIZ_QUESTIONS;
  const options = { onlyDue: args.scope === "pending" };

  if (args.format === "choice") {
    const result = await startCourseQuiz(courseId, limit, options);

    if (!result.ok) return fail(result.error);

    return ok({ format: "choice", questions: result.quiz.questions.map((item, index) => ({ n: index + 1, q: item.q, source: item.source, ...(item.context ? { context: item.context } : {}), options: item.options })), refs: result.refs });
  }

  // Revisão pendente em baralho: fila do SRS (flashcards da IA + cartões de quiz vencidos + novos do dia).
  if (args.kind === "review" && args.scope === "pending") {
    const queue = await getReviewQueue();
    const cards = [...queue.due, ...queue.fresh].filter((card) => !courseId || card.courseId === courseId).slice(0, limit);

    return cards.length === 0 ? fail("none_pending") : ok({ format: "deck", cards: cards.map(frontOf), dueTotal: queue.dueTotal });
  }

  const result = await startCourseDeck(courseId, limit, options);

  return result.ok ? ok({ format: "deck", cards: result.cards.map(frontOf) }) : fail(result.error);
}

const KIND = { summary: "SUMMARY", mindmap: "MINDMAP", flashcards: "FLASHCARDS", quiz: "QUIZ" } as const;

export const AGENT_TOOLS: AgentTool[] = [
  {
    name: "list_courses",
    description:
      "Lista os cursos do aluno com a porcentagem de conclusão. Sem scope: só cursos em andamento (menos de 100%). Com scope + kind (use depois de perguntar ao aluno o escopo, ANTES de escolher curso): scope pending = só cursos que têm algo pendente para aquele kind (campo pending = quantidade); scope all = TODOS os cursos, inclusive concluídos. kind: quiz (perguntas novas ou vencidas), review (cartões vencidos/novos), generate (aulas concluídas sem material), material (cursos com aulas concluídas).",
    inputSchema: {
      type: "object",
      properties: {
        includeFinished: { type: "boolean", description: "Inclui cursos já 100% concluídos." },
        scope: { type: "string", enum: ["pending", "all"] },
        kind: { type: "string", enum: ["quiz", "review", "material", "generate"] },
      },
    },
    schema: listCourses,
    run: async (args: z.infer<typeof listCourses>) => {
      const { courses } = await getStudentDashboard();
      const available = courses.filter((course) => course.enrollmentStatus === "AVAILABLE");
      const shape = (course: (typeof available)[number], pending?: number) => ({ courseId: course.id, title: course.title, percent: course.progress.percentage, completedLessons: course.progress.completedLessons, totalLessons: course.progress.totalLessons, ...(pending === undefined ? {} : { pending }) });

      if (!args.scope || !args.kind) return ok({ courses: available.filter((course) => args.includeFinished || course.progress.percentage < 100).map((course) => shape(course)) });

      const counts = await pendingCounts(args.kind, available);
      // Em "generate" cada curso traz SÓ as aulas concluídas com algo por gerar (e o que falta), nunca todas as aulas.
      const lessonsByCourse = args.kind === "generate" ? await pendingGenerationByCourse() : new Map<string, Array<{ title: string; missing: string[] }>>();
      const list = available.map((course) => ({ ...shape(course, counts.get(course.id) ?? 0), ...(args.kind === "generate" ? { pendingLessons: (lessonsByCourse.get(course.id) ?? []).slice(0, 20) } : {}) }));

      return ok({ scope: args.scope, courses: args.scope === "all" ? list : list.filter((course) => (course.pending ?? 0) > 0) });
    },
  },
  {
    name: "start_session",
    description:
      "Inicia uma sessão de estudo e devolve as perguntas SEM o gabarito. kind: quiz ou review. format: choice = múltipla escolha (corrigir depois com submit_quiz); deck = baralho (pergunta aberta; usar answer_card e rate_card). scope: pending = só o que está pendente/vencido/novo; all = inclui o que já foi respondido mesmo fora do prazo. Sem courseId = todos os cursos em andamento (geral). Erro none_pending = nada pendente; ofereça scope all.",
    inputSchema: {
      type: "object",
      properties: {
        kind: { type: "string", enum: ["quiz", "review"] },
        format: { type: "string", enum: ["choice", "deck"] },
        scope: { type: "string", enum: ["pending", "all"] },
        courseId: { ...uuid, description: "Omitir para geral (todos os cursos)." },
        count: { type: "integer", minimum: 1, maximum: 100, description: "Padrão 10." },
      },
      required: ["kind", "format", "scope"],
    },
    schema: startSession,
    run: runStartSession,
  },
  {
    name: "check_answer",
    description: "Quiz de múltipla escolha: confere UMA resposta logo depois que o aluno responde. Envie o ref da pergunta (de start_session) e choice (0-3 = A-D). Devolve correct, correctLetter e explanation para mostrar junto da próxima pergunta. Não grava nada: no fim, envie tudo com submit_quiz.",
    inputSchema: { type: "object", properties: { ref: { type: "object", properties: { courseId: uuid, lessonId: uuid, key: { type: "string" } }, required: ["courseId", "lessonId", "key"] }, choice: { type: "integer", minimum: 0, maximum: 3 } }, required: ["ref", "choice"] },
    schema: checkAnswer,
    run: async (args: z.infer<typeof checkAnswer>) => {
      const reveal = await checkCourseQuizAnswer(args);

      // Sem gabarito = a pergunta da sessão não existe mais (quiz regenerado depois do start_session): sessão desatualizada.
      return reveal ? ok({ correct: reveal.correct, correctLetter: LETTERS[reveal.answer], explanation: reveal.explanation }) : fail("stale_session");
    },
  },
  {
    name: "submit_quiz",
    description: "Corrige no servidor um quiz de múltipla escolha. Envie os refs recebidos em start_session e answers (índice 0-3 de A-D por pergunta, null se em branco). Grava a tentativa e agenda a repetição espaçada. Devolve acertos, letra correta e explicação de cada questão.",
    inputSchema: {
      type: "object",
      properties: {
        refs: { type: "array", items: { type: "object", properties: { courseId: uuid, lessonId: uuid, key: { type: "string" } }, required: ["courseId", "lessonId", "key"] } },
        answers: { type: "array", items: { type: ["integer", "null"], minimum: 0, maximum: 3 } },
      },
      required: ["refs", "answers"],
    },
    schema: submitQuiz,
    run: async (args: z.infer<typeof submitQuiz>) => {
      const result = await submitCourseQuiz(args);

      if (!result.ok) return fail(result.error === "invalid" ? "stale_session" : result.error);

      return ok({
        score: result.score,
        total: result.total,
        percent: Math.round((result.score / result.total) * 100),
        results: result.results.map((item) => ({ correct: item.correct, chosenLetter: item.chosen === null ? null : LETTERS[item.chosen], correctLetter: LETTERS[item.answer], explanation: item.explanation })),
      });
    },
  },
  {
    name: "answer_card",
    description: "Baralho: compara a resposta digitada pelo aluno com o verso do cartão. Devolve percent (0-100, por palavras; paráfrase pode pontuar baixo), expected (verso) e suggestedGrade. Mostre ao aluno e peça a nota com rate_card.",
    inputSchema: { type: "object", properties: { courseId: uuid, lessonId: uuid, cardKey: { type: "string" }, userAnswer: { type: "string" } }, required: ["courseId", "lessonId", "cardKey", "userAnswer"] },
    schema: answerCard,
    run: async (args: z.infer<typeof answerCard>) => {
      const card = await findReviewCard(args.courseId, args.lessonId, args.cardKey);

      if (!card) return fail("not_found");

      const percent = matchAnswer(args.userAnswer, card.a);

      return ok({ percent, expected: card.a, suggestedGrade: suggestGrade(percent) });
    },
  },
  {
    name: "rate_card",
    description: "Baralho: grava a dificuldade percebida do cartão e agenda a próxima revisão (SM-2). Notas do sistema: again = Errei, hard = Difícil, good = Bom, easy = Fácil. Não existem 'muito fácil' nem 'muito difícil'.",
    inputSchema: { type: "object", properties: { courseId: uuid, lessonId: uuid, cardKey: { type: "string" }, grade: { type: "string", enum: ["again", "hard", "good", "easy"] } }, required: ["courseId", "lessonId", "cardKey", "grade"] },
    schema: rateCard,
    run: async (args: z.infer<typeof rateCard>) => {
      const next = await reviewCard(args);

      return next ? ok({ nextReviewInDays: next.intervalDays, dueAt: next.dueAt }) : fail("forbidden");
    },
  },
  {
    name: "list_lessons",
    description: "Lista as aulas de um curso (módulo, título, se está concluída). Use para o aluno escolher a aula de um resumo, mapa mental ou transcrição.",
    inputSchema: { type: "object", properties: { courseId: uuid }, required: ["courseId"] },
    schema: courseOnly,
    run: async (args: z.infer<typeof courseOnly>) => {
      const course = await getStudentCourse(args.courseId);

      if (course.status !== "AVAILABLE") return fail("unavailable");

      return ok({ modules: course.modules.map((module) => ({ title: module.title, lessons: module.lessons.map((lesson) => ({ lessonId: lesson.id, title: lesson.title, completed: course.completedLessonIds.has(lesson.id) })) })) });
    },
  },
  {
    name: "get_material",
    description: "Lê material já existente de uma aula: summary, mindmap (JSON de árvore), flashcards, quiz ou transcript. Não gasta IA. Se vier vazio, use generate_material (ou transcribe_lesson para transcrição).",
    inputSchema: { type: "object", properties: { courseId: uuid, lessonId: uuid, kind: { type: "string", enum: ["summary", "mindmap", "flashcards", "quiz", "transcript"] }, technique: { type: "string" } }, required: ["courseId", "lessonId", "kind"] },
    schema: material,
    run: async (args: z.infer<typeof material>) => {
      const found = await findTranscribableLesson(args.courseId, args.lessonId);

      if (!found) return fail("forbidden");

      if (args.kind !== "transcript" && !found.completed) return fail("not_completed");

      if (args.kind === "transcript") {
        const text = found.lesson.transcript ?? "";

        return ok({ available: text !== "", text: text.slice(0, MAX_TEXT), truncated: text.length > MAX_TEXT });
      }

      const items = (await listLessonAiItems(args.lessonId)).filter((item) => item.kind === KIND[args.kind as keyof typeof KIND] && (!args.technique || item.technique === args.technique));

      return ok({ items: items.map((item) => ({ technique: item.technique, content: item.content.slice(0, MAX_TEXT), createdAt: item.createdAt })) });
    },
  },
  {
    name: "pending_materials",
    description: "Conta o que falta gerar em UM curso: aulas que o aluno já CONCLUIU e ainda não têm o material do tipo pedido (quiz também serve para o baralho; flashcards alimentam a revisão). Não gasta IA. Use antes de generate_pending para mostrar quantas aulas serão geradas.",
    inputSchema: { type: "object", properties: { courseId: uuid, kind: { type: "string", enum: ["quiz", "summary", "mindmap", "flashcards"] }, technique: { type: "string", description: "Só summary e mindmap; omitido usa a primeira técnica ativa." } }, required: ["courseId", "kind"] },
    schema: pendingArgs,
    run: async (args: z.infer<typeof pendingArgs>) => {
      const found = await countPendingMaterials(args.courseId, args.kind, args.technique);

      return found ? ok(found) : fail("forbidden");
    },
  },
  {
    name: "generate_pending",
    description: "Gera o material pendente de UM curso, só de aulas concluídas, em paralelo, quantas couberem em ~35 s por chamada (gasta IA). Devolve generated, failed, remaining e, se parou por limite global de IA, stoppedBy. Chame de novo SEM perguntar nada enquanto remaining > 0 e não houver stoppedBy. Antes da primeira chamada, confirme o gasto de IA com o aluno.",
    inputSchema: { type: "object", properties: { courseId: uuid, kind: { type: "string", enum: ["quiz", "summary", "mindmap", "flashcards"] }, technique: { type: "string" } }, required: ["courseId", "kind"] },
    schema: pendingArgs,
    run: async (args: z.infer<typeof pendingArgs>) => {
      const result = await generatePendingMaterials(args.courseId, args.kind, args.technique);

      return result ? ok(result) : fail("forbidden");
    },
  },
  {
    name: "generate_material",
    description: "Gera (ou devolve o já salvo) resumo, mapa mental, flashcards ou quiz de UMA aula com a IA configurada na plataforma. Só aulas que o aluno já concluiu (senão not_completed). Gasta tokens; exige transcrição. Mapa mental exige um resumo da mesma technique.",
    inputSchema: { type: "object", properties: { courseId: uuid, lessonId: uuid, kind: { type: "string", enum: ["summary", "mindmap", "flashcards", "quiz"] }, technique: { type: "string", description: "Técnica de resumo (ex.: pareto). Só para summary e mindmap." } }, required: ["courseId", "lessonId", "kind"] },
    schema: generate,
    run: async (args: z.infer<typeof generate>) => {
      const result = await generateAiContent({ courseId: args.courseId, lessonId: args.lessonId, kind: KIND[args.kind], technique: args.technique });

      return result.ok ? ok({ cached: result.cached, content: result.item.content.slice(0, MAX_TEXT) }) : fail(result.error);
    },
  },
  {
    name: "transcribe_lesson",
    description: "Gera a transcrição de uma aula do YouTube usando a legenda do vídeo. Resultados: ok, exists (já havia), unsupported, unavailable. Para outros vídeos a transcrição é feita no navegador do site.",
    inputSchema: { type: "object", properties: { courseId: uuid, lessonId: uuid }, required: ["courseId", "lessonId"] },
    schema: lessonRef,
    run: async (args: z.infer<typeof lessonRef>) => ok({ result: await generateLessonTranscript(args.courseId, args.lessonId) }),
  },
  {
    name: "ask_lesson",
    description: "Pergunta livre sobre uma aula; a resposta usa só a transcrição. Limite diário e por minuto.",
    inputSchema: { type: "object", properties: { courseId: uuid, lessonId: uuid, question: { type: "string" } }, required: ["courseId", "lessonId", "question"] },
    schema: ask,
    run: async (args: z.infer<typeof ask>) => {
      const result = await askLessonChat(args);

      return result.ok ? ok({ answer: result.answer }) : fail(result.error);
    },
  },
];

// next/navigation lança erros com digest NEXT_REDIRECT / NEXT_NOT_FOUND quando o service nega acesso.
const nextErrorOf = (error: unknown) => (typeof error === "object" && error !== null && "digest" in error ? String((error as { digest: unknown }).digest) : "");

export async function callAgentTool(name: string, rawArgs: unknown): Promise<AgentToolResult> {
  const tool = AGENT_TOOLS.find((item) => item.name === name);

  if (!tool) return fail("unknown_tool");
  if (!(await isFeatureEnabled(`agent:${name}`))) return fail("disabled");

  const parsed = tool.schema.safeParse(rawArgs ?? {});

  if (!parsed.success) return { ok: false, error: "invalid_input", details: parsed.error.issues.map((issue) => `${issue.path.join(".")} ${issue.message}`).join("; ") };

  try {
    return await tool.run(parsed.data as never);
  } catch (error) {
    const digest = nextErrorOf(error);

    if (digest.startsWith("NEXT_REDIRECT")) return fail("forbidden");
    if (digest.startsWith("NEXT_NOT_FOUND")) return fail("not_found");

    console.error("Agent tool failed.", name, error);
    return fail("internal_error");
  }
}
