import { Prisma, type AiContentKind } from "@prisma/client";

import { parseFlashcards, parseMindMap } from "@/lib/ai/parsers";
import { buildPrompt } from "@/lib/ai/prompts";
import { isTechniqueId } from "@/lib/ai/techniques";
import { prisma } from "@/lib/db/prisma";
import { getActiveAiCredentials, getActiveAiProvider, getActiveTechniques } from "@/server/services/ai/ai-settings-service";
import { callProvider } from "@/server/services/ai/providers";
import { findTranscribableLesson } from "@/server/services/transcript-service";

// Limite do texto enviado a IA (cabe no contexto dos dois provedores).
const MAX_PROMPT_CHARS = 300_000;

export type AiItem = { kind: AiContentKind; technique: string; content: string; provider: string; createdAt: string };
export type AiGenerateError =
  | "forbidden"
  | "no_transcript"
  | "invalid_technique"
  | "no_summary"
  | "no_provider"
  | "invalid_key"
  | "quota"
  | "failed";
export type AiGenerateResult = { ok: true; item: AiItem; cached: boolean } | { ok: false; error: AiGenerateError };

const toItem = (row: { kind: AiContentKind; technique: string; content: string; provider: string; createdAt: Date }): AiItem => ({
  kind: row.kind,
  technique: row.technique,
  content: row.content,
  provider: row.provider,
  createdAt: row.createdAt.toISOString(),
});

export async function listLessonAiItems(lessonId: string): Promise<AiItem[]> {
  const rows = await prisma.lessonAiContent.findMany({ where: { lessonId }, orderBy: { createdAt: "asc" } });

  return rows.map(toItem);
}

// Disponibilidade para o aluno: se ha IA ativa e quais tecnicas de resumo estao liberadas.
export async function getAiAvailability() {
  const [provider, techniques] = await Promise.all([getActiveAiProvider(), getActiveTechniques()]);

  return { enabled: provider !== null, techniques };
}

export async function deleteLessonAiItems(lessonId: string) {
  await prisma.lessonAiContent.deleteMany({ where: { lessonId } });
}

// Devolve o conteudo ja salvo (sem gastar tokens) ou gera um novo, registra o consumo e salva para todos os alunos.
export async function generateAiContent(input: {
  courseId: string;
  lessonId: string;
  kind: AiContentKind;
  technique?: string;
}): Promise<AiGenerateResult> {
  const found = await findTranscribableLesson(input.courseId, input.lessonId);

  if (!found) return { ok: false, error: "forbidden" };
  if (!found.lesson.transcript) return { ok: false, error: "no_transcript" };

  const technique = input.kind === "FLASHCARDS" ? "" : (input.technique ?? "");

  if (input.kind !== "FLASHCARDS" && (!isTechniqueId(technique) || !(await getActiveTechniques()).includes(technique))) {
    return { ok: false, error: "invalid_technique" };
  }

  const where = { lessonId_kind_technique: { lessonId: input.lessonId, kind: input.kind, technique } };
  const existing = await prisma.lessonAiContent.findUnique({ where });

  if (existing) return { ok: true, item: toItem(existing), cached: true };

  const summary =
    input.kind === "MINDMAP"
      ? await prisma.lessonAiContent.findUnique({
          where: { lessonId_kind_technique: { lessonId: input.lessonId, kind: "SUMMARY", technique } },
        })
      : null;

  if (input.kind === "MINDMAP" && !summary) return { ok: false, error: "no_summary" };

  const credentials = await getActiveAiCredentials();

  if (!credentials) return { ok: false, error: "no_provider" };

  const prompt = buildPrompt({
    kind: input.kind,
    technique: isTechniqueId(technique) ? technique : undefined,
    lessonTitle: found.lesson.title,
    transcript: found.lesson.transcript.slice(0, MAX_PROMPT_CHARS),
    summary: summary?.content,
  });
  const result = await callProvider(credentials.provider, credentials.key, prompt);

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
      studentId: found.studentId,
      courseId: input.courseId,
    },
  });

  const content = normalize(input.kind, result.text);

  if (!content) return { ok: false, error: "failed" };

  try {
    const created = await prisma.lessonAiContent.create({
      data: {
        lessonId: input.lessonId,
        kind: input.kind,
        technique,
        content,
        provider: credentials.provider,
        model: result.model,
        createdById: found.studentId,
      },
    });
    return { ok: true, item: toItem(created), cached: false };
  } catch (error) {
    // Outro aluno gerou o mesmo conteudo ao mesmo tempo: usa o que ficou salvo.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const saved = await prisma.lessonAiContent.findUnique({ where });
      if (saved) return { ok: true, item: toItem(saved), cached: true };
    }
    throw error;
  }
}

// Resumo fica como markdown; cartoes e mapa mental viram JSON ja validado.
function normalize(kind: AiContentKind, text: string) {
  if (kind === "SUMMARY") return text.trim() || null;

  if (kind === "FLASHCARDS") {
    const cards = parseFlashcards(text);
    return cards ? JSON.stringify(cards) : null;
  }

  const map = parseMindMap(text);
  return map ? JSON.stringify(map) : null;
}
