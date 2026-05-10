"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  cancelEnrollment as cancelEnrollmentService,
  removeCourse,
  removeLesson,
  removeModule,
  removeStudent,
  renewEnrollment as renewEnrollmentService,
  saveCourse,
  saveEnrollment,
  saveLesson,
  saveManagedUser,
  saveModule,
  saveStudent,
  updateOwnAdminProfile,
} from "@/server/services/admin-service";
import {
  cancelEnrollmentSchema,
  courseSchema,
  enrollmentSchema,
  idSchema,
  lessonSchema,
  moduleSchema,
  managedUserSchema,
  renewEnrollmentSchema,
  studentSchema,
  adminProfileSchema,
} from "@/server/validators/admin";

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
    redirect(`${path}?status=${adminErrorStatus(error)}`);
  }

  await runAdminMutation(path, "saved", async () => {
    await saveCourse(input);
    revalidatePath(path);
  });
}

export async function deleteCourseAction(formData: FormData) {
  const path = "/admin/courses";
  const { id } = parseForm(idSchema, formData, path);
  await runAdminMutation(path, "deleted", async () => {
    await removeCourse(id);
    revalidatePath(path);
  });
}

export async function saveModuleAction(formData: FormData) {
  const input = parseForm(moduleSchema, formData, "/admin/courses");
  const path = `/admin/courses/${input.courseId}/modules`;
  await runAdminMutation(path, "saved", async () => {
    await saveModule(input);
    revalidatePath(path);
  });
}

export async function deleteModuleAction(formData: FormData) {
  const { id } = parseForm(idSchema, formData, "/admin/courses");
  const courseId = requiredString(formData, "courseId", "/admin/courses");
  const path = `/admin/courses/${courseId}/modules`;
  await runAdminMutation(path, "deleted", async () => {
    await removeModule(id);
    revalidatePath(path);
  });
}

export async function saveLessonAction(formData: FormData) {
  let input: z.output<typeof lessonSchema>;
  try {
    input = await parseLessonForm(formData, "/admin/courses");
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error("Failed to parse or upload lesson cover.", error);
    redirect("/admin/courses?status=invalid");
  }
  const path = `/admin/modules/${input.moduleId}/lessons`;
  try {
    await saveLesson(input);
    revalidatePath(path);
  } catch (error) {
    console.error("Admin mutation failed.", error);
    redirect(`${path}?status=${adminErrorStatus(error)}`);
  }

  redirect(`${path}?status=saved&formReset=${Date.now()}`);
}

export async function deleteLessonAction(formData: FormData) {
  const { id } = parseForm(idSchema, formData, "/admin/courses");
  const moduleId = requiredString(formData, "moduleId", "/admin/courses");
  const path = `/admin/modules/${moduleId}/lessons`;
  await runAdminMutation(path, "deleted", async () => {
    await removeLesson(id);
    revalidatePath(path);
  });
}

export async function saveStudentAction(formData: FormData) {
  const path = "/admin/students";
  const input = parseStudentForm(formData, path);
  try {
    const result = await saveStudent(input);
    revalidatePath(path);
    if (typeof result === "object" && result && "linkedExisting" in result && result.linkedExisting) {
      redirect(`${path}?status=linked_existing`);
    }
  } catch (error) {
    console.error("Admin mutation failed.", error);
    redirect(`${path}?status=${adminErrorStatus(error)}`);
  }

  redirect(`${path}?status=saved`);
}

export async function deleteStudentAction(formData: FormData) {
  const path = "/admin/students";
  const { id } = parseForm(idSchema, formData, path);
  await runAdminMutation(path, "deleted", async () => {
    await removeStudent(id);
    revalidatePath(path);
  });
}

export async function saveEnrollmentAction(formData: FormData) {
  const path = "/admin/enrollments";
  const input = parseForm(enrollmentSchema, formData, path);
  await runAdminMutation(path, "saved", async () => {
    await saveEnrollment(input);
    revalidatePath(path);
  });
}

export async function renewEnrollmentAction(formData: FormData) {
  const path = "/admin/enrollments";
  const input = parseForm(renewEnrollmentSchema, formData, path);
  await runAdminMutation(path, "renewed", async () => {
    await renewEnrollmentService(input);
    revalidatePath(path);
  });
}

export async function cancelEnrollmentAction(formData: FormData) {
  const path = "/admin/enrollments";
  const { id } = parseForm(cancelEnrollmentSchema, formData, path);
  await runAdminMutation(path, "canceled", async () => {
    await cancelEnrollmentService(id);
    revalidatePath(path);
  });
}

export async function saveManagedUserAction(formData: FormData) {
  const path = "/admin/users";
  const input = parseForm(managedUserSchema, formData, path);
  await runAdminMutation(path, "saved", async () => {
    await saveManagedUser(input);
    revalidatePath(path);
  });
}

export async function saveOwnAdminProfileAction(formData: FormData) {
  const path = "/admin/me";
  const input = parseForm(adminProfileSchema, formData, path);
  await runAdminMutation(path, "saved", async () => {
    await updateOwnAdminProfile(input);
    revalidatePath(path);
  });
}

function parseForm<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  formData: FormData,
  errorPath: string,
): z.output<TSchema> {
  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    console.error("Invalid admin form input.", parsed.error.flatten());
    redirect(`${errorPath}?status=invalid`);
  }

  return parsed.data;
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

  if (coverFile instanceof File && coverFile.size > 0) {
    assertValidImageCover(coverFile, errorPath);
    draft.coverImageUrl = await uploadImageCover(coverFile, "lessons");
  }

  const parsed = lessonSchema.safeParse(draft);

  if (!parsed.success) {
    console.error("Invalid admin lesson input.", parsed.error.flatten());
    redirect(`${errorPath}?status=invalid`);
  }

  return parsed.data;
}

function parseStudentForm(formData: FormData, errorPath: string) {
  const draft = {
    id: formString(formData, "studentUserId") ?? formString(formData, "id"),
    studentProfileId: formString(formData, "studentProfileId"),
    email: formString(formData, "studentEmail") ?? formString(formData, "email"),
    name: formString(formData, "studentName") ?? formString(formData, "name"),
    password: formString(formData, "studentPassword") ?? formString(formData, "password"),
    document: formString(formData, "studentDocument") ?? formString(formData, "document"),
    phone: formString(formData, "studentPhone") ?? formString(formData, "phone"),
    status: formString(formData, "studentStatus") ?? formString(formData, "status"),
  };

  const parsed = studentSchema.safeParse(draft);

  if (!parsed.success) {
    console.error("Invalid admin student input.", parsed.error.flatten());
    redirect(`${errorPath}?status=${studentValidationStatus(parsed.error)}`);
  }

  return parsed.data;
}

function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : undefined;
}

function studentValidationStatus(error: z.ZodError<z.input<typeof studentSchema>>) {
  const fieldErrors = error.flatten().fieldErrors;

  if (fieldErrors.id?.length || fieldErrors.studentProfileId?.length) {
    return "student_invalid_id";
  }

  if (fieldErrors.name?.length) {
    return "student_invalid_name";
  }

  if (fieldErrors.email?.length) {
    return "student_invalid_email";
  }

  if (fieldErrors.password?.length) {
    const messages = fieldErrors.password.join(" ").toLowerCase();
    return messages.includes("senha inicial") ? "student_missing_password" : "student_invalid_password";
  }

  if (fieldErrors.document?.length) {
    return "student_invalid_document";
  }

  if (fieldErrors.phone?.length) {
    return "student_invalid_phone";
  }

  if (fieldErrors.status?.length) {
    return "student_invalid_status";
  }

  return "invalid";
}

function requiredString(formData: FormData, key: string, errorPath: string) {
  const value = formData.get(key);

  if (typeof value !== "string" || !value) {
    redirect(`${errorPath}?status=invalid`);
  }

  return value;
}

async function runAdminMutation(path: string, successStatus: string, mutation: () => Promise<void>) {
  try {
    await mutation();
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error("Admin mutation failed.", error);
    redirect(`${path}?status=${adminErrorStatus(error)}`);
  }

  redirect(`${path}?status=${successStatus}`);
}

function adminErrorStatus(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return "conflict";
    }

    if (error.code === "P2003" || error.code === "P2025") {
      return "invalid";
    }
  }

  if (error instanceof Error && error.message.toLowerCase().includes("auth")) {
    return "auth_error";
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes("supabase_service_role_key") || message.includes("missing required environment variable")) {
      return "storage_error";
    }

    if (message.includes("storage") || message.includes("bucket")) {
      return "storage_error";
    }
  }

  return "error";
}

function isRedirectError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const digest = "digest" in error ? (error as { digest?: unknown }).digest : undefined;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
}

function assertValidCourseCover(file: File, errorPath: string) {
  assertValidImageCover(file, errorPath);
}

function assertValidImageCover(file: File, errorPath: string) {
  const allowedTypes = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/avif",
  ]);
  const maxBytes = 5 * 1024 * 1024;

  if (!allowedTypes.has(file.type) || file.size > maxBytes) {
    redirect(`${errorPath}?status=invalid`);
  }
}

async function uploadCourseCover(file: File) {
  return uploadImageCover(file, "courses");
}

async function uploadImageCover(file: File, folder: "courses" | "lessons") {
  const supabase = createSupabaseAdminClient();
  const bucket = process.env.SUPABASE_COURSE_COVER_BUCKET ?? "course-covers";
  await ensureCourseCoverBucket(supabase, bucket);
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const sanitizedExtension = extension.replace(/[^a-z0-9]/g, "") || "bin";
  const path = `${folder}/${Date.now()}-${crypto.randomUUID()}.${sanitizedExtension}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const upload = await supabase.storage.from(bucket).upload(path, bytes, {
    contentType: file.type,
    upsert: false,
  });

  if (upload.error) {
    throw new Error(`Erro ao enviar capa para storage: ${upload.error.message}`);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

async function ensureCourseCoverBucket(supabase: SupabaseClient, bucket: string) {
  const current = await supabase.storage.getBucket(bucket);

  if (!current.error && current.data) {
    return;
  }

  if (current.error && !current.error.message.toLowerCase().includes("not found")) {
    throw new Error(`Erro ao consultar bucket de capas: ${current.error.message}`);
  }

  const created = await supabase.storage.createBucket(bucket, {
    public: true,
    fileSizeLimit: "5MB",
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"],
  });

  if (created.error && !created.error.message.toLowerCase().includes("already exists")) {
    throw new Error(`Erro ao criar bucket de capas: ${created.error.message}`);
  }
}
