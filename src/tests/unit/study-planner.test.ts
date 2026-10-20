import { describe, expect, it } from "vitest";

import { buildSchedule, minutesPerDayForDeadline, type PlannerCourse, type PlannerLesson } from "@/server/services/study-planner";

const lesson = (id: string, minutes: number): PlannerLesson => ({
  id,
  title: id,
  moduleTitle: "M",
  seconds: minutes * 60,
});
const course = (courseId: string, count: number, minutes: number): PlannerCourse => ({
  courseId,
  lessons: Array.from({ length: count }, (_, i) => lesson(`${courseId}${i}`, minutes)),
});
const weekdays = [1, 2, 3, 4, 5];
const base = { startDate: "2026-10-19", weekdays, startMinute: 0 };

describe("study planner", () => {
  it("fills days in order and skips non-study weekdays", () => {
    // 2026-10-16 is a Friday
    const days = buildSchedule({
      courses: [course("a", 3, 30)],
      startDate: "2026-10-16",
      weekdays,
      startMinute: 1140,
      dailyMinutes: 60,
    });

    expect(days.map((day) => day.date)).toEqual(["2026-10-16", "2026-10-19"]);
    expect(days[0].lessons.map((l) => l.id)).toEqual(["a0", "a1"]);
    expect(days[1].minutes).toBe(30);
  });

  it("carries unused time over so a lesson longer than the daily cap still gets scheduled", () => {
    const days = buildSchedule({ ...base, courses: [course("a", 1, 90)], dailyMinutes: 30 });

    expect(days.map((day) => day.date)).toEqual(["2026-10-21"]);
  });

  it("splits each day equally between courses and gives the freed time to the others when one ends", () => {
    const days = buildSchedule({ ...base, courses: [course("small", 2, 30), course("big", 6, 30)], dailyMinutes: 60 });
    const perDay = days.map((day) => day.lessons.map((l) => l.courseId));

    expect(perDay[0]).toEqual(["small", "big"]);
    expect(perDay[1]).toEqual(["small", "big"]);
    expect(perDay[2]).toEqual(["big", "big"]);
    expect(days.flatMap((day) => day.lessons)).toHaveLength(8);
  });

  it("splits a course time equally between its modules when byModule is on", () => {
    const inModule = (moduleId: string, id: string): PlannerLesson => ({ ...lesson(id, 30), moduleId });
    const modular: PlannerCourse = {
      courseId: "c",
      byModule: true,
      lessons: [inModule("m1", "a1"), inModule("m1", "a2"), inModule("m2", "b1"), inModule("m2", "b2")],
    };
    const days = buildSchedule({ ...base, courses: [modular], dailyMinutes: 60 });

    expect(days.map((day) => day.lessons.map((l) => l.id))).toEqual([["a1", "b1"], ["a2", "b2"]]);
    expect(buildSchedule({ ...base, courses: [{ ...modular, byModule: false }], dailyMinutes: 60 })[0].lessons.map((l) => l.id)).toEqual(["a1", "a2"]);
  });

  it("finds a daily load that finishes by the deadline", () => {
    const input = { ...base, courses: [course("a", 5, 45), course("b", 5, 45)], targetDate: "2026-10-23", maxMinutes: 960 };
    const minutes = minutesPerDayForDeadline(input);
    const days = buildSchedule({ ...input, dailyMinutes: minutes ?? 0 });

    expect(days[days.length - 1].date <= "2026-10-23").toBe(true);
    const slower = buildSchedule({ ...input, dailyMinutes: (minutes ?? 1) - 1 });

    expect((slower.at(-1)?.date ?? "") > "2026-10-23").toBe(true);
  });

  it("returns null when the range has no study day", () => {
    expect(
      minutesPerDayForDeadline({
        courses: [course("a", 1, 10)],
        startDate: "2026-10-17",
        weekdays,
        startMinute: 0,
        targetDate: "2026-10-18",
        maxMinutes: 960,
      }),
    ).toBeNull();
  });
});
