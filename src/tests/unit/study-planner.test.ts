import { describe, expect, it } from "vitest";

import { buildSchedule, minutesPerDayForDeadline, type PlannerLesson } from "@/server/services/study-planner";

const lesson = (id: string, minutes: number): PlannerLesson => ({
  id,
  title: id,
  moduleTitle: "M",
  seconds: minutes * 60,
});
const weekdays = [1, 2, 3, 4, 5];

describe("study planner", () => {
  it("fills days in order and skips non-study weekdays", () => {
    // 2026-10-16 is a Friday
    const days = buildSchedule({
      lessons: [lesson("a", 30), lesson("b", 30), lesson("c", 30)],
      startDate: "2026-10-16",
      weekdays,
      startMinute: 1140,
      dailyMinutes: 60,
    });

    expect(days.map((day) => day.date)).toEqual(["2026-10-16", "2026-10-19"]);
    expect(days[0].lessons.map((l) => l.id)).toEqual(["a", "b"]);
    expect(days[1].minutes).toBe(30);
  });

  it("always schedules at least one lesson per day even if longer than the cap", () => {
    const days = buildSchedule({
      lessons: [lesson("long", 90)],
      startDate: "2026-10-19",
      weekdays,
      startMinute: 0,
      dailyMinutes: 30,
    });

    expect(days).toHaveLength(1);
  });

  it("finds a daily load that finishes by the deadline", () => {
    const lessons = Array.from({ length: 10 }, (_, i) => lesson(`l${i}`, 45));
    const input = { lessons, startDate: "2026-10-19", weekdays, startMinute: 0, targetDate: "2026-10-23" };
    const minutes = minutesPerDayForDeadline(input);
    const days = buildSchedule({ ...input, dailyMinutes: minutes ?? 0 });

    expect(days[days.length - 1].date <= "2026-10-23").toBe(true);
  });

  it("returns null when the range has no study day", () => {
    expect(
      minutesPerDayForDeadline({
        lessons: [lesson("a", 10)],
        startDate: "2026-10-17",
        weekdays,
        startMinute: 0,
        targetDate: "2026-10-18",
      }),
    ).toBeNull();
  });
});
