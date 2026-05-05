import { beforeEach, describe, expect, it, vi } from "vitest";

const updateMock = vi.hoisted(() => vi.fn());
const upsertMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    enrollment: {
      update: updateMock,
      upsert: upsertMock,
    },
  },
}));

describe("admin repository", () => {
  beforeEach(() => {
    updateMock.mockReset();
    upsertMock.mockReset();
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

    updateMock.mockResolvedValue({ ...input });

    await upsertEnrollment(input);

    expect(updateMock).toHaveBeenCalledWith({
      where: { id: input.id },
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
