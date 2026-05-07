import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { EmptyState } from "@/components/student/empty-state";
import { MarkdownContent } from "@/components/student/markdown-content";
import { NoteAutosaveEditor } from "@/components/student/note-autosave-editor";
import { ProgressBar } from "@/components/student/progress-bar";
import { saveLessonNoteAction } from "@/server/actions/student-actions";

vi.mock("@/server/actions/student-actions", () => ({
  saveLessonNoteAction: vi.fn(),
}));

describe("student UI components", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("renders accessible empty states", () => {
    render(<EmptyState description="Descricao do estado vazio." title="Sem dados" />);

    expect(screen.getByRole("heading", { name: "Sem dados" })).toBeInTheDocument();
    expect(screen.getByText("Descricao do estado vazio.")).toBeInTheDocument();
  });

  it("renders semantic progress information", () => {
    render(<ProgressBar label="Progresso do curso" percentage={67} />);

    expect(screen.getByRole("progressbar", { name: "Progresso do curso" })).toHaveAttribute(
      "aria-valuenow",
      "67",
    );
  });

  it("autosaves notebook notes with debounce", async () => {
    vi.useFakeTimers();
    vi.mocked(saveLessonNoteAction).mockResolvedValue({
      ok: true,
      content: "Conteudo atualizado",
      updatedAt: new Date("2026-05-04T12:00:00.000Z").toISOString(),
    });

    render(
      <NoteAutosaveEditor
        courseId="course-id"
        description="Autosave ativo no caderno."
        initialContent="Conteudo inicial"
        lessonId="lesson-id"
        placeholder="Edite sua anotacao..."
        textareaId="notebook-note"
        title="Anotacao - Aula 1"
      />,
    );

    fireEvent.change(screen.getByLabelText("Anotacao - Aula 1"), {
      target: { value: "Conteudo atualizado" },
    });

    act(() => {
      vi.advanceTimersByTime(899);
    });

    expect(saveLessonNoteAction).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(1);
      await Promise.resolve();
    });

    expect(saveLessonNoteAction).toHaveBeenCalledWith({
      courseId: "course-id",
      lessonId: "lesson-id",
      content: "Conteudo atualizado",
    });
  });

  it("renders markdown notebook content with lesson title heading", () => {
    render(<MarkdownContent content={"# Aula 1\n\nResumo principal da aula."} />);

    expect(screen.getByRole("heading", { name: "Aula 1" })).toBeInTheDocument();
    expect(screen.getByText("Resumo principal da aula.")).toBeInTheDocument();
  });
});
