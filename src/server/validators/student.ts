import { z } from "zod";

export const studentCourseParamsSchema = z.object({
  courseId: z.string().uuid(),
});

export const studentLessonParamsSchema = z.object({
  courseId: z.string().uuid(),
  lessonId: z.string().uuid(),
});

export const completeLessonSchema = z.object({
  courseId: z.string().uuid(),
  lessonId: z.string().uuid(),
});

export const completeLessonActionSchema = completeLessonSchema.extend({
  isCompleted: z.boolean(),
});

export const lessonNoteSchema = z.object({
  courseId: z.string().uuid(),
  lessonId: z.string().uuid(),
  content: z.string().max(12000).transform(sanitizeNoteContent),
});

export const notebookQuerySchema = z.object({
  courseId: z.string().uuid().optional(),
  query: z.string().trim().max(120).optional().default(""),
});

export const studentProfileSchema = z.object({
  name: z.string().trim().min(2).max(160),
  phone: z.string().trim().max(32).optional().transform((value) => (value ? value : null)),
  password: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : null))
    .refine((value) => value === null || value.length >= 8, "A senha deve ter pelo menos 8 caracteres."),
  confirmPassword: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : null)),
}).superRefine((value, context) => {
  if ((value.password ?? null) !== (value.confirmPassword ?? null)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "As senhas informadas devem ser iguais.",
      path: ["confirmPassword"],
    });
  }
});

export type StudentCourseParams = z.infer<typeof studentCourseParamsSchema>;
export type StudentLessonParams = z.infer<typeof studentLessonParamsSchema>;
export type CompleteLessonInput = z.infer<typeof completeLessonSchema>;
export type LessonNoteInput = z.infer<typeof lessonNoteSchema>;
export type NotebookQueryInput = z.infer<typeof notebookQuerySchema>;
export type StudentProfileInput = z.infer<typeof studentProfileSchema>;

export function sanitizeNoteContent(value: string) {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim();
}

const optionalText = (value: unknown) => (typeof value === "string" && value.trim() !== "" ? value.trim() : undefined);

// Exatamente um entre: data final, numero de dias, minutos por dia.
export const studyPlanSchema = z
  .object({
    courseId: z.string().uuid(),
    targetDate: z.preprocess(optionalText, z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
    days: z.preprocess(optionalText, z.coerce.number().int().min(1).max(3650).optional()),
    minutesPerDay: z.preprocess(optionalText, z.coerce.number().int().min(1).max(960).optional()),
  })
  .refine((value) => [value.targetDate, value.days, value.minutesPerDay].filter((v) => v !== undefined).length === 1);

const clock = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const toMinute = (value: string) => Number(value.slice(0, 2)) * 60 + Number(value.slice(3));

export const studyPreferencesSchema = z
  .object({
    weekdays: z.array(z.coerce.number().int().min(0).max(6)).min(1),
    start: clock.transform(toMinute),
    end: clock.transform(toMinute),
  })
  .refine((value) => value.end > value.start);
