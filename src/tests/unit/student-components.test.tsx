import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EmptyState } from "@/components/student/empty-state";
import { ProgressBar } from "@/components/student/progress-bar";

describe("student UI components", () => {
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
});
