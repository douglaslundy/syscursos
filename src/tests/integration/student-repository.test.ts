import { beforeEach, describe, expect, it, vi } from "vitest";

const findManyMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    enrollment: {
      findMany: findManyMock,
    },
  },
}));

describe("student repository", () => {
  beforeEach(() => {
    findManyMock.mockReset();
  });

  it("lists notebook course options only for active, started and non-expired enrollments", async () => {
    const { listNotebookCourseOptions } = await import("@/server/repositories/student-repository");
    findManyMock.mockResolvedValue([]);

    await listNotebookCourseOptions("student-id");

    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          studentId: "student-id",
          status: "ACTIVE",
          startsAt: expect.objectContaining({ lte: expect.any(Date) }),
          OR: [{ expiresAt: null }, { expiresAt: { gt: expect.any(Date) } }],
          course: {
            status: "ACTIVE",
          },
        }),
      }),
    );
  });
});
