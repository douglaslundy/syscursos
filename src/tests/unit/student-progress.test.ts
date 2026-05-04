import { describe, expect, it } from "vitest";

import { calculateCourseProgress } from "@/server/services/progress-service";

describe("calculateCourseProgress", () => {
  it("returns zero progress when there are no active lessons", () => {
    expect(calculateCourseProgress(3, 0)).toEqual({
      completedLessons: 0,
      totalLessons: 0,
      percentage: 0,
    });
  });

  it("calculates rounded percentage from completed lessons", () => {
    expect(calculateCourseProgress(2, 3)).toEqual({
      completedLessons: 2,
      totalLessons: 3,
      percentage: 67,
    });
  });

  it("clamps completed lessons to total lessons", () => {
    expect(calculateCourseProgress(5, 3)).toEqual({
      completedLessons: 3,
      totalLessons: 3,
      percentage: 100,
    });
  });
});
