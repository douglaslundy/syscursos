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

export const lessonNoteSchema = z.object({
  courseId: z.string().uuid(),
  lessonId: z.string().uuid(),
  content: z.string().max(12000).transform(sanitizeNoteContent),
});

export const notebookQuerySchema = z.object({
  courseId: z.string().uuid().optional(),
  query: z.string().trim().max(120).optional().default(""),
});

export type StudentCourseParams = z.infer<typeof studentCourseParamsSchema>;
export type StudentLessonParams = z.infer<typeof studentLessonParamsSchema>;
export type CompleteLessonInput = z.infer<typeof completeLessonSchema>;
export type LessonNoteInput = z.infer<typeof lessonNoteSchema>;
export type NotebookQueryInput = z.infer<typeof notebookQuerySchema>;

export function sanitizeNoteContent(value: string) {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim();
}
