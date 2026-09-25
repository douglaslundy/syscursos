import { describe, expect, it } from "vitest";

import { AdminLink } from "@/components/admin/admin-link";

describe("AdminLink", () => {
  it("disables route prefetch by default", () => {
    const element = AdminLink({ children: "Alunos", href: "/admin/students" });

    expect(element.props.prefetch).toBe(false);
  });

  it("preserves an explicit prefetch choice", () => {
    const element = AdminLink({ children: "Alunos", href: "/admin/students", prefetch: true });

    expect(element.props.prefetch).toBe(true);
  });
});
