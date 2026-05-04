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

export type StudentCourseParams = z.infer<typeof studentCourseParamsSchema>;
export type StudentLessonParams = z.infer<typeof studentLessonParamsSchema>;
export type CompleteLessonInput = z.infer<typeof completeLessonSchema>;
