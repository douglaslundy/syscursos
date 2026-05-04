import { describe, expect, it } from "vitest";

import {
  completeLessonSchema,
  lessonNoteSchema,
  notebookQuerySchema,
  sanitizeNoteContent,
  studentLessonParamsSchema,
} from "@/server/validators/student";

const courseId = "8f0896e4-3eb5-45de-8d8f-8d0601f6946b";
const lessonId = "2b8d0d2c-d34e-4a6b-94e1-2cf03e39a633";

describe("student validators", () => {
  it("validates lesson params", () => {
    expect(studentLessonParamsSchema.safeParse({ courseId, lessonId }).success).toBe(true);
  });

  it("rejects invalid progress payload", () => {
    expect(completeLessonSchema.safeParse({ courseId, lessonId: "invalid" }).success).toBe(false);
  });

  it("sanitizes note content as plain text", () => {
    expect(sanitizeNoteContent("  linha 1\r\nlinha 2\u0000  ")).toBe("linha 1\nlinha 2");
  });

  it("validates lesson note payload", () => {
    const result = lessonNoteSchema.safeParse({
      courseId,
      lessonId,
      content: "Resumo da aula",
    });

    expect(result.success).toBe(true);
  });

  it("validates notebook query", () => {
    const result = notebookQuerySchema.safeParse({
      courseId,
      query: "modulo",
    });

    expect(result.success).toBe(true);
  });
});
