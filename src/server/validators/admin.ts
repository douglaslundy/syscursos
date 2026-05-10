import {
  CourseStatus,
  EnrollmentStatus,
  LessonStatus,
  ModuleStatus,
  UserRole,
  UserStatus,
} from "@prisma/client";
import { z } from "zod";

const uuidSchema = z.string().uuid();
const optionalTextSchema = z.string().trim().max(2000).optional().transform(emptyToNull);
const optionalHttpsUrlSchema = z
  .string()
  .trim()
  .max(500)
  .optional()
  .transform(emptyToNull)
  .refine((value) => value === null || isHttpsUrl(value), "Informe uma URL HTTPS valida para a capa.");

export const idSchema = z.object({
  id: uuidSchema,
});

export const courseSchema = z.object({
  id: uuidSchema.optional(),
  title: z.string().trim().min(2).max(180),
  slug: z
    .string()
    .transform(normalizeSlug)
    .pipe(z.string().min(2).max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)),
  description: optionalTextSchema,
  coverImageUrl: optionalHttpsUrlSchema,
  status: z.nativeEnum(CourseStatus).default(CourseStatus.ACTIVE),
});

export const moduleSchema = z.object({
  id: uuidSchema.optional(),
  courseId: uuidSchema,
  title: z.string().trim().min(2).max(180),
  description: optionalTextSchema,
  position: z.coerce.number().int().min(1),
  status: z.nativeEnum(ModuleStatus).default(ModuleStatus.ACTIVE),
});

export const lessonSchema = z.object({
  id: uuidSchema.optional(),
  moduleId: uuidSchema,
  title: z.string().trim().min(2).max(180),
  description: optionalTextSchema,
  youtubeUrl: z
    .string()
    .trim()
    .url()
    .max(500)
    .refine(isYouTubeUrl, "Informe um link valido do YouTube."),
  youtubeVideoId: z.string().trim().max(32).optional().transform(emptyToNull),
  coverImageUrl: optionalHttpsUrlSchema,
  position: z.coerce.number().int().min(1),
  status: z.nativeEnum(LessonStatus).default(LessonStatus.ACTIVE),
});

export const studentSchema = z.object({
  id: uuidSchema.optional(),
  studentProfileId: uuidSchema.optional(),
  email: z.string().trim().email().max(255),
  name: z.string().trim().min(2).max(160),
  password: z
    .string()
    .trim()
    .optional()
    .transform(emptyToNull)
    .refine((value) => value === null || value.length >= 8, "A senha deve ter pelo menos 8 caracteres."),
  document: z.string().trim().max(32).optional().transform(emptyToNull),
  phone: z.string().trim().max(32).optional().transform(emptyToNull),
  status: z.nativeEnum(UserStatus).default(UserStatus.ACTIVE),
});

export const studentEmailLookupSchema = z.object({
  email: z.string().trim().email().max(255),
});

export const studentLinkSchema = z.object({
  studentProfileId: uuidSchema,
});

export const enrollmentSchema = z.object({
  id: uuidSchema.optional(),
  studentId: uuidSchema,
  courseId: uuidSchema,
  startsAt: z.coerce.date(),
  expiresAt: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? new Date(`${value}T00:00:00.000Z`) : null)),
  status: z.nativeEnum(EnrollmentStatus).default(EnrollmentStatus.ACTIVE),
});

export const renewEnrollmentSchema = z.object({
  id: uuidSchema,
  expiresAt: z.coerce.date(),
});

export const cancelEnrollmentSchema = z.object({
  id: uuidSchema,
});

export const managedUserSchema = z
  .object({
    id: uuidSchema.optional(),
    studentProfileId: uuidSchema.optional(),
    role: z.nativeEnum(UserRole),
    email: z.string().trim().email().max(255),
    name: z.string().trim().min(2).max(160),
    password: z
      .string()
      .trim()
      .optional()
      .transform(emptyToNull)
      .refine((value) => value === null || value.length >= 8, "A senha deve ter pelo menos 8 caracteres."),
    document: z.string().trim().max(32).optional().transform(emptyToNull),
    phone: z.string().trim().max(32).optional().transform(emptyToNull),
    status: z.nativeEnum(UserStatus).default(UserStatus.ACTIVE),
    accessExpiresAt: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value ? new Date(`${value}T00:00:00.000Z`) : null)),
  })
  .superRefine((value, context) => {
    if (!value.id && !value.password) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Informe uma senha inicial.",
        path: ["password"],
      });
    }
  });

export const adminProfileSchema = z.object({
  name: z.string().trim().min(2).max(160),
  password: z
    .string()
    .trim()
    .optional()
    .transform(emptyToNull)
    .refine((value) => value === null || value.length >= 8, "A senha deve ter pelo menos 8 caracteres."),
});

export type CourseInput = z.infer<typeof courseSchema>;
export type ModuleInput = z.infer<typeof moduleSchema>;
export type LessonInput = z.infer<typeof lessonSchema>;
export type StudentInput = z.infer<typeof studentSchema>;
export type StudentEmailLookupInput = z.infer<typeof studentEmailLookupSchema>;
export type StudentLinkInput = z.infer<typeof studentLinkSchema>;
export type EnrollmentInput = z.infer<typeof enrollmentSchema>;
export type RenewEnrollmentInput = z.infer<typeof renewEnrollmentSchema>;
export type ManagedUserInput = z.infer<typeof managedUserSchema>;
export type AdminProfileInput = z.infer<typeof adminProfileSchema>;

function emptyToNull(value: string | undefined) {
  return value && value.length > 0 ? value : null;
}

function normalizeSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function isYouTubeUrl(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");
    return (
      (host === "youtube.com" &&
        (url.pathname === "/watch" ||
          url.pathname.startsWith("/embed/") ||
          url.pathname.startsWith("/shorts/") ||
          url.pathname.startsWith("/live/"))) ||
      host === "youtu.be"
    );
  } catch {
    return false;
  }
}

function isHttpsUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}
