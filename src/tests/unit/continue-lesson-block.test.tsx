import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ContinueLessonBlock } from "@/components/student/continue-lesson-block";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const baseCard = {
  href: "/app/courses/c1/lessons/l2",
  watchAgainHref: "/app/courses/c1/lessons/l2",
  nextLessonHref: null as string | null,
  nextLessonTitle: null as string | null,
  courseTitle: "Curso",
  moduleTitle: "Modulo",
  lessonTitle: "Aula 2",
  lessonPosition: 2,
  modulePosition: 1,
  mode: "REVIEW_LAST" as const,
};

describe("ContinueLessonBlock", () => {
  it("shows both buttons when there is a distinct next lesson", () => {
    render(
      <ContinueLessonBlock
        context="home"
        card={{ ...baseCard, nextLessonHref: "/app/courses/c1/lessons/l3", nextLessonTitle: "Aula 3" }}
      />,
    );

    expect(screen.getByRole("link", { name: "Assistir novamente" })).toHaveAttribute(
      "href",
      "/app/courses/c1/lessons/l2",
    );
    expect(screen.getByRole("link", { name: "Assistir a proxima aula" })).toHaveAttribute(
      "href",
      "/app/courses/c1/lessons/l3",
    );
  });

  it("shows a single continue button when there is no distinct next lesson", () => {
    render(<ContinueLessonBlock context="course" card={baseCard} />);

    expect(screen.queryByRole("link", { name: "Assistir a proxima aula" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Abrir aula|Continuar/ })).toHaveAttribute(
      "href",
      "/app/courses/c1/lessons/l2",
    );
  });
});
