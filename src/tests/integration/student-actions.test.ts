import { beforeEach, describe, expect, it, vi } from "vitest";

const redirectMock = vi.hoisted(() =>
  vi.fn((url: string): never => {
    const error = new Error(`REDIRECT:${url}`) as Error & { digest: string };
    error.digest = `NEXT_REDIRECT;${url}`;
    throw error;
  }),
);
const revalidatePathMock = vi.hoisted(() => vi.fn());
const revalidateTagMock = vi.hoisted(() => vi.fn());
const toggleLessonCompletionMock = vi.hoisted(() => vi.fn());
const updateOwnStudentProfileMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
  revalidateTag: revalidateTagMock,
}));

vi.mock("@/server/services/student-service", () => ({
  toggleLessonCompletion: toggleLessonCompletionMock,
  saveLessonNote: vi.fn(),
  updateOwnStudentProfile: updateOwnStudentProfileMock,
}));

describe("completeLessonAction", () => {
  beforeEach(() => {
    redirectMock.mockClear();
    revalidatePathMock.mockClear();
    toggleLessonCompletionMock.mockClear();
  });

  it("marks the lesson as completed and returns the result without redirecting", async () => {
    const { completeLessonAction } = await import("@/server/actions/student-actions");
    toggleLessonCompletionMock.mockResolvedValue({ status: "COMPLETED" });

    const result = await completeLessonAction({
      courseId: "11111111-1111-1111-1111-111111111111",
      lessonId: "22222222-2222-2222-2222-222222222222",
      isCompleted: true,
    });

    expect(result).toEqual({ ok: true, isCompleted: true });
    expect(toggleLessonCompletionMock).toHaveBeenCalledWith(
      { courseId: "11111111-1111-1111-1111-111111111111", lessonId: "22222222-2222-2222-2222-222222222222" },
      true,
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/app/courses/11111111-1111-1111-1111-111111111111");
    expect(revalidatePathMock).toHaveBeenCalledWith(
      "/app/courses/11111111-1111-1111-1111-111111111111/lessons/22222222-2222-2222-2222-222222222222",
    );
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("returns a validation error for an invalid lesson id without redirecting", async () => {
    const { completeLessonAction } = await import("@/server/actions/student-actions");

    const result = await completeLessonAction({
      courseId: "11111111-1111-1111-1111-111111111111",
      lessonId: "invalid",
      isCompleted: true,
    });

    expect(result).toEqual({ ok: false, message: "Entrada de progresso invalida." });
    expect(toggleLessonCompletionMock).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
  });
});

describe("saveOwnStudentProfileAction", () => {
  beforeEach(() => {
    redirectMock.mockClear();
    revalidatePathMock.mockClear();
    revalidateTagMock.mockClear();
    updateOwnStudentProfileMock.mockReset();
    updateOwnStudentProfileMock.mockResolvedValue(undefined);
  });

  it("invalidates the cached authenticated user after a profile change", async () => {
    const { saveOwnStudentProfileAction } = await import("@/server/actions/student-actions");
    const formData = new FormData();
    formData.set("name", "Nome Atualizado");
    formData.set("phone", "");
    formData.set("password", "");
    formData.set("confirmPassword", "");

    await expect(saveOwnStudentProfileAction(formData)).rejects.toThrow("REDIRECT:/app/me?status=saved");

    expect(revalidateTagMock).toHaveBeenCalledWith("app-user");
  });
});
