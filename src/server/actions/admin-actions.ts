"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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
  const input = parseForm(courseSchema, formData);
  await saveCourse(input);
  revalidatePath("/admin/courses");
  redirect("/admin/courses?status=saved");
}

export async function deleteCourseAction(formData: FormData) {
  const { id } = parseForm(idSchema, formData);
  await removeCourse(id);
  revalidatePath("/admin/courses");
  redirect("/admin/courses?status=deleted");
}

export async function saveModuleAction(formData: FormData) {
  const input = parseForm(moduleSchema, formData);
  await saveModule(input);
  revalidatePath(`/admin/courses/${input.courseId}/modules`);
  redirect(`/admin/courses/${input.courseId}/modules?status=saved`);
}

export async function deleteModuleAction(formData: FormData) {
  const { id } = parseForm(idSchema, formData);
  const courseId = requiredString(formData, "courseId");
  await removeModule(id);
  revalidatePath(`/admin/courses/${courseId}/modules`);
  redirect(`/admin/courses/${courseId}/modules?status=deleted`);
}

export async function saveLessonAction(formData: FormData) {
  const input = parseForm(lessonSchema, formData);
  await saveLesson(input);
  revalidatePath(`/admin/modules/${input.moduleId}/lessons`);
  redirect(`/admin/modules/${input.moduleId}/lessons?status=saved`);
}

export async function deleteLessonAction(formData: FormData) {
  const { id } = parseForm(idSchema, formData);
  const moduleId = requiredString(formData, "moduleId");
  await removeLesson(id);
  revalidatePath(`/admin/modules/${moduleId}/lessons`);
  redirect(`/admin/modules/${moduleId}/lessons?status=deleted`);
}

export async function saveStudentAction(formData: FormData) {
  const input = parseForm(studentSchema, formData);
  await saveStudent(input);
  revalidatePath("/admin/students");
  redirect("/admin/students?status=saved");
}

export async function deleteStudentAction(formData: FormData) {
  const { id } = parseForm(idSchema, formData);
  await removeStudent(id);
  revalidatePath("/admin/students");
  redirect("/admin/students?status=deleted");
}

export async function saveEnrollmentAction(formData: FormData) {
  const input = parseForm(enrollmentSchema, formData);
  await saveEnrollment(input);
  revalidatePath("/admin/enrollments");
  redirect("/admin/enrollments?status=saved");
}

export async function renewEnrollmentAction(formData: FormData) {
  const input = parseForm(renewEnrollmentSchema, formData);
  await renewEnrollmentService(input);
  revalidatePath("/admin/enrollments");
  redirect("/admin/enrollments?status=renewed");
}

export async function cancelEnrollmentAction(formData: FormData) {
  const { id } = parseForm(cancelEnrollmentSchema, formData);
  await cancelEnrollmentService(id);
  revalidatePath("/admin/enrollments");
  redirect("/admin/enrollments?status=canceled");
}

function parseForm<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  formData: FormData,
): z.output<TSchema> {
  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    throw new Error("Entrada administrativa invalida.");
  }

  return parsed.data;
}

function requiredString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string" || !value) {
    throw new Error("Entrada administrativa invalida.");
  }

  return value;
}
