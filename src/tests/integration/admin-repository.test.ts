import { beforeEach, describe, expect, it, vi } from "vitest";

const updateManyMock = vi.hoisted(() => vi.fn());
const enrollmentUpsertMock = vi.hoisted(() => vi.fn());
const findCourseMock = vi.hoisted(() => vi.fn());
const findStudentOrThrowMock = vi.hoisted(() => vi.fn());
const findStudentFirstMock = vi.hoisted(() => vi.fn());
const producerStudentUpsertMock = vi.hoisted(() => vi.fn());
const producerStudentFindUniqueMock = vi.hoisted(() => vi.fn());
const userCreateMock = vi.hoisted(() => vi.fn());
const listUsersMock = vi.hoisted(() => vi.fn());
const updateUserByIdMock = vi.hoisted(() => vi.fn());
const createUserMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    enrollment: {
      updateMany: updateManyMock,
      upsert: enrollmentUpsertMock,
    },
    course: {
      findFirstOrThrow: findCourseMock,
    },
    studentProfile: {
      findFirst: findStudentFirstMock,
      findFirstOrThrow: findStudentOrThrowMock,
    },
    producerStudent: {
      upsert: producerStudentUpsertMock,
      findUnique: producerStudentFindUniqueMock,
    },
    user: {
      create: userCreateMock,
    },
  },
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({
    auth: {
      admin: {
        listUsers: listUsersMock,
        updateUserById: updateUserByIdMock,
        createUser: createUserMock,
      },
    },
  }),
}));

describe("admin repository", () => {
  beforeEach(() => {
    updateManyMock.mockReset();
    enrollmentUpsertMock.mockReset();
    findCourseMock.mockReset();
    findStudentOrThrowMock.mockReset();
    findStudentFirstMock.mockReset();
    producerStudentUpsertMock.mockReset();
    producerStudentFindUniqueMock.mockReset();
    userCreateMock.mockReset();
    listUsersMock.mockReset();
    updateUserByIdMock.mockReset();
    createUserMock.mockReset();

    findCourseMock.mockResolvedValue({ id: "course-id" });
    findStudentOrThrowMock.mockResolvedValue({ id: "student-id" });
    listUsersMock.mockResolvedValue({ data: { users: [] }, error: null });
    updateUserByIdMock.mockResolvedValue({ data: { user: { id: "auth-user-id" } }, error: null });
    createUserMock.mockResolvedValue({ data: { user: { id: "auth-user-id" } }, error: null });
    producerStudentFindUniqueMock.mockResolvedValue(null);
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

    updateManyMock.mockResolvedValue({ count: 1 });

    await upsertEnrollment("org-id", "admin-id", "ADMIN", input);

    expect(updateManyMock).toHaveBeenCalledWith({
      where: { id: input.id, course: { organizationId: "org-id" } },
      data: {
        studentId: input.studentId,
        courseId: input.courseId,
        startsAt: input.startsAt,
        expiresAt: input.expiresAt,
        status: input.status,
      },
    });
    expect(enrollmentUpsertMock).not.toHaveBeenCalled();
  });

  it("links an existing student when the auth account already belongs to a student in the same organization", async () => {
    const { upsertStudent } = await import("@/server/repositories/admin-repository");
    const input = {
      email: "student@example.com",
      name: "Student",
      password: "password123",
      document: null,
      phone: null,
      status: "ACTIVE" as const,
    };

    findStudentFirstMock
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "existing-student-profile-id" });

    listUsersMock.mockResolvedValue({
      data: {
        users: [{ id: "auth-user-id", email: "student@example.com" }],
      },
      error: null,
    });

    await expect(upsertStudent("org-id", "producer-id", "PRODUCER", input)).resolves.toEqual({
      linkedExisting: true,
    });

    expect(findStudentFirstMock).toHaveBeenNthCalledWith(1, {
      where: {
        user: {
          organizationId: "org-id",
          role: "STUDENT",
          OR: [{ email: "student@example.com" }],
        },
      },
      include: { user: true },
    });
    expect(findStudentFirstMock).toHaveBeenNthCalledWith(2, {
      where: {
        user: {
          organizationId: "org-id",
          role: "STUDENT",
          authUserId: "auth-user-id",
        },
      },
      select: { id: true },
    });
    expect(producerStudentUpsertMock).toHaveBeenCalledWith({
      where: {
        producerId_studentId: {
          producerId: "producer-id",
          studentId: "existing-student-profile-id",
        },
      },
      update: {},
      create: {
        producerId: "producer-id",
        studentId: "existing-student-profile-id",
      },
    });
    expect(userCreateMock).not.toHaveBeenCalled();
    expect(createUserMock).not.toHaveBeenCalled();
  });
});
