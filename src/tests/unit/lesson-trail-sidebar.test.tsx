import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LessonTrailSidebar } from "@/components/student/lesson-trail-sidebar";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const modules = [
  {
    id: "module-1",
    title: "Modulo atual",
    position: 1,
    lessons: [
      { id: "lesson-1", title: "Aula atual", position: 1 },
      { id: "lesson-2", title: "Aula seguinte", position: 2 },
    ],
  },
  {
    id: "module-2",
    title: "Modulo distante",
    position: 2,
    lessons: [{ id: "lesson-99", title: "Aula longe", position: 1 }],
  },
];

const baseProps = {
  courseId: "course-id",
  currentLessonId: "lesson-1",
  currentModuleId: "module-1",
  modules,
  completedLessonIds: [],
  progress: { completedLessons: 0, totalLessons: 3, percentage: 0 },
};

describe("LessonTrailSidebar", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders lesson links only for the current module until another is expanded", () => {
    render(<LessonTrailSidebar {...baseProps} />);

    expect(screen.getByRole("link", { name: /Aula atual/ })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Aula longe/ })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Modulo distante/ }));

    expect(screen.getByRole("link", { name: /Aula longe/ })).toBeInTheDocument();
  });
});
