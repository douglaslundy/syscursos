"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { completeLesson } from "@/server/services/student-service";
import { saveLessonNote } from "@/server/services/student-service";
import { updateOwnStudentProfile } from "@/server/services/student-service";
import {
  completeLessonSchema,
  lessonNoteSchema,
  studentProfileSchema,
} from "@/server/validators/student";

export type SaveLessonNoteResult =
  | {
      ok: true;
      content: string;
      updatedAt: string;
    }
  | {
      ok: false;
      message: string;
    };

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

export async function saveLessonNoteAction(input: unknown): Promise<SaveLessonNoteResult> {
  const parsed = lessonNoteSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Anotacao invalida.",
    };
  }

  const note = await saveLessonNote(parsed.data);
  revalidatePath(`/app/courses/${parsed.data.courseId}/lessons/${parsed.data.lessonId}`);
  revalidatePath("/app/notebooks");

  return {
    ok: true,
    content: note.content,
    updatedAt: note.updatedAt.toISOString(),
  };
}

export async function saveOwnStudentProfileAction(formData: FormData) {
  const parsed = studentProfileSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
  });

  if (!parsed.success) {
    redirect("/app/me?status=invalid");
  }

  await updateOwnStudentProfile(parsed.data);
  revalidatePath("/app/me");
  redirect("/app/me?status=saved");
}
