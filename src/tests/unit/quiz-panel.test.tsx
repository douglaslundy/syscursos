import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { QuizPanel } from "@/components/student/quiz-panel";
import type { Quiz } from "@/lib/ai/quiz";

const quiz: Quiz = {
  questions: [
    { q: "Pergunta um", options: ["A1", "B1", "C1", "D1"], correct: 0, explanation: "e1" },
    { q: "Pergunta dois", options: ["A2", "B2", "C2", "D2"], correct: 1, explanation: "e2" },
  ],
};

describe("QuizPanel", () => {
  it("shows one question at a time and the full result in a modal", async () => {
    const submit = vi.fn().mockResolvedValue({
      ok: true,
      score: 1,
      total: 2,
      results: [
        { correct: true, answer: 0, explanation: "e1" },
        { correct: false, answer: 1, explanation: "e2" },
      ],
    });

    render(<QuizPanel attempts={[]} quiz={quiz} submit={submit} />);

    expect(screen.getByText(/Pergunta um/)).toBeInTheDocument();
    expect(screen.queryByText(/Pergunta dois/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText(/A1/));
    fireEvent.click(screen.getByRole("button", { name: "Proxima pergunta" }));

    expect(screen.getByText(/Pergunta dois/)).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText(/C2/));
    fireEvent.click(screen.getByRole("button", { name: "Enviar respostas" }));

    await waitFor(() => expect(screen.getByRole("dialog", { name: "Resultado do quiz" })).toBeInTheDocument());
    expect(submit).toHaveBeenCalledWith([0, 2]);
    expect(screen.getAllByText(/Voce acertou 1 de 2/).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "Ver respostas erradas" }));

    expect(screen.getByText(/Sua resposta: C\. C2/)).toBeInTheDocument();
    expect(screen.getByText(/Resposta certa: B\. B2/)).toBeInTheDocument();
  });
});
