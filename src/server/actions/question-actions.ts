"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { answerQuestion, askQuestion } from "@/server/services/question-service";

const askSchema = z.object({ courseId: z.string().uuid(), lessonId: z.string().uuid(), body: z.string().trim().min(3).max(2000) });

export async function askQuestionAction(input: z.infer<typeof askSchema>) {
  const parsed = askSchema.safeParse(input);

  if (!parsed.success) return { ok: false, error: "invalid" } as const;

  const result = await askQuestion(parsed.data);

  if (result.ok) revalidatePath(`/app/courses/${parsed.data.courseId}/lessons/${parsed.data.lessonId}`);

  return result;
}

const answerSchema = z.object({ id: z.string().uuid(), answer: z.string().trim().min(1).max(4000) });

export async function answerQuestionAction(formData: FormData) {
  const parsed = answerSchema.safeParse({ id: formData.get("id"), answer: formData.get("answer") });

  if (parsed.success) await answerQuestion(parsed.data.id, parsed.data.answer);

  revalidatePath("/admin/questions");
}
