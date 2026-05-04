import {
  CourseStatus,
  EnrollmentStatus,
  LessonStatus,
  ModuleStatus,
  UserStatus,
} from "@prisma/client";
import { z } from "zod";

const uuidSchema = z.string().uuid();
const optionalTextSchema = z.string().trim().max(2000).optional().transform(emptyToNull);

export const idSchema = z.object({
  id: uuidSchema,
});

export const courseSchema = z.object({
  id: uuidSchema.optional(),
  title: z.string().trim().min(2).max(180),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: optionalTextSchema,
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
  position: z.coerce.number().int().min(1),
  status: z.nativeEnum(LessonStatus).default(LessonStatus.ACTIVE),
});

export const studentSchema = z.object({
  id: uuidSchema.optional(),
  studentProfileId: uuidSchema.optional(),
  email: z.string().trim().email().max(255),
  name: z.string().trim().min(2).max(160),
  document: z.string().trim().max(32).optional().transform(emptyToNull),
  phone: z.string().trim().max(32).optional().transform(emptyToNull),
  status: z.nativeEnum(UserStatus).default(UserStatus.ACTIVE),
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

export type CourseInput = z.infer<typeof courseSchema>;
export type ModuleInput = z.infer<typeof moduleSchema>;
export type LessonInput = z.infer<typeof lessonSchema>;
export type StudentInput = z.infer<typeof studentSchema>;
export type EnrollmentInput = z.infer<typeof enrollmentSchema>;
export type RenewEnrollmentInput = z.infer<typeof renewEnrollmentSchema>;

function emptyToNull(value: string | undefined) {
  return value && value.length > 0 ? value : null;
}

function isYouTubeUrl(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");
    return (
      (host === "youtube.com" &&
        (url.pathname === "/watch" || url.pathname.startsWith("/embed/"))) ||
      host === "youtu.be"
    );
  } catch {
    return false;
  }
}
