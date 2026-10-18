"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { generateLessonTranscript } from "@/server/services/transcript-service";
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
