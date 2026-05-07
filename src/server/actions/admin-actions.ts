"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { z } from "zod";

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
  saveModule,
  saveStudent,
} from "@/server/services/admin-service";
import {
  cancelEnrollmentSchema,
  courseSchema,
  enrollmentSchema,
  idSchema,
  lessonSchema,
  moduleSchema,
  renewEnrollmentSchema,
  studentSchema,
} from "@/server/validators/admin";

export async function saveCourseAction(formData: FormData) {
  const path = "/admin/courses";
  const input = parseForm(courseSchema, formData, path);
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
  const input = parseForm(lessonSchema, formData, "/admin/courses");
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
  const input = parseForm(studentSchema, formData, path);
  await runAdminMutation(path, "saved", async () => {
    await saveStudent(input);
    revalidatePath(path);
  });
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

  return "error";
}
