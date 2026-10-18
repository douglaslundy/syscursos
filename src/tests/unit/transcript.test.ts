import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/db/prisma", () => ({ prisma: {} }));
vi.mock("@/server/services/student-service", () => ({
  getCourseAccessStatus: vi.fn(),
  requireStudentProfileId: vi.fn(),
}));
vi.mock("@/server/repositories/student-repository", () => ({}));

import { parseIsoDuration } from "@/server/services/lesson-duration-service";
import { formatTranscript } from "@/server/services/transcript-service";

describe("parseIsoDuration", () => {
  it("converts YouTube ISO durations to seconds", () => {
    expect(parseIsoDuration("PT1H2M3S")).toBe(3723);
    expect(parseIsoDuration("PT45S")).toBe(45);
    expect(parseIsoDuration("P0D")).toBe(0);
    expect(parseIsoDuration("garbage")).toBe(0);
  });
});

describe("formatTranscript", () => {
  it("groups segments into ~30s lines with timestamps and decodes entities", () => {
    const text = formatTranscript([
      { text: "Ola &amp; bem-vindos", offset: 0 },
      { text: "ao curso", offset: 10 },
      { text: "Segunda linha", offset: 65 },
    ]);

    expect(text).toBe("[00:00] Ola & bem-vindos ao curso\n[01:05] Segunda linha");
  });
});
