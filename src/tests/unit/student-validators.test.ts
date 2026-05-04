import { describe, expect, it } from "vitest";

import { completeLessonSchema, studentLessonParamsSchema } from "@/server/validators/student";

const courseId = "8f0896e4-3eb5-45de-8d8f-8d0601f6946b";
const lessonId = "2b8d0d2c-d34e-4a6b-94e1-2cf03e39a633";

describe("student validators", () => {
  it("validates lesson params", () => {
    expect(studentLessonParamsSchema.safeParse({ courseId, lessonId }).success).toBe(true);
  });

  it("rejects invalid progress payload", () => {
    expect(completeLessonSchema.safeParse({ courseId, lessonId: "invalid" }).success).toBe(false);
  });
});
