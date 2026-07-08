import { beforeEach, describe, expect, it, vi } from "vitest";

const updateManyMock = vi.hoisted(() => vi.fn());
const enrollmentUpsertMock = vi.hoisted(() => vi.fn());
const findCourseMock = vi.hoisted(() => vi.fn());
const findStudentOrThrowMock = vi.hoisted(() => vi.fn());
const findStudentFirstMock = vi.hoisted(() => vi.fn());
const producerStudentUpsertMock = vi.hoisted(() => vi.fn());
const producerStudentFindUniqueMock = vi.hoisted(() => vi.fn());
const producerStudentCreateMock = vi.hoisted(() => vi.fn());
const producerStudentDeleteManyMock = vi.hoisted(() => vi.fn());
const userCreateMock = vi.hoisted(() => vi.fn());
const listUsersMock = vi.hoisted(() => vi.fn());
const updateUserByIdMock = vi.hoisted(() => vi.fn());
const createUserMock = vi.hoisted(() => vi.fn());
const moduleFindFirstOrThrowMock = vi.hoisted(() => vi.fn());
const moduleCountMock = vi.hoisted(() => vi.fn());
const moduleFindManyMock = vi.hoisted(() => vi.fn());
const moduleUpdateMock = vi.hoisted(() => vi.fn());
const moduleCreateMock = vi.hoisted(() => vi.fn());
const lessonFindFirstOrThrowMock = vi.hoisted(() => vi.fn());
const lessonCountMock = vi.hoisted(() => vi.fn());
const lessonFindManyMock = vi.hoisted(() => vi.fn());
const lessonUpdateMock = vi.hoisted(() => vi.fn());
const lessonCreateMock = vi.hoisted(() => vi.fn());
const lessonMaterialFindFirstOrThrowMock = vi.hoisted(() => vi.fn());
const lessonMaterialCountMock = vi.hoisted(() => vi.fn());
const lessonMaterialFindManyMock = vi.hoisted(() => vi.fn());
const lessonMaterialUpdateMock = vi.hoisted(() => vi.fn());
const lessonMaterialCreateMock = vi.hoisted(() => vi.fn());
const transactionMock = vi.hoisted(() => vi.fn());

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
      create: producerStudentCreateMock,
      deleteMany: producerStudentDeleteManyMock,
    },
    user: {
      create: userCreateMock,
    },
    module: {
      findFirstOrThrow: moduleFindFirstOrThrowMock,
      count: moduleCountMock,
      findMany: moduleFindManyMock,
      update: moduleUpdateMock,
      create: moduleCreateMock,
    },
    lesson: {
      findFirstOrThrow: lessonFindFirstOrThrowMock,
      count: lessonCountMock,
      findMany: lessonFindManyMock,
      update: lessonUpdateMock,
      create: lessonCreateMock,
    },
    lessonMaterial: {
      findFirstOrThrow: lessonMaterialFindFirstOrThrowMock,
      count: lessonMaterialCountMock,
      findMany: lessonMaterialFindManyMock,
      update: lessonMaterialUpdateMock,
      create: lessonMaterialCreateMock,
    },
    $transaction: transactionMock,
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

import { prisma } from "@/lib/db/prisma";

describe("admin repository", () => {
  beforeEach(() => {
    updateManyMock.mockReset();
    enrollmentUpsertMock.mockReset();
    findCourseMock.mockReset();
    findStudentOrThrowMock.mockReset();
    findStudentFirstMock.mockReset();
    producerStudentUpsertMock.mockReset();
    producerStudentFindUniqueMock.mockReset();
    producerStudentCreateMock.mockReset();
    producerStudentDeleteManyMock.mockReset();
    userCreateMock.mockReset();
    listUsersMock.mockReset();
    updateUserByIdMock.mockReset();
    createUserMock.mockReset();
    moduleFindFirstOrThrowMock.mockReset();
    moduleCountMock.mockReset();
    moduleFindManyMock.mockReset();
    moduleUpdateMock.mockReset();
    moduleCreateMock.mockReset();
    lessonFindFirstOrThrowMock.mockReset();
    lessonCountMock.mockReset();
    lessonFindManyMock.mockReset();
    lessonUpdateMock.mockReset();
    lessonCreateMock.mockReset();
    lessonMaterialFindFirstOrThrowMock.mockReset();
    lessonMaterialCountMock.mockReset();
    lessonMaterialFindManyMock.mockReset();
    lessonMaterialUpdateMock.mockReset();
    lessonMaterialCreateMock.mockReset();
    transactionMock.mockReset();

    findCourseMock.mockResolvedValue({ id: "course-id" });
    findStudentOrThrowMock.mockResolvedValue({ id: "student-id" });
    listUsersMock.mockResolvedValue({ data: { users: [] }, error: null });
    updateUserByIdMock.mockResolvedValue({ data: { user: { id: "auth-user-id" } }, error: null });
    createUserMock.mockResolvedValue({ data: { user: { id: "auth-user-id" } }, error: null });
    producerStudentFindUniqueMock.mockResolvedValue(null);
    producerStudentCreateMock.mockResolvedValue({ id: "producer-link-id" });
    producerStudentDeleteManyMock.mockResolvedValue({ count: 1 });
    moduleFindManyMock.mockResolvedValue([]);
    lessonFindManyMock.mockResolvedValue([]);
    lessonMaterialFindManyMock.mockResolvedValue([]);
    transactionMock.mockImplementation(async (callback: (tx: typeof prisma) => unknown) => callback(prisma));
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

  it("looks up an existing student by e-mail for producer flow", async () => {
    const { findStudentByEmailForProducer } = await import("@/server/repositories/admin-repository");
    findStudentFirstMock.mockResolvedValueOnce({
      id: "student-profile-id",
      document: null,
      phone: null,
      user: {
        id: "student-user-id",
        email: "student@example.com",
        name: "Student",
        status: "ACTIVE",
      },
      producers: [],
    });

    await expect(
      findStudentByEmailForProducer("org-id", "producer-id", "PRODUCER", "student@example.com"),
    ).resolves.toMatchObject({
      studentProfileId: "student-profile-id",
      userId: "student-user-id",
      email: "student@example.com",
      name: "Student",
      alreadyLinked: false,
    });
  });
});

describe("upsertModule position reordering", () => {
  const baseInput = {
    id: "module-being-edited",
    courseId: "course-id",
    title: "Modulo",
    description: null,
    status: "ACTIVE" as const,
  };

  beforeEach(() => {
    moduleFindFirstOrThrowMock.mockReset();
    moduleCountMock.mockReset();
    moduleFindManyMock.mockReset();
    moduleUpdateMock.mockReset();
    moduleCreateMock.mockReset();
    transactionMock.mockReset();
    moduleFindManyMock.mockResolvedValue([]);
    transactionMock.mockImplementation(async (callback: (tx: typeof prisma) => unknown) => callback(prisma));
  });

  it("moving a module to an earlier position shifts the in-between siblings forward", async () => {
    const { upsertModule } = await import("@/server/repositories/admin-repository");

    moduleFindFirstOrThrowMock.mockResolvedValue({ position: 5, courseId: "course-id" });
    moduleCountMock.mockResolvedValue(5);
    moduleFindManyMock.mockResolvedValue([
      { id: "module-1", position: 1 },
      { id: "module-2", position: 2 },
      { id: "module-3", position: 3 },
      { id: "module-4", position: 4 },
    ]);

    await upsertModule("org-id", "admin-id", "ADMIN", { ...baseInput, position: 1 });

    expect(moduleFindFirstOrThrowMock).toHaveBeenCalledWith({
      where: { id: "module-being-edited", course: { organizationId: "org-id" } },
      select: { position: true, courseId: true },
    });
    expect(moduleCountMock).toHaveBeenCalledWith({ where: { courseId: "course-id" } });
    expect(moduleFindManyMock).toHaveBeenCalledWith({
      where: {
        courseId: "course-id",
        id: { not: "module-being-edited" },
        position: { gte: 1, lt: 5 },
      },
      select: { id: true, position: true },
    });

    expect(moduleUpdateMock.mock.calls).toEqual([
      [{ where: { id: "module-1" }, data: { position: 1000000000 } }],
      [{ where: { id: "module-2" }, data: { position: 1000000001 } }],
      [{ where: { id: "module-3" }, data: { position: 1000000002 } }],
      [{ where: { id: "module-4" }, data: { position: 1000000003 } }],
      [{ where: { id: "module-being-edited" }, data: { position: 1000000004 } }],
      [{ where: { id: "module-1" }, data: { position: 2 } }],
      [{ where: { id: "module-2" }, data: { position: 3 } }],
      [{ where: { id: "module-3" }, data: { position: 4 } }],
      [{ where: { id: "module-4" }, data: { position: 5 } }],
      [{ where: { id: "module-being-edited" }, data: { position: 1 } }],
      [
        {
          where: { id: "module-being-edited" },
          data: { title: "Modulo", description: null, position: 1, status: "ACTIVE" },
        },
      ],
    ]);
  });

  it("moving a module to a position beyond the total clamps it to the last position", async () => {
    const { upsertModule } = await import("@/server/repositories/admin-repository");

    moduleFindFirstOrThrowMock.mockResolvedValue({ position: 3, courseId: "course-id" });
    moduleCountMock.mockResolvedValue(4);
    moduleFindManyMock.mockResolvedValue([{ id: "module-4", position: 4 }]);

    await upsertModule("org-id", "admin-id", "ADMIN", { ...baseInput, position: 99 });

    expect(moduleFindManyMock).toHaveBeenCalledWith({
      where: {
        courseId: "course-id",
        id: { not: "module-being-edited" },
        position: { gt: 3, lte: 4 },
      },
      select: { id: true, position: true },
    });

    expect(moduleUpdateMock.mock.calls).toEqual([
      [{ where: { id: "module-4" }, data: { position: 1000000000 } }],
      [{ where: { id: "module-being-edited" }, data: { position: 1000000001 } }],
      [{ where: { id: "module-4" }, data: { position: 3 } }],
      [{ where: { id: "module-being-edited" }, data: { position: 4 } }],
      [
        {
          where: { id: "module-being-edited" },
          data: { title: "Modulo", description: null, position: 4, status: "ACTIVE" },
        },
      ],
    ]);
  });

  it("does not shift any sibling when the position does not change", async () => {
    const { upsertModule } = await import("@/server/repositories/admin-repository");

    moduleFindFirstOrThrowMock.mockResolvedValue({ position: 2, courseId: "course-id" });
    moduleCountMock.mockResolvedValue(5);

    await upsertModule("org-id", "admin-id", "ADMIN", { ...baseInput, position: 2 });

    expect(moduleFindManyMock).not.toHaveBeenCalled();
    expect(moduleUpdateMock).toHaveBeenCalledTimes(1);
    expect(moduleUpdateMock).toHaveBeenCalledWith({
      where: { id: "module-being-edited" },
      data: { title: "Modulo", description: null, position: 2, status: "ACTIVE" },
    });
  });

  it("throws when editing a module that does not exist or is out of scope", async () => {
    const { upsertModule } = await import("@/server/repositories/admin-repository");

    moduleFindFirstOrThrowMock.mockRejectedValue(new Error("not found"));

    await expect(upsertModule("org-id", "admin-id", "ADMIN", { ...baseInput, position: 1 })).rejects.toThrow(
      "not found",
    );
    expect(moduleUpdateMock).not.toHaveBeenCalled();
  });

  it("creating a module in the middle of the list shifts the following siblings forward", async () => {
    const { upsertModule } = await import("@/server/repositories/admin-repository");

    findCourseMock.mockResolvedValue({ id: "course-id" });
    moduleCountMock.mockResolvedValue(3);
    moduleFindManyMock.mockResolvedValue([
      { id: "module-2", position: 2 },
      { id: "module-3", position: 3 },
    ]);
    moduleCreateMock.mockResolvedValue({ id: "new-module-id" });

    await upsertModule("org-id", "admin-id", "ADMIN", {
      courseId: "course-id",
      title: "Novo modulo",
      description: null,
      position: 2,
      status: "ACTIVE" as const,
    });

    expect(moduleCountMock).toHaveBeenCalledWith({ where: { courseId: "course-id" } });
    expect(moduleFindManyMock).toHaveBeenCalledWith({
      where: { courseId: "course-id", position: { gte: 2 } },
      select: { id: true, position: true },
    });
    expect(moduleUpdateMock.mock.calls).toEqual([
      [{ where: { id: "module-2" }, data: { position: 1000000000 } }],
      [{ where: { id: "module-3" }, data: { position: 1000000001 } }],
      [{ where: { id: "module-2" }, data: { position: 3 } }],
      [{ where: { id: "module-3" }, data: { position: 4 } }],
    ]);
    expect(moduleCreateMock).toHaveBeenCalledWith({
      data: {
        courseId: "course-id",
        title: "Novo modulo",
        description: null,
        position: 2,
        status: "ACTIVE",
      },
    });
  });
});

describe("upsertLesson position reordering", () => {
  const youtubeUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

  const baseInput = {
    id: "lesson-being-edited",
    moduleId: "module-id",
    title: "Aula",
    description: null,
    youtubeUrl,
    youtubeVideoId: null,
    coverImageUrl: null,
    status: "ACTIVE" as const,
  };

  beforeEach(() => {
    lessonFindFirstOrThrowMock.mockReset();
    lessonCountMock.mockReset();
    lessonFindManyMock.mockReset();
    lessonUpdateMock.mockReset();
    lessonCreateMock.mockReset();
    moduleFindFirstOrThrowMock.mockReset();
    transactionMock.mockReset();
    lessonFindManyMock.mockResolvedValue([]);
    transactionMock.mockImplementation(async (callback: (tx: typeof prisma) => unknown) => callback(prisma));
  });

  it("moving a lesson to an earlier position shifts the in-between siblings forward", async () => {
    const { upsertLesson } = await import("@/server/repositories/admin-repository");
    const { extractYouTubeVideoId } = await import("@/server/services/video-platform-service");
    const expectedVideoId = extractYouTubeVideoId(youtubeUrl);

    lessonFindFirstOrThrowMock.mockResolvedValue({ position: 3, moduleId: "module-id" });
    lessonCountMock.mockResolvedValue(3);
    lessonFindManyMock.mockResolvedValue([{ id: "lesson-1", position: 1 }, { id: "lesson-2", position: 2 }]);

    await upsertLesson("org-id", "admin-id", "ADMIN", { ...baseInput, position: 1 });

    expect(lessonFindFirstOrThrowMock).toHaveBeenCalledWith({
      where: { id: "lesson-being-edited", module: { course: { organizationId: "org-id" } } },
      select: { position: true, moduleId: true },
    });
    expect(lessonFindManyMock).toHaveBeenCalledWith({
      where: {
        moduleId: "module-id",
        id: { not: "lesson-being-edited" },
        position: { gte: 1, lt: 3 },
      },
      select: { id: true, position: true },
    });
    expect(lessonUpdateMock.mock.calls).toEqual([
      [{ where: { id: "lesson-1" }, data: { position: 1000000000 } }],
      [{ where: { id: "lesson-2" }, data: { position: 1000000001 } }],
      [{ where: { id: "lesson-being-edited" }, data: { position: 1000000002 } }],
      [{ where: { id: "lesson-1" }, data: { position: 2 } }],
      [{ where: { id: "lesson-2" }, data: { position: 3 } }],
      [{ where: { id: "lesson-being-edited" }, data: { position: 1 } }],
      [
        {
          where: { id: "lesson-being-edited" },
          data: {
            title: "Aula",
            description: null,
            youtubeUrl,
            youtubeVideoId: expectedVideoId,
            coverImageUrl: null,
            position: 1,
            status: "ACTIVE",
          },
        },
      ],
    ]);
  });

  it("moving a lesson to a position beyond the total clamps it to the last position", async () => {
    const { upsertLesson } = await import("@/server/repositories/admin-repository");

    lessonFindFirstOrThrowMock.mockResolvedValue({ position: 1, moduleId: "module-id" });
    lessonCountMock.mockResolvedValue(2);
    lessonFindManyMock.mockResolvedValue([{ id: "lesson-2", position: 2 }]);

    await upsertLesson("org-id", "admin-id", "ADMIN", { ...baseInput, position: 50 });

    expect(lessonFindManyMock).toHaveBeenCalledWith({
      where: {
        moduleId: "module-id",
        id: { not: "lesson-being-edited" },
        position: { gt: 1, lte: 2 },
      },
      select: { id: true, position: true },
    });
    expect(lessonUpdateMock.mock.calls).toEqual([
      [{ where: { id: "lesson-2" }, data: { position: 1000000000 } }],
      [{ where: { id: "lesson-being-edited" }, data: { position: 1000000001 } }],
      [{ where: { id: "lesson-2" }, data: { position: 1 } }],
      [{ where: { id: "lesson-being-edited" }, data: { position: 2 } }],
      [
        {
          where: { id: "lesson-being-edited" },
          data: {
            title: "Aula",
            description: null,
            youtubeUrl,
            youtubeVideoId: expect.anything(),
            coverImageUrl: null,
            position: 2,
            status: "ACTIVE",
          },
        },
      ],
    ]);
  });

  it("creating a lesson in the middle of the list shifts the following siblings forward", async () => {
    const { upsertLesson } = await import("@/server/repositories/admin-repository");

    lessonCountMock.mockResolvedValue(2);
    lessonFindManyMock.mockResolvedValue([{ id: "lesson-1", position: 1 }]);
    lessonCreateMock.mockResolvedValue({ id: "new-lesson-id" });

    // Module lookup for the create path re-uses the `module` delegate, already mocked in Task 1.
    moduleFindFirstOrThrowMock.mockResolvedValue({ id: "module-id" });

    await upsertLesson("org-id", "admin-id", "ADMIN", {
      moduleId: "module-id",
      title: "Nova aula",
      description: null,
      youtubeUrl,
      youtubeVideoId: null,
      coverImageUrl: null,
      position: 1,
      status: "ACTIVE" as const,
    });

    expect(moduleFindFirstOrThrowMock).toHaveBeenCalledWith({
      where: { id: "module-id", course: { organizationId: "org-id" } },
      select: { id: true },
    });
    expect(lessonFindManyMock).toHaveBeenCalledWith({
      where: { moduleId: "module-id", position: { gte: 1 } },
      select: { id: true, position: true },
    });
    expect(lessonUpdateMock.mock.calls).toEqual([
      [{ where: { id: "lesson-1" }, data: { position: 1000000000 } }],
      [{ where: { id: "lesson-1" }, data: { position: 2 } }],
    ]);
    expect(lessonCreateMock).toHaveBeenCalledWith({
      data: {
        moduleId: "module-id",
        title: "Nova aula",
        description: null,
        youtubeUrl,
        youtubeVideoId: expect.anything(),
        coverImageUrl: null,
        position: 1,
        status: "ACTIVE",
      },
    });
  });

  it("throws when editing a lesson that does not exist or is out of scope", async () => {
    const { upsertLesson } = await import("@/server/repositories/admin-repository");

    lessonFindFirstOrThrowMock.mockRejectedValue(new Error("not found"));

    await expect(
      upsertLesson("org-id", "admin-id", "ADMIN", { ...baseInput, position: 1 }),
    ).rejects.toThrow("not found");
    expect(lessonUpdateMock).not.toHaveBeenCalled();
  });
});

describe("upsertLessonMaterial position reordering", () => {
  const baseInput = {
    id: "material-being-edited",
    lessonId: "lesson-id",
    type: "PDF" as const,
    title: "Material",
    url: "https://example.com/material.pdf",
    status: "ACTIVE" as const,
  };

  beforeEach(() => {
    lessonMaterialFindFirstOrThrowMock.mockReset();
    lessonMaterialCountMock.mockReset();
    lessonMaterialFindManyMock.mockReset();
    lessonMaterialUpdateMock.mockReset();
    lessonMaterialCreateMock.mockReset();
    lessonFindFirstOrThrowMock.mockReset();
    transactionMock.mockReset();
    lessonMaterialFindManyMock.mockResolvedValue([]);
    transactionMock.mockImplementation(async (callback: (tx: typeof prisma) => unknown) => callback(prisma));
  });

  it("moving a material to an earlier position shifts the in-between siblings forward", async () => {
    const { upsertLessonMaterial } = await import("@/server/repositories/admin-repository");

    lessonMaterialFindFirstOrThrowMock.mockResolvedValue({ position: 3, lessonId: "lesson-id" });
    lessonMaterialCountMock.mockResolvedValue(3);
    lessonMaterialFindManyMock.mockResolvedValue([
      { id: "material-1", position: 1 },
      { id: "material-2", position: 2 },
    ]);

    await upsertLessonMaterial("org-id", "admin-id", "ADMIN", { ...baseInput, position: 1 });

    expect(lessonMaterialFindFirstOrThrowMock).toHaveBeenCalledWith({
      where: { id: "material-being-edited", lesson: { module: { course: { organizationId: "org-id" } } } },
      select: { position: true, lessonId: true },
    });
    expect(lessonMaterialFindManyMock).toHaveBeenCalledWith({
      where: {
        lessonId: "lesson-id",
        id: { not: "material-being-edited" },
        position: { gte: 1, lt: 3 },
      },
      select: { id: true, position: true },
    });
    expect(lessonMaterialUpdateMock.mock.calls).toEqual([
      [{ where: { id: "material-1" }, data: { position: 1000000000 } }],
      [{ where: { id: "material-2" }, data: { position: 1000000001 } }],
      [{ where: { id: "material-being-edited" }, data: { position: 1000000002 } }],
      [{ where: { id: "material-1" }, data: { position: 2 } }],
      [{ where: { id: "material-2" }, data: { position: 3 } }],
      [{ where: { id: "material-being-edited" }, data: { position: 1 } }],
      [
        {
          where: { id: "material-being-edited" },
          data: {
            type: "PDF",
            title: "Material",
            url: "https://example.com/material.pdf",
            position: 1,
            status: "ACTIVE",
          },
        },
      ],
    ]);
  });

  it("creating a material in the middle of the list shifts the following siblings forward", async () => {
    const { upsertLessonMaterial } = await import("@/server/repositories/admin-repository");

    lessonFindFirstOrThrowMock.mockResolvedValue({ id: "lesson-id" });
    lessonMaterialCountMock.mockResolvedValue(1);
    lessonMaterialFindManyMock.mockResolvedValue([{ id: "material-1", position: 1 }]);
    lessonMaterialCreateMock.mockResolvedValue({ id: "new-material-id" });

    await upsertLessonMaterial("org-id", "admin-id", "ADMIN", {
      lessonId: "lesson-id",
      type: "LINK" as const,
      title: "Novo material",
      url: "https://example.com/novo",
      position: 1,
      status: "ACTIVE" as const,
    });

    expect(lessonFindFirstOrThrowMock).toHaveBeenCalledWith({
      where: { id: "lesson-id", module: { course: { organizationId: "org-id" } } },
      select: { id: true },
    });
    expect(lessonMaterialFindManyMock).toHaveBeenCalledWith({
      where: { lessonId: "lesson-id", position: { gte: 1 } },
      select: { id: true, position: true },
    });
    expect(lessonMaterialUpdateMock.mock.calls).toEqual([
      [{ where: { id: "material-1" }, data: { position: 1000000000 } }],
      [{ where: { id: "material-1" }, data: { position: 2 } }],
    ]);
    expect(lessonMaterialCreateMock).toHaveBeenCalledWith({
      data: {
        lessonId: "lesson-id",
        type: "LINK",
        title: "Novo material",
        url: "https://example.com/novo",
        position: 1,
        status: "ACTIVE",
      },
    });
  });

  it("throws when editing a material that does not exist or is out of scope", async () => {
    const { upsertLessonMaterial } = await import("@/server/repositories/admin-repository");

    lessonMaterialFindFirstOrThrowMock.mockRejectedValue(new Error("not found"));

    await expect(
      upsertLessonMaterial("org-id", "admin-id", "ADMIN", { ...baseInput, position: 1 }),
    ).rejects.toThrow("not found");
    expect(lessonMaterialUpdateMock).not.toHaveBeenCalled();
  });
});
