"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getCurrentUser } from "@/server/auth/session";
import {
  createEnrollmentRequest,
  EnrollmentRequestError,
} from "@/server/repositories/enrollment-request-repository";

const requestSchema = z.object({ courseId: z.string().uuid() });

export async function requestEnrollmentAction(formData: FormData) {
  const parsed = requestSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    redirect("/cursos?status=invalid");
  }

  const result = await getCurrentUser("client");

  if (!result.ok || result.user.role !== "STUDENT" || !result.user.studentProfileId) {
    redirect("/login/client?next=/cursos");
  }

  try {
    await createEnrollmentRequest(result.user.studentProfileId, parsed.data.courseId);
  } catch (error) {
    if (error instanceof EnrollmentRequestError) {
      redirect(`/cursos?status=${error.status}`);
    }
    console.error("Failed to create enrollment request.", error);
    redirect("/cursos?status=error");
  }

  revalidatePath("/cursos");
  redirect("/cursos?status=requested");
}
