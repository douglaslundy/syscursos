import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const actions = vi.hoisted(() => ({
  startCourseQuizAction: vi.fn(),
  startCourseDeckAction: vi.fn(),
  submitCourseQuizAction: vi.fn(),
  refreshCourseQuizAction: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("next/link", () => ({ default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }));
vi.mock("@/server/actions/quiz-actions", () => actions);
vi.mock("@/server/actions/study-actions", () => ({ reviewCardAction: vi.fn() }));

import { CourseQuiz } from "@/components/student/course-quiz";

afterEach(cleanup);

describe("CourseQuiz format", () => {
  it("opens a flip-card deck when the Baralho format is chosen", async () => {
    actions.startCourseDeckAction.mockResolvedValue({
      ok: true,
      cards: [{ courseId: "c1", courseTitle: "Curso", moduleTitle: "Modulo", lessonId: "l1", lessonTitle: "Aula", cardKey: "quiz:k", q: "Pergunta A", a: "Resposta A", isNew: true }],
    });

    render(<CourseQuiz courseId="c1" courseTitle="Curso" questions={5} />);
    fireEvent.click(screen.getByLabelText(/Baralho/));
    fireEvent.click(screen.getByRole("button", { name: /Refazer todas/ }));

    await waitFor(() => expect(screen.getByText("Pergunta A")).toBeTruthy());

    expect(actions.startCourseDeckAction).toHaveBeenCalledWith({ courseId: "c1", count: 5 });
    expect(actions.startCourseQuizAction).not.toHaveBeenCalled();
    expect(screen.queryByText("Resposta A")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /Mostrar resposta/ }));

    expect(screen.getByText("Resposta A")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Dificil/ })).toBeTruthy();
  });

  it("mixes every course when there is no course id, without the Anki export", () => {
    render(<CourseQuiz courseId={null} courseTitle="Todos os cursos" questions={9} />);

    expect(screen.queryByText(/Exportar para Anki/)).toBeNull();
  });
});
