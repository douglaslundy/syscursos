"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { completeLesson } from "@/server/services/student-service";
import { completeLessonSchema } from "@/server/validators/student";

export async function completeLessonAction(formData: FormData) {
  const parsed = completeLessonSchema.safeParse({
    courseId: formData.get("courseId"),
    lessonId: formData.get("lessonId"),
  });

  if (!parsed.success) {
    throw new Error("Entrada de progresso invalida.");
  }

  await completeLesson(parsed.data);
  revalidatePath(`/app/courses/${parsed.data.courseId}`);
  revalidatePath(`/app/courses/${parsed.data.courseId}/lessons/${parsed.data.lessonId}`);
  redirect(`/app/courses/${parsed.data.courseId}/lessons/${parsed.data.lessonId}?status=completed`);
}
