import { Prisma, type AiContentKind } from "@prisma/client";

import { hitGlobal, resetRateLimits } from "@/server/security/rate-limit";
import { parseFlashcards, parseMindMap } from "@/lib/ai/parsers";
import { parseQuiz } from "@/lib/ai/quiz";
import { buildPrompt, buildReviewPrompt, type AiKind } from "@/lib/ai/prompts";
import { isTechniqueId } from "@/lib/ai/techniques";
import { prisma } from "@/lib/db/prisma";
import { getActiveAiCredentials, getActiveAiProvider, getActiveTechniques } from "@/server/services/ai/ai-settings-service";
import { callProvider } from "@/server/services/ai/providers";
import { findTranscribableLesson } from "@/server/services/transcript-service";

// Limite do texto enviado a IA (cabe no contexto dos dois provedores).
export const MAX_PROMPT_CHARS = 300_000;

// Tipos guardados por aula em LessonAiContent (EXAM e CHAT nao ficam aqui).
export type LessonAiKind = AiKind & AiContentKind;
const LESSON_KINDS: LessonAiKind[] = ["SUMMARY", "FLASHCARDS", "MINDMAP", "QUIZ"];
const isLessonKind = (kind: AiContentKind): kind is LessonAiKind => (LESSON_KINDS as AiContentKind[]).includes(kind);

export type AiItem = { kind: LessonAiKind; technique: string; content: string; provider: string; createdAt: string };
export type AiGenerateError =
  | "forbidden"
  | "not_completed"
  | "no_transcript"
  | "invalid_technique"
  | "no_summary"
  | "no_provider"
  | "rate_limited"
  | "invalid_key"
  | "quota"
  | "failed";
export type AiGenerateResult = { ok: true; item: AiItem; cached: boolean } | { ok: false; error: AiGenerateError };

export const toItem = (row: { kind: LessonAiKind; technique: string; content: string; provider: string; createdAt: Date }): AiItem => ({
  kind: row.kind,
  technique: row.technique,
  content: row.content,
  provider: row.provider,
  createdAt: row.createdAt.toISOString(),
});

export async function listLessonAiItems(lessonId: string): Promise<AiItem[]> {
  const rows = await prisma.lessonAiContent.findMany({ where: { lessonId, kind: { in: LESSON_KINDS } }, orderBy: { createdAt: "asc" } });

  return rows.flatMap((row) => (isLessonKind(row.kind) ? [toItem({ ...row, kind: row.kind })] : []));
}

// Disponibilidade para o aluno: se ha IA ativa e quais tecnicas de resumo estao liberadas.
export async function getAiAvailability() {
  const [provider, techniques] = await Promise.all([getActiveAiProvider(), getActiveTechniques()]);

  return { enabled: provider !== null, techniques };
}

export async function deleteLessonAiItems(lessonId: string) {
  await prisma.lessonAiContent.deleteMany({ where: { lessonId } });
}

// Tipos sem tecnica de resumo: um unico conteudo por aula.
export const TECHNIQUELESS = new Set<LessonAiKind>(["FLASHCARDS", "QUIZ"]);

// Quem pede varias geracoes seguidas (ou falhando) gasta tokens: limite por aluno, global (banco).
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 5;

export function resetAiRateLimit() {
  resetRateLimits();
}

export function allowAiCall(studentId: string) {
  return hitGlobal(`ai:${studentId}`, RATE_MAX, RATE_WINDOW_MS);
}

// Dois alunos pedindo o mesmo conteudo ao mesmo tempo compartilham uma unica chamada a IA.
const inFlight = new Map<string, Promise<AiGenerateResult>>();

// Devolve o conteudo ja salvo (sem gastar tokens) ou gera um novo, registra o consumo e salva para todos os alunos.
export function generateAiContent(input: {
  courseId: string;
  lessonId: string;
  kind: LessonAiKind;
  technique?: string;
  // Geracao em lote pedida pelo aluno (fila de pendentes): nao conta no limite de chamadas por minuto.
  bulk?: boolean;
}): Promise<AiGenerateResult> {
  const key = `${input.lessonId}:${input.kind}:${input.technique ?? ""}`;
  const pending = inFlight.get(key) ?? runGenerate(input).finally(() => inFlight.delete(key));

  inFlight.set(key, pending);
  return pending;
}

async function runGenerate(input: {
  courseId: string;
  lessonId: string;
  kind: LessonAiKind;
  technique?: string;
  bulk?: boolean;
}): Promise<AiGenerateResult> {
  const found = await findTranscribableLesson(input.courseId, input.lessonId);

  if (!found) return { ok: false, error: "forbidden" };
  if (!found.completed) return { ok: false, error: "not_completed" };
  if (!found.lesson.transcript) return { ok: false, error: "no_transcript" };

  const technique = TECHNIQUELESS.has(input.kind) ? "" : (input.technique ?? "");

  if (!TECHNIQUELESS.has(input.kind) && (!isTechniqueId(technique) || !(await getActiveTechniques()).includes(technique))) {
    return { ok: false, error: "invalid_technique" };
  }

  const where = { lessonId_kind_technique: { lessonId: input.lessonId, kind: input.kind, technique } };
  const existing = await prisma.lessonAiContent.findUnique({ where });

  if (existing) return { ok: true, item: toItem({ ...existing, kind: input.kind }), cached: true };

  const summary =
    input.kind === "MINDMAP"
      ? await prisma.lessonAiContent.findUnique({
          where: { lessonId_kind_technique: { lessonId: input.lessonId, kind: "SUMMARY", technique } },
        })
      : null;

  if (input.kind === "MINDMAP" && !summary) return { ok: false, error: "no_summary" };

  const prompt = buildPrompt({
    kind: input.kind,
    technique: isTechniqueId(technique) ? technique : undefined,
    lessonTitle: found.lesson.title,
    transcript: found.lesson.transcript.slice(0, MAX_PROMPT_CHARS),
    summary: summary?.content,
  });
  const generated = await callAndRecord({ kind: input.kind, prompt, studentId: found.studentId, courseId: input.courseId, bulk: input.bulk });

  if (!generated.ok) return generated;

  const { content, provider, model } = generated;

  try {
    const created = await prisma.lessonAiContent.create({
      data: {
        lessonId: input.lessonId,
        kind: input.kind,
        technique,
        content,
        provider,
        model,
        createdById: found.studentId,
      },
    });
    return { ok: true, item: toItem({ ...created, kind: input.kind }), cached: false };
  } catch (error) {
    // Outro aluno gerou o mesmo conteudo ao mesmo tempo: usa o que ficou salvo.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const saved = await prisma.lessonAiContent.findUnique({ where });
      if (saved) return { ok: true, item: toItem({ ...saved, kind: input.kind }), cached: true };
    }
    throw error;
  }
}

// Chama a IA com os limites de uso: provedor ativo, limite por aluno, registro em AiUsage e conteudo ja validado.
// Serve a aulas do curso e a aulas de cadernos externos (courseId nulo).
export async function callAndRecord(input: {
  kind: LessonAiKind;
  prompt: ReturnType<typeof buildPrompt>;
  studentId: string;
  courseId: string | null;
  bulk?: boolean;
}): Promise<{ ok: true; content: string; provider: string; model: string } | { ok: false; error: AiGenerateError }> {
  const credentials = await getActiveAiCredentials();

  if (!credentials) return { ok: false, error: "no_provider" };
  if (!input.bulk && !(await allowAiCall(input.studentId))) return { ok: false, error: "rate_limited" };

  const result = await callProvider(credentials.provider, credentials.key, input.prompt);

  if (!result.ok) {
    return { ok: false, error: result.reason === "invalid_key" || result.reason === "quota" ? result.reason : "failed" };
  }

  // Os tokens foram gastos mesmo que a resposta venha inutilizavel.
  await prisma.aiUsage.create({
    data: {
      provider: credentials.provider,
      model: result.model,
      kind: input.kind,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      studentId: input.studentId,
      courseId: input.courseId,
    },
  });

  const content = await applyReview(input, credentials, normalize(input.kind, result.text));

  return content ? { ok: true, content, provider: credentials.provider, model: result.model } : { ok: false, error: "failed" };
}

type Credentials = NonNullable<Awaited<ReturnType<typeof getActiveAiCredentials>>>;

const textField = (value: unknown) => (typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "");

// Crivo: segunda chamada que reescreve perguntas/cartoes para fazerem sentido sozinhos. Mantem alternativas e gabarito do original;
// se a revisao falhar ou vier fora de formato, fica o rascunho (ja validado) em vez de perder o material.
async function applyReview(input: Parameters<typeof callAndRecord>[0], credentials: Credentials, content: string | null) {
  if (!content || (input.kind !== "QUIZ" && input.kind !== "FLASHCARDS")) return content;

  const reviewed = await callProvider(
    credentials.provider,
    credentials.key,
    buildReviewPrompt({ kind: input.kind, lessonTitle: input.prompt.user.split("\n")[0] ?? "", source: input.prompt.user, draft: content }),
  );

  if (!reviewed.ok) return content;

  await prisma.aiUsage.create({
    data: { provider: credentials.provider, model: reviewed.model, kind: input.kind, inputTokens: reviewed.inputTokens, outputTokens: reviewed.outputTokens, studentId: input.studentId, courseId: input.courseId },
  });

  try {
    const draft = JSON.parse(content) as { questions?: Array<Record<string, unknown>> } | Array<Record<string, unknown>>;
    const fixed = JSON.parse(reviewed.text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "")) as { questions?: Array<Record<string, unknown>>; cards?: Array<Record<string, unknown>> };

    if (input.kind === "QUIZ") {
      const original = (draft as { questions: Array<Record<string, unknown>> }).questions;

      if (!Array.isArray(fixed.questions) || fixed.questions.length !== original.length) return content;

      return JSON.stringify({ questions: original.map((question, index) => ({ ...question, q: textField(fixed.questions?.[index]?.q) || question.q, ...(textField(fixed.questions?.[index]?.context) ? { context: textField(fixed.questions?.[index]?.context).slice(0, 600) } : {}) })) });
    }

    const original = draft as Array<Record<string, unknown>>;

    if (!Array.isArray(fixed.cards) || fixed.cards.length !== original.length) return content;

    return JSON.stringify(original.map((card, index) => ({ q: textField(fixed.cards?.[index]?.q) || card.q, a: textField(fixed.cards?.[index]?.a) || card.a })));
  } catch {
    return content;
  }
}

// Resumo fica como markdown; cartoes e mapa mental viram JSON ja validado.
function normalize(kind: LessonAiKind, text: string) {
  if (kind === "SUMMARY") return text.trim() || null;

  if (kind === "FLASHCARDS") {
    const cards = parseFlashcards(text);
    return cards ? JSON.stringify(cards) : null;
  }

  if (kind === "QUIZ") {
    const quiz = parseQuiz(text);
    return quiz ? JSON.stringify(quiz) : null;
  }

  const map = parseMindMap(text);
  return map ? JSON.stringify(map) : null;
}
