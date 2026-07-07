import { vi } from "vitest";

import "@testing-library/jest-dom/vitest";

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    cache: actual.cache ?? (<T extends (...args: never[]) => unknown>(fn: T): T => fn),
  };
});
