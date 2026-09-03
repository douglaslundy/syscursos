import { beforeEach, describe, expect, it, vi } from "vitest";

const redirectMock = vi.hoisted(() =>
  vi.fn((url: string): never => {
    throw new Error(`REDIRECT:${url}`);
  }),
);
const notFoundMock = vi.hoisted(() =>
  vi.fn((): never => {
    throw new Error("NOT_FOUND");
  }),
);
const requireAnyRoleMock = vi.hoisted(() => vi.fn());
const repositoryMock = vi.hoisted(() => ({
  listStudentCourseEnrollments: vi.fn(),
  countActiveLessonsByCourse: vi.fn(),
  countCompletedLessonsByCourse: vi.fn(),
  countActiveLessonsForCourses: vi.fn(),
  countCompletedLessonsForCourses: vi.fn(),
  findEnrollmentForCourse: vi.fn(),
  getCourseWithActiveContent: vi.fn(),
  getCompletedLessonIds: vi.fn(),
  findMostRecentLessonProgress: vi.fn(),
  findMostRecentLessonProgressForCourse: vi.fn(),
  getActiveLessonForStudent: vi.fn(),
  listActiveLessonMaterials: vi.fn(),
  findLessonProgress: vi.fn(),
  touchLessonProgress: vi.fn(),
  findLessonNote: vi.fn(),
  toggleLessonCompleted: vi.fn(),
  upsertLessonNote: vi.fn(),
  listNotebookCourseOptions: vi.fn(),
  listNotebookNotes: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
  notFound: notFoundMock,
}));

vi.mock("@/server/auth/guards", () => ({
  requireAnyRole: requireAnyRoleMock,
}));

vi.mock("@/server/repositories/student-repository", () => repositoryMock);

vi.mock("@/server/cache/course-content", () => ({
  getCachedCourseContent: (courseId: string) => repositoryMock.getCourseWithActiveContent(courseId),
  revalidateCourseContent: vi.fn(),
}));

describe("student service", () => {
  beforeEach(() => {
    vi.setSystemTime(new Date("2026-05-04T12:00:00.000Z"));
    redirectMock.mockClear();
    notFoundMock.mockClear();
    requireAnyRoleMock.mockReset();
    requireAnyRoleMock.mockResolvedValue({
      id: "user-student",
      role: "STUDENT",
      status: "ACTIVE",
      studentProfileId: "student-profile-id",
    });

    for (const mock of Object.values(repositoryMock)) {
      mock.mockReset();
    }
  });

  it("returns active enrolled courses with course progress", async () => {
    const { getStudentDashboard } = await import("@/server/services/student-service");
    repositoryMock.listStudentCourseEnrollments.mockResolvedValue([
      activeEnrollment("course-id", "Curso ativo"),
    ]);
    repositoryMock.countActiveLessonsForCourses.mockResolvedValue(new Map([["course-id", 4]]));
    repositoryMock.countCompletedLessonsForCourses.mockResolvedValue(new Map([["course-id", 2]]));

    const dashboard = await getStudentDashboard();

    expect(dashboard.courses[0]).toMatchObject({
      id: "course-id",
      title: "Curso ativo",
      enrollmentStatus: "AVAILABLE",
      progress: {
        completedLessons: 2,
        totalLessons: 4,
        percentage: 50,
      },
    });
    expect(repositoryMock.countActiveLessonsForCourses).toHaveBeenCalledWith(["course-id"]);
  });

  it("keeps canceled courses visible without marking them available", async () => {
    const { getStudentDashboard } = await import("@/server/services/student-service");
    repositoryMock.listStudentCourseEnrollments.mockResolvedValue([
      {
        ...activeEnrollment("course-id", "Curso cancelado"),
        status: "CANCELED",
      },
    ]);
    repositoryMock.countActiveLessonsForCourses.mockResolvedValue(new Map([["course-id", 4]]));
    repositoryMock.countCompletedLessonsForCourses.mockResolvedValue(new Map([["course-id", 2]]));

    const dashboard = await getStudentDashboard();

    expect(dashboard.courses[0]).toMatchObject({
      id: "course-id",
      enrollmentStatus: "CANCELED",
    });
  });

  it("prioritizes the most recently accessed course for continue learning", async () => {
    const { getStudentDashboard } = await import("@/server/services/student-service");
    repositoryMock.listStudentCourseEnrollments.mockResolvedValue([
      activeEnrollment("new-course-id", "Curso novo"),
      activeEnrollment("old-course-id", "Curso antigo"),
    ]);
    repositoryMock.countActiveLessonsForCourses.mockResolvedValue(
      new Map([
        ["new-course-id", 5],
        ["old-course-id", 4],
      ]),
    );
    repositoryMock.countCompletedLessonsForCourses.mockResolvedValue(
      new Map([
        ["new-course-id", 1],
        ["old-course-id", 2],
      ]),
    );
    repositoryMock.findMostRecentLessonProgress.mockResolvedValue({
      status: "NOT_STARTED",
      updatedAt: new Date("2026-05-04T13:00:00.000Z"),
      completedAt: null,
      lesson: {
        id: "old-lesson-2",
        title: "Aula 2",
        position: 2,
        module: {
          id: "old-module-id",
          title: "Modulo antigo",
          position: 1,
          course: {
            id: "old-course-id",
            title: "Curso antigo",
          },
        },
      },
    });
    repositoryMock.getCourseWithActiveContent.mockResolvedValue({
      id: "old-course-id",
      title: "Curso antigo",
      modules: [
        {
          id: "old-module-id",
          title: "Modulo antigo",
          position: 1,
          lessons: [
            {
              id: "old-lesson-1",
              title: "Aula 1",
              position: 1,
            },
            {
              id: "old-lesson-2",
              title: "Aula 2",
              position: 2,
            },
          ],
        },
      ],
    });
    repositoryMock.getCompletedLessonIds.mockResolvedValue(new Set(["old-lesson-2"]));
    repositoryMock.listActiveLessonMaterials.mockResolvedValue([]);

    const dashboard = await getStudentDashboard();

    expect(dashboard.continueLesson).toMatchObject({
      courseTitle: "Curso antigo",
      lessonTitle: "Aula 2",
      href: "/app/courses/old-course-id/lessons/old-lesson-2",
      mode: "NEXT_LESSON",
    });
  });

  it("blocks an expired course without exposing modules", async () => {
    const { getStudentCourse } = await import("@/server/services/student-service");
    repositoryMock.findEnrollmentForCourse.mockResolvedValue(
      activeEnrollment("course-id", "Curso expirado", new Date("2026-05-01T00:00:00.000Z")),
    );

    await expect(getStudentCourse("course-id")).resolves.toMatchObject({
      status: "EXPIRED",
      modules: [],
      progress: { completedLessons: 0, totalLessons: 0, percentage: 0 },
    });
    expect(repositoryMock.getCourseWithActiveContent).not.toHaveBeenCalled();
  });

  it("uses the most recently touched lesson for the current course card", async () => {
    const { getStudentCourse } = await import("@/server/services/student-service");
    repositoryMock.findEnrollmentForCourse.mockResolvedValue(
      activeEnrollment("course-id", "Curso atual"),
    );
    repositoryMock.getCourseWithActiveContent.mockResolvedValue(activeCourseContent());
    repositoryMock.countActiveLessonsByCourse.mockResolvedValue(3);
    repositoryMock.countCompletedLessonsByCourse.mockResolvedValue(1);
    repositoryMock.getCompletedLessonIds.mockResolvedValue(new Set(["lesson-id"]));
    repositoryMock.findMostRecentLessonProgressForCourse.mockResolvedValue({
      status: "NOT_STARTED",
      updatedAt: new Date("2026-05-04T13:00:00.000Z"),
      completedAt: null,
      lesson: {
        id: "lesson-id",
        title: "Aula",
        position: 1,
        module: {
          id: "module-id",
          title: "Modulo",
          position: 1,
          course: {
            id: "course-id",
            title: "Curso atual",
          },
        },
      },
    });

    const course = await getStudentCourse("course-id");

    expect(course.continueLesson).toMatchObject({
      courseTitle: "Curso atual",
      lessonTitle: "Aula",
      href: "/app/courses/course-id/lessons/lesson-id",
      mode: "NEXT_LESSON",
    });
  });

  it("redirects access to a course without enrollment", async () => {
    const { getStudentCourse } = await import("@/server/services/student-service");
    repositoryMock.findEnrollmentForCourse.mockResolvedValue(null);

    await expect(getStudentCourse("course-id")).rejects.toThrow("REDIRECT:/app/forbidden");
  });

  it("returns lesson progress and existing note for an active lesson", async () => {
    const { getStudentLesson } = await import("@/server/services/student-service");
    repositoryMock.findEnrollmentForCourse.mockResolvedValue(
      activeEnrollment("course-id", "Curso"),
    );
    repositoryMock.getActiveLessonForStudent.mockResolvedValue(activeLesson());
    repositoryMock.countActiveLessonsByCourse.mockResolvedValue(3);
    repositoryMock.countCompletedLessonsByCourse.mockResolvedValue(1);
    repositoryMock.findLessonProgress.mockResolvedValue({ status: "COMPLETED" });
    repositoryMock.touchLessonProgress.mockResolvedValue(undefined);
    repositoryMock.findLessonNote.mockResolvedValue({
      id: "note-id",
      content: "Resumo",
      updatedAt: new Date("2026-05-04T12:00:00.000Z"),
    });
    repositoryMock.getCourseWithActiveContent.mockResolvedValue(activeCourseContent());
    repositoryMock.getCompletedLessonIds.mockResolvedValue(new Set(["lesson-id"]));

    const lesson = await getStudentLesson("course-id", "lesson-id");

    expect(lesson).toMatchObject({
      status: "AVAILABLE",
      isCompleted: true,
      note: { content: "Resumo" },
      navigation: {
        previousLesson: null,
        nextLesson: { id: "lesson-2" },
      },
      progress: { completedLessons: 1, totalLessons: 3, percentage: 33 },
    });
    expect(repositoryMock.touchLessonProgress).toHaveBeenCalledWith("student-profile-id", "lesson-id");
  });

  it("skips touching lesson progress when it was updated in the last minute", async () => {
    const { getStudentLesson } = await import("@/server/services/student-service");
    repositoryMock.findEnrollmentForCourse.mockResolvedValue(activeEnrollment("course-id", "Curso"));
    repositoryMock.getActiveLessonForStudent.mockResolvedValue(activeLesson());
    repositoryMock.countActiveLessonsByCourse.mockResolvedValue(3);
    repositoryMock.countCompletedLessonsByCourse.mockResolvedValue(1);
    repositoryMock.findLessonProgress.mockResolvedValue({
      status: "NOT_STARTED",
      updatedAt: new Date("2026-05-04T11:59:30.000Z"),
    });
    repositoryMock.findLessonNote.mockResolvedValue(null);
    repositoryMock.getCourseWithActiveContent.mockResolvedValue(activeCourseContent());
    repositoryMock.getCompletedLessonIds.mockResolvedValue(new Set());
    repositoryMock.listActiveLessonMaterials.mockResolvedValue([]);

    await getStudentLesson("course-id", "lesson-id");

    expect(repositoryMock.touchLessonProgress).not.toHaveBeenCalled();
  });

  it("touches lesson progress when an active lesson is opened without completion", async () => {
    const { getStudentLesson } = await import("@/server/services/student-service");
    repositoryMock.findEnrollmentForCourse.mockResolvedValue(
      activeEnrollment("course-id", "Curso"),
    );
    repositoryMock.getActiveLessonForStudent.mockResolvedValue(activeLesson());
    repositoryMock.countActiveLessonsByCourse.mockResolvedValue(3);
    repositoryMock.countCompletedLessonsByCourse.mockResolvedValue(1);
    repositoryMock.findLessonProgress.mockResolvedValue(null);
    repositoryMock.touchLessonProgress.mockResolvedValue(undefined);
    repositoryMock.findLessonNote.mockResolvedValue(null);
    repositoryMock.getCourseWithActiveContent.mockResolvedValue(activeCourseContent());
    repositoryMock.getCompletedLessonIds.mockResolvedValue(new Set());
    repositoryMock.listActiveLessonMaterials.mockResolvedValue([]);

    await getStudentLesson("course-id", "lesson-id");

    expect(repositoryMock.touchLessonProgress).toHaveBeenCalledWith("student-profile-id", "lesson-id");
  });

  it("marks lesson progress only for active enrolled courses", async () => {
    const { completeLesson } = await import("@/server/services/student-service");
    repositoryMock.findEnrollmentForCourse.mockResolvedValue(
      activeEnrollment("course-id", "Curso"),
    );
    repositoryMock.getActiveLessonForStudent.mockResolvedValue(activeLesson());
    repositoryMock.toggleLessonCompleted.mockResolvedValue({ status: "COMPLETED" });

    await expect(
      completeLesson({
        courseId: "course-id",
        lessonId: "lesson-id",
      }),
    ).resolves.toMatchObject({ status: "COMPLETED" });
    expect(repositoryMock.toggleLessonCompleted).toHaveBeenCalledWith(
      "student-profile-id",
      "lesson-id",
      true,
    );
  });

  it("creates and edits a note with one upsert per student and lesson", async () => {
    const { saveLessonNote } = await import("@/server/services/student-service");
    repositoryMock.findEnrollmentForCourse.mockResolvedValue(
      activeEnrollment("course-id", "Curso"),
    );
    repositoryMock.getActiveLessonForStudent.mockResolvedValue(activeLesson());
    repositoryMock.upsertLessonNote.mockResolvedValue({
      id: "note-id",
      content: "Conteudo atualizado",
    });

    await expect(
      saveLessonNote({
        courseId: "course-id",
        lessonId: "lesson-id",
        content: "Conteudo atualizado",
      }),
    ).resolves.toMatchObject({ id: "note-id", content: "Conteudo atualizado" });
    expect(repositoryMock.upsertLessonNote).toHaveBeenCalledWith(
      "student-profile-id",
      "lesson-id",
      "Conteudo atualizado",
    );
  });

  it("blocks note creation for expired enrollment", async () => {
    const { saveLessonNote } = await import("@/server/services/student-service");
    repositoryMock.findEnrollmentForCourse.mockResolvedValue(
      activeEnrollment("course-id", "Curso", new Date("2026-05-01T00:00:00.000Z")),
    );

    await expect(
      saveLessonNote({
        courseId: "course-id",
        lessonId: "lesson-id",
        content: "Resumo",
      }),
    ).rejects.toThrow("REDIRECT:/app/forbidden");
    expect(repositoryMock.upsertLessonNote).not.toHaveBeenCalled();
  });

  it("builds a notebook grouped by course module and lesson", async () => {
    const { getStudentNotebook } = await import("@/server/services/student-service");
    repositoryMock.listNotebookCourseOptions.mockResolvedValue([
      { course: { id: "course-id", title: "Curso" } },
    ]);
    repositoryMock.findEnrollmentForCourse.mockResolvedValue(
      activeEnrollment("course-id", "Curso"),
    );
    repositoryMock.listNotebookNotes.mockResolvedValue([
      notebookNote("note-2", "module-2", "Modulo 2", 2, "lesson-2", "Aula 2", 1),
      notebookNote("note-1", "module-1", "Modulo 1", 1, "lesson-1", "Aula 1", 1),
    ]);

    const notebook = await getStudentNotebook({ courseId: "course-id", query: "aula" });

    expect(repositoryMock.listNotebookNotes).toHaveBeenCalledWith(
      "student-profile-id",
      "course-id",
      "aula",
    );
    expect(notebook.groups.map((group) => group.moduleTitle)).toEqual(["Modulo 1", "Modulo 2"]);
    expect(notebook.groups[0]?.notes[0]?.lessonTitle).toBe("Aula 1");
  });
});

function activeEnrollment(courseId: string, title: string, expiresAt: Date | null = null) {
  return {
    courseId,
    startsAt: new Date("2026-01-01T00:00:00.000Z"),
    expiresAt,
    status: "ACTIVE",
    course: {
      id: courseId,
      title,
      description: "Descricao",
      status: "ACTIVE",
    },
  };
}

function activeLesson() {
  return {
    id: "lesson-id",
    title: "Aula",
    description: "Descricao",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    youtubeVideoId: null,
    module: {
      id: "module-id",
      title: "Modulo",
      course: {
        title: "Curso",
      },
    },
  };
}

function activeCourseContent() {
  return {
    id: "course-id",
    modules: [
      {
        id: "module-id",
        title: "Modulo",
        position: 1,
        lessons: [
          {
            id: "lesson-id",
            title: "Aula",
            position: 1,
            status: "ACTIVE",
          },
          {
            id: "lesson-2",
            title: "Aula 2",
            position: 2,
            status: "ACTIVE",
          },
        ],
      },
    ],
  };
}

function notebookNote(
  id: string,
  moduleId: string,
  moduleTitle: string,
  modulePosition: number,
  lessonId: string,
  lessonTitle: string,
  lessonPosition: number,
) {
  return {
    id,
    content: `Resumo ${lessonTitle}`,
    updatedAt: new Date("2026-05-04T12:00:00.000Z"),
    lesson: {
      id: lessonId,
      title: lessonTitle,
      position: lessonPosition,
      module: {
        id: moduleId,
        title: moduleTitle,
        position: modulePosition,
      },
    },
  };
}
