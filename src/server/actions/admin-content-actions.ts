"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import {
  adminErrorStatus,
  adminStatusPath,
  isRedirectError,
  isSupabaseAdminConfigurationError,
  parseForm,
  requiredString,
  runAdminMutation,
  safeAdminRedirect,
} from "@/server/actions/admin-helpers";
import {
  assertValidCourseCover,
  assertValidImageCover,
  uploadCourseCover,
  uploadImageCover,
} from "@/server/actions/admin-cover-upload";
import { revalidateCourseContent } from "@/server/cache/course-content";
import { recordAudit } from "@/server/services/audit-service";
import {
  clearLessonTranscript,
  removeCourse,
  removeLesson,
  removeLessonMaterial,
  removeModule,
  saveCourse,
  saveLesson,
  saveLessonMaterial,
  saveModule,
  scanCourseDurations,
} from "@/server/services/admin-service";
import { courseSchema, idSchema, lessonMaterialSchema, lessonSchema, moduleSchema } from "@/server/validators/admin";

export async function saveCourseAction(formData: FormData) {
  const path = "/admin/courses";
  let input: z.output<typeof courseSchema>;

  try {
    input = await parseCourseForm(formData, path);
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error("Failed to parse or upload course cover.", error);
    redirect(adminStatusPath(path, adminErrorStatus(error)));
  }

  await runAdminMutation(path, "saved", async () => {
    await saveCourse(input);
    revalidatePath(path);
    revalidateCourseContent();
  });
}

export async function deleteCourseAction(formData: FormData) {
  const path = "/admin/courses";
  const { id } = parseForm(idSchema, formData, path);
  await runAdminMutation(path, "deleted", async () => {
    await removeCourse(id);
    await recordAudit("course.delete", "course", id);
    revalidatePath(path);
    revalidateCourseContent();
  });
}

export async function saveModuleAction(formData: FormData) {
  const input = parseForm(moduleSchema, formData, "/admin/courses");
  const path = `/admin/courses/${input.courseId}/modules`;
  await runAdminMutation(path, "saved", async () => {
    await saveModule(input);
    revalidatePath(path);
    revalidateCourseContent();
  });
}

export async function deleteModuleAction(formData: FormData) {
  const { id } = parseForm(idSchema, formData, "/admin/courses");
  const courseId = requiredString(formData, "courseId", "/admin/courses");
  const path = `/admin/courses/${courseId}/modules`;
  await runAdminMutation(path, "deleted", async () => {
    await removeModule(id);
    await recordAudit("module.delete", "module", id);
    revalidatePath(path);
    revalidateCourseContent();
  });
}

export async function saveLessonAction(formData: FormData) {
  const redirectTo = safeAdminRedirect(formData.get("redirectTo"));
  const fallbackPath = redirectTo ?? "/admin/courses";
  let input: z.output<typeof lessonSchema>;
  try {
    input = await parseLessonForm(formData, fallbackPath);
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error("Failed to parse or upload lesson cover.", error);
    redirect(adminStatusPath(fallbackPath, "invalid"));
  }
  const path = redirectTo ?? `/admin/modules/${input.moduleId}/lessons`;
  try {
    await saveLesson(input);
    revalidatePath(path);
    revalidatePath("/app", "layout");
    revalidateCourseContent();
  } catch (error) {
    console.error("Admin mutation failed.", error);
    redirect(adminStatusPath(path, lessonMutationStatus(error)));
  }

  redirect(adminStatusPath(path, "saved", { formReset: String(Date.now()) }));
}

export async function deleteLessonAction(formData: FormData) {
  const { id } = parseForm(idSchema, formData, "/admin/courses");
  const moduleId = requiredString(formData, "moduleId", "/admin/courses");
  const path = safeAdminRedirect(formData.get("redirectTo")) ?? `/admin/modules/${moduleId}/lessons`;
  await runAdminMutation(path, "deleted", async () => {
    await removeLesson(id);
    await recordAudit("lesson.delete", "lesson", id);
    revalidatePath(path);
    revalidateCourseContent();
  });
}

export async function clearLessonTranscriptAction(formData: FormData) {
  const { id } = parseForm(idSchema, formData, "/admin/courses");
  const moduleId = requiredString(formData, "moduleId", "/admin/courses");
  const path = safeAdminRedirect(formData.get("redirectTo")) ?? `/admin/modules/${moduleId}/lessons`;
  await runAdminMutation(path, "saved", async () => {
    await clearLessonTranscript(id);
    await recordAudit("lesson.clear_transcript", "lesson", id);
    revalidatePath(path);
    revalidateCourseContent();
  });
}

export async function saveLessonMaterialAction(formData: FormData) {
  const input = parseForm(lessonMaterialSchema, formData, "/admin/courses");
  const moduleId = requiredString(formData, "moduleId", "/admin/courses");
  const path = `/admin/modules/${moduleId}/lessons`;

  await runAdminMutation(path, "saved", async () => {
    await saveLessonMaterial(input);
    revalidatePath(path);
    revalidatePath(`/app/courses/${requiredString(formData, "courseId", "/admin/courses")}`);
    revalidateCourseContent();
  });
}

export async function deleteLessonMaterialAction(formData: FormData) {
  const { id } = parseForm(idSchema, formData, "/admin/courses");
  const moduleId = requiredString(formData, "moduleId", "/admin/courses");
  const path = `/admin/modules/${moduleId}/lessons`;

  await runAdminMutation(path, "deleted", async () => {
    await removeLessonMaterial(id);
    await recordAudit("material.delete", "material", id);
    revalidatePath(path);
    revalidatePath(`/app/courses/${requiredString(formData, "courseId", "/admin/courses")}`);
    revalidateCourseContent();
  });
}

const listViewSchema = z.object({
  page: z.coerce.number().int().min(1).optional().catch(undefined),
  pageSize: z.coerce.number().int().min(1).max(100).optional().catch(undefined),
  query: z.string().trim().max(120).optional(),
});

export async function scanCourseDurationsAction(formData: FormData) {
  const path = "/admin/courses";
  const { id } = parseForm(idSchema, formData, path);
  const view = parseForm(listViewSchema, formData, path);
  const listParams: Record<string, string> = { focus: id };
  if (view.page) listParams.page = String(view.page);
  if (view.pageSize) listParams.pageSize = String(view.pageSize);
  if (view.query) listParams.query = view.query;

  await runAdminMutation(path, "durations_scanned", async () => {
    const result = await scanCourseDurations(id);
    const status =
      result.noDriveKey && result.found === 0
        ? "durations_no_key"
        : result.remaining > 0
          ? "durations_partial"
          : "durations_scanned";
    revalidatePath(path);
    redirect(`${adminStatusPath(path, status, listParams)}#course-${id}`);
  });
}

async function parseCourseForm(formData: FormData, errorPath: string) {
  const draft = Object.fromEntries(formData.entries());
  const coverFile = formData.get("coverImageFile");
  delete draft.coverImageFile;

  if (coverFile instanceof File && coverFile.size > 0) {
    assertValidCourseCover(coverFile, errorPath);
    draft.coverImageUrl = await uploadCourseCover(coverFile);
  }

  const parsed = courseSchema.safeParse(draft);

  if (!parsed.success) {
    console.error("Invalid admin course input.", parsed.error.flatten());
    redirect(`${errorPath}?status=invalid`);
  }

  return parsed.data;
}

async function parseLessonForm(formData: FormData, errorPath: string) {
  const draft = Object.fromEntries(formData.entries());
  const coverFile = formData.get("coverImageFile");
  delete draft.coverImageFile;
  delete draft.redirectTo;

  if (coverFile instanceof File && coverFile.size > 0) {
    assertValidImageCover(coverFile, errorPath);
    draft.coverImageUrl = await uploadImageCover(coverFile, "lessons");
  }

  const parsed = lessonSchema.safeParse(draft);

  if (!parsed.success) {
    console.error("Invalid admin lesson input.", parsed.error.flatten());
    redirect(adminStatusPath(errorPath, "invalid"));
  }

  return parsed.data;
}

function lessonMutationStatus(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return "lesson_conflict";
    }

    if (error.code === "P2003" || error.code === "P2021" || error.code === "P2025") {
      return "lesson_invalid";
    }
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (isSupabaseAdminConfigurationError(message)) {
      return "supabase_admin_config";
    }

    if (message.includes("capa maior que o limite")) {
      return "cover_too_large";
    }

    if (message.includes("formato de imagem nao suportado")) {
      return "cover_invalid_type";
    }

    if (message.includes("auth") || message.includes("supabase")) {
      return "lesson_auth_error";
    }

    if (message.includes("storage") || message.includes("bucket")) {
      return "lesson_storage_error";
    }
  }

  return "lesson_save_error";
}
