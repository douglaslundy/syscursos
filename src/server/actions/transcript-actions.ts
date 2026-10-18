"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { z } from "zod";

import { generateLessonTranscript, resetLessonTranscript, saveRecordedTranscript } from "@/server/services/transcript-service";
import { studentLessonParamsSchema } from "@/server/validators/student";

export async function generateTranscriptAction(formData: FormData) {
  const parsed = studentLessonParamsSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    redirect("/app");
  }

  const { courseId, lessonId } = parsed.data;
  const result = await generateLessonTranscript(courseId, lessonId);
  const path = `/app/courses/${courseId}/lessons/${lessonId}`;
  revalidatePath(path);
  redirect(`${path}?transcript=${result}#transcricao`);
}

export async function resetTranscriptAction(formData: FormData) {
  const parsed = studentLessonParamsSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    redirect("/app");
  }

  const { courseId, lessonId } = parsed.data;
  await resetLessonTranscript(courseId, lessonId);
  const path = `/app/courses/${courseId}/lessons/${lessonId}`;
  revalidatePath(path);
  redirect(`${path}#transcricao`);
}

const recordedTranscriptSchema = z.object({
  courseId: z.string().uuid(),
  lessonId: z.string().uuid(),
  text: z.string().trim().min(1).max(400_000),
});

// Chamada pelo navegador depois da gravacao: guarda o texto final da aula.
export async function saveRecordedTranscriptAction(input: z.infer<typeof recordedTranscriptSchema>) {
  const parsed = recordedTranscriptSchema.safeParse(input);

  if (!parsed.success) {
    return "empty" as const;
  }

  const result = await saveRecordedTranscript(parsed.data.courseId, parsed.data.lessonId, parsed.data.text);
  revalidatePath(`/app/courses/${parsed.data.courseId}/lessons/${parsed.data.lessonId}`);
  return result;
}
