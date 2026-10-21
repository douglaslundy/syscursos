"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { z } from "zod";

import {
  removeOpenAiApiKey,
  saveActiveAiProvider,
  saveActiveTechniques,
  saveGeminiAiKey,
  saveOpenAiApiKey,
  testAiKey,
} from "@/server/services/ai/ai-settings-service";
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
const providerOf = (formData: FormData) => (formData.get("provider") === "gemini" ? "gemini" : "openai");

export async function saveAiKeyAction(formData: FormData) {
  const key = readKey(formData);
  const provider = providerOf(formData);

  if (!isValidKey(key)) {
    redirect(`${AI_PATH}?status=ai_invalid_format`);
  }

  await (provider === "gemini" ? saveGeminiAiKey(key) : saveOpenAiApiKey(key));
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

export async function saveActiveProviderAction(formData: FormData) {
  const result = await saveActiveAiProvider(providerOf(formData));
  redirect(`${AI_PATH}?status=${result === "saved" ? "ai_provider_saved" : "ai_need_key"}`);
}

export async function saveTechniquesAction(formData: FormData) {
  await saveActiveTechniques(formData.getAll("technique").filter((value): value is string => typeof value === "string"));
  redirect(`${AI_PATH}?status=ai_techniques_saved`);
}
