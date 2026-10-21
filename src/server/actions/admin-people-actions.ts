"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { revalidateAuthUser } from "@/server/auth/session";
import {
  isRedirectError,
  isSupabaseAdminConfigurationError,
  parseForm,
  runAdminMutation,
} from "@/server/actions/admin-helpers";
import { StudentMutationError } from "@/server/repositories/admin-repository";
import { recordAudit } from "@/server/services/audit-service";
import {
  approveEnrollmentRequest,
  cancelEnrollment as cancelEnrollmentService,
  linkStudentToProducer,
  lookupStudentByEmail,
  rejectEnrollmentRequest,
  removeStudent,
  renewEnrollment as renewEnrollmentService,
  saveEnrollment,
  saveManagedUser,
  saveStudent,
  updateOwnAdminProfile,
} from "@/server/services/admin-service";
import {
  adminProfileSchema,
  approveEnrollmentRequestSchema,
  cancelEnrollmentSchema,
  enrollmentSchema,
  idSchema,
  managedUserSchema,
  renewEnrollmentSchema,
  studentEmailLookupSchema,
  studentLinkSchema,
  studentSchema,
} from "@/server/validators/admin";

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
    if (isRedirectError(error)) {
      throw error;
    }
    console.error("Admin mutation failed.", error);
    redirect(`${path}?status=${studentMutationStatus(error)}`);
  }

  redirect(`${path}?status=saved`);
}

export async function verifyStudentEmailAction(formData: FormData) {
  const path = "/admin/students";
  const input = parseForm(studentEmailLookupSchema, formData, path);

  try {
    const student = await lookupStudentByEmail(input);
    revalidatePath(path);
    redirect(
      student
        ? `${path}?lookupEmail=${encodeURIComponent(input.email)}&status=student_lookup_found`
        : `${path}?lookupEmail=${encodeURIComponent(input.email)}&status=student_lookup_not_found`,
    );
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error("Admin mutation failed.", error);
    redirect(`${path}?status=${studentMutationStatus(error)}`);
  }
}

export async function linkStudentToProducerAction(formData: FormData) {
  const path = "/admin/students";
  const input = parseForm(studentLinkSchema, formData, path);

  try {
    await linkStudentToProducer(input);
    revalidatePath(path);
    redirect(`${path}?status=linked_existing`);
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error("Admin mutation failed.", error);
    redirect(`${path}?status=${studentMutationStatus(error)}`);
  }
}

export async function deleteStudentAction(formData: FormData) {
  const path = "/admin/students";
  const { id } = parseForm(idSchema, formData, path);
  await runAdminMutation(path, "deleted", async () => {
    await removeStudent(id);
    await recordAudit("student.delete", "student", id);
    revalidatePath(path);
  });
}

export async function saveEnrollmentAction(formData: FormData) {
  const path = "/admin/enrollments";
  const input = parseForm(enrollmentSchema, formData, path);
  await runAdminMutation(path, "saved", async () => {
    await saveEnrollment(input);
    await recordAudit("enrollment.save", "enrollment", null);
    revalidatePath(path);
  });
}

export async function renewEnrollmentAction(formData: FormData) {
  const path = "/admin/enrollments";
  const input = parseForm(renewEnrollmentSchema, formData, path);
  await runAdminMutation(path, "renewed", async () => {
    await renewEnrollmentService(input);
    await recordAudit("enrollment.renew", "enrollment", null);
    revalidatePath(path);
  });
}

export async function cancelEnrollmentAction(formData: FormData) {
  const path = "/admin/enrollments";
  const { id } = parseForm(cancelEnrollmentSchema, formData, path);
  await runAdminMutation(path, "canceled", async () => {
    await cancelEnrollmentService(id);
    await recordAudit("enrollment.cancel", "enrollment", id);
    revalidatePath(path);
  });
}

export async function approveEnrollmentRequestAction(formData: FormData) {
  const path = "/admin/requests";
  const input = parseForm(approveEnrollmentRequestSchema, formData, path);
  await runAdminMutation(path, "approved", async () => {
    await approveEnrollmentRequest(input.id, input.expiresAt);
    await recordAudit("request.approve", "enrollment_request", input.id);
    revalidatePath(path);
  });
}

export async function rejectEnrollmentRequestAction(formData: FormData) {
  const path = "/admin/requests";
  const { id } = parseForm(idSchema, formData, path);
  await runAdminMutation(path, "rejected", async () => {
    await rejectEnrollmentRequest(id);
    await recordAudit("request.reject", "enrollment_request", id);
    revalidatePath(path);
  });
}

export async function saveManagedUserAction(formData: FormData) {
  const path = "/admin/users";
  const input = parseForm(managedUserSchema, formData, path);
  await runAdminMutation(path, "saved", async () => {
    await saveManagedUser(input);
    await recordAudit("user.save", "user", null);
    revalidatePath(path);
  });
}

export async function saveOwnAdminProfileAction(formData: FormData) {
  const path = "/admin/me";
  const input = parseForm(adminProfileSchema, formData, path);
  await runAdminMutation(path, "saved", async () => {
    await updateOwnAdminProfile(input);
    revalidateAuthUser();
    revalidatePath(path);
  });
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

  if (fieldErrors.id?.length) {
    return "student_invalid_user_id";
  }

  if (fieldErrors.studentProfileId?.length) {
    return "student_invalid_profile_id";
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

  return "student_invalid_form";
}

function studentMutationStatus(error: unknown) {
  if (error instanceof StudentMutationError) {
    return error.status;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return studentConflictStatus(error);
    }

    if (error.code === "P2003") {
      return "student_invalid_relation";
    }

    if (error.code === "P2025") {
      return "student_not_found";
    }
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (isSupabaseAdminConfigurationError(message)) {
      return "supabase_admin_config";
    }

    if (message.includes("apenas produtores")) {
      return "student_producer_required";
    }

    if (message.includes("email") || message.includes("e-mail") || message.includes("already registered")) {
      return "student_auth_email";
    }

    if (message.includes("password") || message.includes("senha") || message.includes("weak")) {
      return "student_auth_password";
    }

    if (message.includes("auth") || message.includes("supabase") || message.includes("acesso")) {
      return "student_auth_error";
    }
  }

  return "student_save_error";
}

function studentConflictStatus(error: Prisma.PrismaClientKnownRequestError) {
  const target = Array.isArray(error.meta?.target)
    ? error.meta.target.join(" ").toLowerCase()
    : String(error.meta?.target ?? "").toLowerCase();

  if (target.includes("email")) {
    return "student_email_conflict";
  }

  if (target.includes("document")) {
    return "student_document_conflict";
  }

  if (target.includes("auth_user_id")) {
    return "student_auth_conflict";
  }

  return "student_conflict";
}
