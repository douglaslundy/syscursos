import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import type { z } from "zod";

import { StudentMutationError } from "@/server/repositories/admin-repository";

export function parseForm<TSchema extends z.ZodTypeAny>(
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

export function adminStatusPath(path: string, status: string, extra?: Record<string, string>) {
  const params = new URLSearchParams(extra ?? {});
  params.set("status", status);
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}${params.toString()}`;
}
export function safeAdminRedirect(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.startsWith("/admin") || value.includes("://")) {
    return null;
  }

  return value;
}
export function requiredString(formData: FormData, key: string, errorPath: string) {
  const value = formData.get(key);

  if (typeof value !== "string" || !value) {
    redirect(`${errorPath}?status=invalid`);
  }

  return value;
}

export async function runAdminMutation(path: string, successStatus: string, mutation: () => Promise<void>) {
  try {
    await mutation();
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error("Admin mutation failed.", error);
    redirect(adminStatusPath(path, adminErrorStatus(error)));
  }

  redirect(adminStatusPath(path, successStatus));
}

export function adminErrorStatus(error: unknown) {
  if (error instanceof StudentMutationError) {
    return error.status;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return "conflict";
    }

    if (error.code === "P2003" || error.code === "P2025") {
      return "invalid";
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

    if (message.includes("auth")) {
      return "auth_error";
    }

    if (message.includes("storage") || message.includes("bucket")) {
      return "storage_error";
    }
  }

  return "error";
}

export function isSupabaseAdminConfigurationError(message: string) {
  return (
    message.includes("supabase_service_role_key") ||
    message.includes("missing required environment variable") ||
    message.includes("invalid api key") ||
    message.includes("invalid jwt")
  );
}

export function isRedirectError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const digest = "digest" in error ? (error as { digest?: unknown }).digest : undefined;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
}
