import { describe, expect, it } from "vitest";

import { courseSchema, enrollmentSchema, lessonSchema, studentSchema } from "@/server/validators/admin";
import { getPagination } from "@/server/validators/pagination";

describe("admin validators", () => {
  it("validates course input", () => {
    const result = courseSchema.safeParse({
      title: "Curso Admin",
      slug: "curso-admin",
      description: "",
      coverImageUrl: "https://example.com/capa.jpg",
      status: "ACTIVE",
    });

    expect(result.success).toBe(true);
    expect(result.success ? result.data.description : "invalid").toBeNull();
    expect(result.success ? result.data.coverImageUrl : "invalid").toBe("https://example.com/capa.jpg");
  });

  it("rejects invalid course slug", () => {
    const result = courseSchema.safeParse({
      title: "Curso Admin",
      slug: "!",
      status: "ACTIVE",
    });

    expect(result.success).toBe(false);
  });

  it("rejects course cover URL without HTTPS", () => {
    const result = courseSchema.safeParse({
      title: "Curso Admin",
      slug: "curso-admin",
      coverImageUrl: "http://example.com/capa.jpg",
      status: "ACTIVE",
    });

    expect(result.success).toBe(false);
  });

  it("normalizes a human-entered course slug", () => {
    const result = courseSchema.safeParse({
      title: "Curso Admin",
      slug: "  Curso Administração_2026  ",
      status: "ACTIVE",
    });

    expect(result.success).toBe(true);
    expect(result.success ? result.data.slug : "invalid").toBe("curso-administracao-2026");
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

  it("allows editing a student without changing the password", () => {
    const result = studentSchema.safeParse({
      id: "4f0896e4-3eb5-45de-8d8f-8d0601f6946b",
      studentProfileId: "2b8d0d2c-d34e-4a6b-94e1-2cf03e39a633",
      email: "student@example.com",
      name: "Student",
      password: "",
      document: "",
      phone: "",
      status: "ACTIVE",
    });

    expect(result.success).toBe(true);
    expect(result.success ? result.data.password : "invalid").toBeNull();
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
