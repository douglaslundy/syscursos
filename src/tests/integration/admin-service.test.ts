import { beforeEach, describe, expect, it, vi } from "vitest";

const requireRoleMock = vi.hoisted(() => vi.fn());
const repositoryMock = vi.hoisted(() => ({
  upsertCourse: vi.fn(),
  upsertModule: vi.fn(),
  upsertLesson: vi.fn(),
  upsertStudent: vi.fn(),
  upsertEnrollment: vi.fn(),
  renewEnrollment: vi.fn(),
}));

vi.mock("@/server/auth/guards", () => ({
  requireRole: requireRoleMock,
}));

vi.mock("@/server/repositories/admin-repository", () => repositoryMock);

describe("admin service", () => {
  beforeEach(() => {
    requireRoleMock.mockReset();
    requireRoleMock.mockResolvedValue({
      id: "admin-id",
      organizationId: "org-id",
      role: "ADMIN",
      status: "ACTIVE",
    });
    repositoryMock.upsertCourse.mockReset();
    repositoryMock.upsertModule.mockReset();
    repositoryMock.upsertLesson.mockReset();
    repositoryMock.upsertStudent.mockReset();
    repositoryMock.upsertEnrollment.mockReset();
    repositoryMock.renewEnrollment.mockReset();
  });

  it("uses ADMIN authorization for course CRUD writes", async () => {
    const { saveCourse } = await import("@/server/services/admin-service");
    const input = {
      title: "Curso",
      slug: "curso",
      description: null,
      coverImageUrl: null,
      status: "ACTIVE" as const,
    };
    repositoryMock.upsertCourse.mockResolvedValue({ id: "course-id", ...input });

    await expect(saveCourse(input)).resolves.toMatchObject({ id: "course-id" });
    expect(requireRoleMock).toHaveBeenCalledWith("ADMIN");
    expect(repositoryMock.upsertCourse).toHaveBeenCalledWith("org-id", input);
  });

  it("uses ADMIN authorization for module CRUD writes", async () => {
    const { saveModule } = await import("@/server/services/admin-service");
    const input = {
      courseId: "8f0896e4-3eb5-45de-8d8f-8d0601f6946b",
      title: "Modulo",
      description: null,
      coverImageUrl: null,
      position: 1,
      status: "ACTIVE" as const,
    };

    await saveModule(input);
    expect(requireRoleMock).toHaveBeenCalledWith("ADMIN");
    expect(repositoryMock.upsertModule).toHaveBeenCalledWith("org-id", input);
  });

  it("uses ADMIN authorization for lesson CRUD writes", async () => {
    const { saveLesson } = await import("@/server/services/admin-service");
    const input = {
      moduleId: "2b8d0d2c-d34e-4a6b-94e1-2cf03e39a633",
      title: "Aula",
      description: null,
      youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      youtubeVideoId: null,
      position: 1,
      status: "ACTIVE" as const,
    };

    await saveLesson(input);
    expect(requireRoleMock).toHaveBeenCalledWith("ADMIN");
    expect(repositoryMock.upsertLesson).toHaveBeenCalledWith("org-id", input);
  });

  it("uses ADMIN authorization for student CRUD writes", async () => {
    const { saveStudent } = await import("@/server/services/admin-service");
    const input = {
      email: "student@example.com",
      name: "Student",
      password: "password123",
      document: null,
      phone: null,
      status: "ACTIVE" as const,
    };

    await saveStudent(input);
    expect(requireRoleMock).toHaveBeenCalledWith("ADMIN");
    expect(repositoryMock.upsertStudent).toHaveBeenCalledWith("org-id", input);
  });

  it("uses ADMIN authorization for enrollment and renewal", async () => {
    const { renewEnrollment, saveEnrollment } = await import("@/server/services/admin-service");
    const enrollment = {
      studentId: "2b8d0d2c-d34e-4a6b-94e1-2cf03e39a633",
      courseId: "8f0896e4-3eb5-45de-8d8f-8d0601f6946b",
      startsAt: new Date("2026-05-04T00:00:00.000Z"),
      expiresAt: new Date("2026-06-04T00:00:00.000Z"),
      status: "ACTIVE" as const,
    };
    const renewal = {
      id: "4f0896e4-3eb5-45de-8d8f-8d0601f6946b",
      expiresAt: new Date("2026-07-04T00:00:00.000Z"),
    };

    await saveEnrollment(enrollment);
    await renewEnrollment(renewal);

    expect(repositoryMock.upsertEnrollment).toHaveBeenCalledWith("org-id", enrollment);
    expect(repositoryMock.renewEnrollment).toHaveBeenCalledWith("org-id", renewal);
  });
});
