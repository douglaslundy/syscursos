"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { z } from "zod";

import {
  removeAnthropicApiKey,
  removeOpenAiApiKey,
  saveActiveAiProvider,
  saveActiveTechniques,
  saveGeminiAiKey,
  saveAnthropicApiKey,
  saveOpenAiApiKey,
  testAiKey,
} from "@/server/services/ai/ai-settings-service";
import { askLessonChat, type ChatResult } from "@/server/services/ai/chat-service";
import type { AiProviderId } from "@/server/services/ai/providers";
import { recordAudit } from "@/server/services/audit-service";
import { generateAiContent, type AiGenerateResult } from "@/server/services/ai/ai-content-service";

const generateSchema = z.object({
  courseId: z.string().uuid(),
  lessonId: z.string().uuid(),
  kind: z.enum(["SUMMARY", "FLASHCARDS", "MINDMAP", "QUIZ"]),
  technique: z.string().max(32).optional(),
});

// Chamada pelo aluno: devolve o conteudo salvo ou gera um novo (uma vez por aula, tipo e tecnica).
export async function generateAiContentAction(input: z.infer<typeof generateSchema>): Promise<AiGenerateResult> {
  const parsed = generateSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, error: "forbidden" };
  }

  const result = await generateAiContent(parsed.data);

  if (result.ok && !result.cached) {
    revalidatePath(`/app/courses/${parsed.data.courseId}/lessons/${parsed.data.lessonId}`);
  }

  return result;
}

const AI_PATH = "/admin/settings/ai";

function readKey(formData: FormData) {
  const value = formData.get("apiKey");
  return typeof value === "string" ? value.trim() : "";
}

const isValidKey = (key: string) => key.length >= 20 && key.length <= 200 && !/\s/.test(key);
const providerOf = (formData: FormData): AiProviderId => {
  const value = formData.get("provider");

  return value === "gemini" || value === "anthropic" ? value : "openai";
};

const saveKeyFor = { openai: saveOpenAiApiKey, gemini: saveGeminiAiKey, anthropic: saveAnthropicApiKey } as const;

export async function saveAiKeyAction(formData: FormData) {
  const key = readKey(formData);
  const provider = providerOf(formData);

  if (!isValidKey(key)) {
    redirect(`${AI_PATH}?status=ai_invalid_format`);
  }

  await saveKeyFor[provider](key);
  await recordAudit("ai.key_save", "setting", provider);
  redirect(`${AI_PATH}?status=ai_key_saved`);
}

export async function testAiKeyAction(formData: FormData) {
  const result = await testAiKey(providerOf(formData), readKey(formData) || null);
  redirect(`${AI_PATH}?status=ai_test_${result}`);
}

export async function removeOpenAiKeyAction() {
  await removeOpenAiApiKey();
  await recordAudit("ai.key_remove", "setting", "openai");
  redirect(`${AI_PATH}?status=ai_key_removed`);
}

export async function removeAnthropicKeyAction() {
  await removeAnthropicApiKey();
  await recordAudit("ai.key_remove", "setting", "anthropic");
  redirect(`${AI_PATH}?status=ai_key_removed`);
}

export async function saveActiveProviderAction(formData: FormData) {
  const result = await saveActiveAiProvider(providerOf(formData));
  redirect(`${AI_PATH}?status=${result === "saved" ? "ai_provider_saved" : "ai_need_key"}`);
}

export async function saveTechniquesAction(formData: FormData) {
  await saveActiveTechniques(formData.getAll("technique").filter((value): value is string => typeof value === "string"));
  redirect(`${AI_PATH}?status=ai_techniques_saved`);
}

const chatSchema = z.object({ courseId: z.string().uuid(), lessonId: z.string().uuid(), question: z.string().trim().min(3).max(500) });

// Chamada pelo aluno: pergunta sobre a aula respondida pela IA so com a transcricao.
export async function askLessonChatAction(input: z.infer<typeof chatSchema>): Promise<ChatResult> {
  const parsed = chatSchema.safeParse(input);

  return parsed.success ? askLessonChat(parsed.data) : { ok: false, error: "invalid" };
}
