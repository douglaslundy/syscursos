import { buildChatPrompt } from "@/lib/ai/prompts";
import { prisma } from "@/lib/db/prisma";
import { allowAiCall } from "@/server/services/ai/ai-content-service";
import { getActiveAiCredentials } from "@/server/services/ai/ai-settings-service";
import { callProvider } from "@/server/services/ai/providers";
import { findTranscribableLesson } from "@/server/services/transcript-service";

const MAX_TRANSCRIPT_CHARS = 300_000;
const MAX_QUESTION = 500;
const DAILY_LIMIT = 30;

export type ChatError = "forbidden" | "no_transcript" | "invalid" | "no_provider" | "rate_limited" | "daily_limit" | "invalid_key" | "quota" | "failed";
export type ChatResult = { ok: true; answer: string } | { ok: false; error: ChatError };

// Responde a pergunta do aluno so com a transcricao da aula. Nao e guardada (e pessoal) mas o consumo entra no painel.
export async function askLessonChat(input: { courseId: string; lessonId: string; question: string }): Promise<ChatResult> {
  const found = await findTranscribableLesson(input.courseId, input.lessonId);
  const question = input.question.trim().slice(0, MAX_QUESTION);

  if (!found) return { ok: false, error: "forbidden" };
  if (!found.lesson.transcript) return { ok: false, error: "no_transcript" };
  if (question.length < 3) return { ok: false, error: "invalid" };

  const credentials = await getActiveAiCredentials();

  if (!credentials) return { ok: false, error: "no_provider" };

  const since = new Date(Date.now() - 24 * 3_600_000);

  if ((await prisma.aiUsage.count({ where: { studentId: found.studentId, kind: "CHAT", createdAt: { gte: since } } })) >= DAILY_LIMIT) {
    return { ok: false, error: "daily_limit" };
  }

  if (!(await allowAiCall(found.studentId))) return { ok: false, error: "rate_limited" };

  const prompt = buildChatPrompt({ lessonTitle: found.lesson.title, transcript: found.lesson.transcript.slice(0, MAX_TRANSCRIPT_CHARS), question });
  const result = await callProvider(credentials.provider, credentials.key, prompt);

  if (!result.ok) return { ok: false, error: result.reason === "invalid_key" || result.reason === "quota" ? result.reason : "failed" };

  await prisma.aiUsage.create({
    data: { provider: credentials.provider, model: result.model, kind: "CHAT", inputTokens: result.inputTokens, outputTokens: result.outputTokens, studentId: found.studentId, courseId: input.courseId },
  });

  const answer = result.text.trim();

  return answer ? { ok: true, answer: answer.slice(0, 6000) } : { ok: false, error: "failed" };
}
