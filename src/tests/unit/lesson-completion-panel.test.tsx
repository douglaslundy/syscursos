import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LessonCompletionPanel } from "@/components/student/lesson-completion-panel";
import { completeLessonAction } from "@/server/actions/student-actions";

const pushMock = vi.hoisted(() => vi.fn());

vi.mock("@/server/actions/student-actions", () => ({
  completeLessonAction: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

const baseProps = {
  courseId: "course-id",
  lessonId: "lesson-id",
  title: "Aula 1",
  videoEmbed: null,
  completedLessonIds: [],
  currentModuleId: "module-id",
  modules: [],
  progress: { completedLessons: 2, totalLessons: 5, percentage: 40 },
};

describe("LessonCompletionPanel", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("marks the lesson as completed without navigating away and updates progress", async () => {
    vi.mocked(completeLessonAction).mockResolvedValue({ ok: true, isCompleted: true });

    render(<LessonCompletionPanel {...baseProps} initialIsCompleted={false} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Marcar como concluida" }));
      await Promise.resolve();
    });

    expect(completeLessonAction).toHaveBeenCalledWith({
      courseId: "course-id",
      lessonId: "lesson-id",
      isCompleted: true,
    });
    expect(screen.getByRole("button", { name: "Desmarcar aula concluida" })).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "60");
  });

  it("unmarks a completed lesson and updates progress back down", async () => {
    vi.mocked(completeLessonAction).mockResolvedValue({ ok: true, isCompleted: false });

    render(
      <LessonCompletionPanel
        {...baseProps}
        initialIsCompleted={true}
        progress={{ completedLessons: 3, totalLessons: 5, percentage: 60 }}
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Desmarcar aula concluida" }));
      await Promise.resolve();
    });

    expect(completeLessonAction).toHaveBeenCalledWith({
      courseId: "course-id",
      lessonId: "lesson-id",
      isCompleted: false,
    });
    expect(screen.getByRole("button", { name: "Marcar como concluida" })).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "40");
  });

  it("counts down and navigates to the next lesson after completion", async () => {
    vi.useFakeTimers();
    vi.mocked(completeLessonAction).mockResolvedValue({ ok: true, isCompleted: true });

    render(
      <LessonCompletionPanel
        {...baseProps}
        initialIsCompleted={false}
        nextLessonId="lesson-2"
        nextLessonTitle="Aula 2"
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Marcar como concluida" }));
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(screen.getByText(/Aula 2/)).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(pushMock).toHaveBeenCalledWith("/app/courses/course-id/lessons/lesson-2");
  });

  it("lets the student cancel the auto-advance countdown", async () => {
    vi.useFakeTimers();
    vi.mocked(completeLessonAction).mockResolvedValue({ ok: true, isCompleted: true });

    render(
      <LessonCompletionPanel
        {...baseProps}
        initialIsCompleted={false}
        nextLessonId="lesson-2"
        nextLessonTitle="Aula 2"
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Marcar como concluida" }));
      await vi.advanceTimersByTimeAsync(0);
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Cancelar/ }));
    });

    expect(screen.queryByText(/Proxima aula/)).not.toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(pushMock).not.toHaveBeenCalled();
  });

  it("does not start a countdown when there is no next lesson", async () => {
    vi.useFakeTimers();
    vi.mocked(completeLessonAction).mockResolvedValue({ ok: true, isCompleted: true });

    render(<LessonCompletionPanel {...baseProps} initialIsCompleted={false} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Marcar como concluida" }));
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(pushMock).not.toHaveBeenCalled();
  });
});
