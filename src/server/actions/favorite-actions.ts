"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { setCourseFavorite, setLessonFavorite } from "@/server/services/favorite-service";

const courseSchema = z.object({
  courseId: z.string().uuid(),
  favorite: z.enum(["true", "false"]).transform((value) => value === "true"),
});
const lessonSchema = courseSchema.extend({ lessonId: z.string().uuid() });

export async function toggleCourseFavoriteAction(formData: FormData) {
  const parsed = courseSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return;
  }

  await setCourseFavorite(parsed.data.courseId, parsed.data.favorite);
  revalidatePath(`/app/courses/${parsed.data.courseId}`);
  revalidatePath("/app/favorites/courses");
}

export async function toggleLessonFavoriteAction(formData: FormData) {
  const parsed = lessonSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return;
  }

  const { courseId, lessonId, favorite } = parsed.data;
  await setLessonFavorite(courseId, lessonId, favorite);
  revalidatePath(`/app/courses/${courseId}/lessons/${lessonId}`);
  revalidatePath("/app/favorites/lessons");
}
