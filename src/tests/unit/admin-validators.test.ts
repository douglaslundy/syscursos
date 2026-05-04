import { describe, expect, it } from "vitest";

import { courseSchema, enrollmentSchema, lessonSchema, studentSchema } from "@/server/validators/admin";
import { getPagination } from "@/server/validators/pagination";

describe("admin validators", () => {
  it("validates course input", () => {
    const result = courseSchema.safeParse({
      title: "Curso Admin",
      slug: "curso-admin",
      description: "",
      status: "ACTIVE",
    });

    expect(result.success).toBe(true);
    expect(result.success ? result.data.description : "invalid").toBeNull();
  });

  it("rejects invalid course slug", () => {
    const result = courseSchema.safeParse({
      title: "Curso Admin",
      slug: "Curso Admin",
      status: "ACTIVE",
    });

    expect(result.success).toBe(false);
  });

  it("accepts only YouTube lesson URLs", () => {
    expect(
      lessonSchema.safeParse({
        moduleId: "2b8d0d2c-d34e-4a6b-94e1-2cf03e39a633",
        title: "Aula",
        youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        position: "1",
        status: "ACTIVE",
      }).success,
    ).toBe(true);

    expect(
      lessonSchema.safeParse({
        moduleId: "2b8d0d2c-d34e-4a6b-94e1-2cf03e39a633",
        title: "Aula",
        youtubeUrl: "https://example.com/video",
        position: "1",
        status: "ACTIVE",
      }).success,
    ).toBe(false);
  });

  it("normalizes open-ended enrollment expiration", () => {
    const result = enrollmentSchema.safeParse({
      studentId: "2b8d0d2c-d34e-4a6b-94e1-2cf03e39a633",
      courseId: "8f0896e4-3eb5-45de-8d8f-8d0601f6946b",
      startsAt: "2026-05-04",
      expiresAt: "",
      status: "ACTIVE",
    });

    expect(result.success).toBe(true);
    expect(result.success ? result.data.expiresAt : "invalid").toBeNull();
  });

  it("requires an initial password when creating a student", () => {
    expect(
      studentSchema.safeParse({
        email: "student@example.com",
        name: "Student",
        password: "",
        status: "ACTIVE",
      }).success,
    ).toBe(false);

    expect(
      studentSchema.safeParse({
        email: "student@example.com",
        name: "Student",
        password: "password123",
        status: "ACTIVE",
      }).success,
    ).toBe(true);
  });

  it("normalizes pagination and search filters", () => {
    expect(
      getPagination({
        page: "2",
        pageSize: "25",
        query: "  curso  ",
      }),
    ).toEqual({
      page: 2,
      pageSize: 25,
      query: "curso",
    });
  });
});
