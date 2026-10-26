"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { MAX_EXTERNAL_TEXT } from "@/lib/external-notebook";
import type { AiGenerateResult } from "@/server/services/ai/ai-content-service";
import {
  addExternalLesson,
  createExternalNotebook,
  deleteExternalLesson,
  deleteExternalNotebook,
  generateExternalAiContent,
  renameExternalNotebook,
  reviewExternalCard,
  submitExternalQuiz,
  updateExternalLesson,
  type ExternalResult,
} from "@/server/services/external-notebook-service";
import type { QuizSubmitResult } from "@/server/services/quiz-service";

const uuid = z.string().uuid();
const BASE = "/app/notebooks";
const invalid: ExternalResult<never> = { ok: false, error: "invalid" };

// Os campos de texto sao limitados aqui (antes do zod do servico) para nao processar corpos gigantes.
const lessonSchema = z.object({
  title: z.string().max(200),
  transcript: z.string().max(MAX_EXTERNAL_TEXT).nullish(),
  summary: z.string().max(MAX_EXTERNAL_TEXT).nullish(),
});

export async function createNotebookAction(input: { title: string }): Promise<ExternalResult<{ id: string }>> {
  const result = await createExternalNotebook({ title: String(input?.title ?? "") });

  if (result.ok) revalidatePath(BASE);

  return result;
}

export async function renameNotebookAction(id: string, input: { title: string }): Promise<ExternalResult> {
  if (!uuid.safeParse(id).success) return invalid;

  const result = await renameExternalNotebook(id, { title: String(input?.title ?? "") });

  if (result.ok) revalidatePath(BASE, "layout");

  return result;
}

export async function deleteNotebookAction(id: string): Promise<boolean> {
  if (!uuid.safeParse(id).success) return false;

  const done = await deleteExternalNotebook(id);

  if (done) revalidatePath(BASE, "layout");

  return done;
}

export async function addLessonAction(notebookId: string, input: z.infer<typeof lessonSchema>): Promise<ExternalResult<{ id: string }>> {
  const parsed = lessonSchema.safeParse(input);

  if (!uuid.safeParse(notebookId).success || !parsed.success) return invalid;

  const result = await addExternalLesson(notebookId, parsed.data);

  if (result.ok) revalidatePath(BASE, "layout");

  return result;
}

export async function updateLessonAction(lessonId: string, input: z.infer<typeof lessonSchema>): Promise<ExternalResult> {
  const parsed = lessonSchema.safeParse(input);

  if (!uuid.safeParse(lessonId).success || !parsed.success) return invalid;

  const result = await updateExternalLesson(lessonId, parsed.data);

  if (result.ok) revalidatePath(BASE, "layout");

  return result;
}

export async function deleteLessonAction(lessonId: string): Promise<boolean> {
  if (!uuid.safeParse(lessonId).success) return false;

  const done = await deleteExternalLesson(lessonId);

  if (done) revalidatePath(BASE, "layout");

  return done;
}

const generateSchema = z.object({
  lessonId: uuid,
  kind: z.enum(["SUMMARY", "FLASHCARDS", "MINDMAP", "QUIZ"]),
  technique: z.string().max(32).optional(),
});

export async function generateExternalAiAction(input: z.infer<typeof generateSchema>): Promise<AiGenerateResult> {
  const parsed = generateSchema.safeParse(input);

  return parsed.success ? generateExternalAiContent(parsed.data) : { ok: false, error: "forbidden" };
}

const quizSchema = z.object({ lessonId: uuid, answers: z.array(z.number().int().min(0).max(3).nullable()).min(1).max(40) });

export async function submitExternalQuizAction(input: z.infer<typeof quizSchema>): Promise<QuizSubmitResult> {
  const parsed = quizSchema.safeParse(input);

  if (!parsed.success) return { ok: false, error: "invalid" };

  const result = await submitExternalQuiz(parsed.data);

  if (result.ok) revalidatePath(`${BASE}/external/review`);

  return result;
}

const reviewSchema = z.object({ lessonId: uuid, cardKey: z.string().min(1).max(64), grade: z.enum(["again", "hard", "good", "easy"]) });

export async function reviewExternalCardAction(input: z.infer<typeof reviewSchema>) {
  const parsed = reviewSchema.safeParse(input);

  return parsed.success ? reviewExternalCard(parsed.data) : null;
}
