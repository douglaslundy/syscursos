import { beforeEach, describe, expect, it, vi } from "vitest";

const updateMock = vi.hoisted(() => vi.fn());
const upsertMock = vi.hoisted(() => vi.fn());
const findCourseMock = vi.hoisted(() => vi.fn());
const findStudentMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    enrollment: {
      updateMany: updateMock,
      upsert: upsertMock,
    },
    course: {
      findFirstOrThrow: findCourseMock,
    },
    studentProfile: {
      findFirstOrThrow: findStudentMock,
    },
  },
}));

describe("admin repository", () => {
  beforeEach(() => {
    updateMock.mockReset();
    upsertMock.mockReset();
    findCourseMock.mockReset();
    findStudentMock.mockReset();
    findCourseMock.mockResolvedValue({ id: "course-id" });
    findStudentMock.mockResolvedValue({ id: "student-id" });
  });

  it("updates an enrollment by id when editing an existing record", async () => {
    const { upsertEnrollment } = await import("@/server/repositories/admin-repository");
    const input = {
      id: "4f0896e4-3eb5-45de-8d8f-8d0601f6946b",
      studentId: "2b8d0d2c-d34e-4a6b-94e1-2cf03e39a633",
      courseId: "8f0896e4-3eb5-45de-8d8f-8d0601f6946b",
      startsAt: new Date("2026-05-04T00:00:00.000Z"),
      expiresAt: null,
      status: "CANCELED" as const,
    };

    updateMock.mockResolvedValue({ count: 1 });

    await upsertEnrollment("org-id", "admin-id", "ADMIN", input);

    expect(updateMock).toHaveBeenCalledWith({
      where: { id: input.id, course: { organizationId: "org-id" } },
      data: {
        studentId: input.studentId,
        courseId: input.courseId,
        startsAt: input.startsAt,
        expiresAt: input.expiresAt,
        status: input.status,
      },
    });
    expect(upsertMock).not.toHaveBeenCalled();
  });
});
