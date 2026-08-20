"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { toggleLessonCompletion } from "@/server/services/student-service";
import { saveLessonNote } from "@/server/services/student-service";
import { updateOwnStudentProfile } from "@/server/services/student-service";
import {
  completeLessonActionSchema,
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

export type CompleteLessonResult =
  | {
      ok: true;
      isCompleted: boolean;
    }
  | {
      ok: false;
      message: string;
    };

export async function completeLessonAction(input: unknown): Promise<CompleteLessonResult> {
  const parsed = completeLessonActionSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: "Entrada de progresso invalida." };
  }

  const { courseId, lessonId, isCompleted } = parsed.data;
  await toggleLessonCompletion({ courseId, lessonId }, isCompleted);
  revalidatePath(`/app/courses/${courseId}`);
  revalidatePath(`/app/courses/${courseId}/lessons/${lessonId}`);

  return { ok: true, isCompleted };
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
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    redirect("/app/me?status=invalid");
  }

  await updateOwnStudentProfile(parsed.data);
  revalidatePath("/app/me");
  redirect("/app/me?status=saved");
}
