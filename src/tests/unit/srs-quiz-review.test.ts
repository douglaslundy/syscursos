import { describe, expect, it } from "vitest";

import { INITIAL_REVIEW, quizReview } from "@/lib/study/srs";

const now = new Date("2026-10-22T12:00:00Z");
const day = 86_400_000;

describe("quizReview", () => {
  it("brings a missed card back today and counts the lapse", () => {
    const next = quizReview({ ...INITIAL_REVIEW, reps: 3, intervalDays: 6, dueAt: new Date(now.getTime() + 3 * day) }, false, now);

    expect(next).toMatchObject({ reps: 0, intervalDays: 0, lapses: 1, dueAt: now });
  });

  it("schedules a new card for tomorrow when it is answered right", () => {
    const next = quizReview(null, true, now);

    expect(next).toMatchObject({ reps: 1, intervalDays: 1 });
    expect(next?.dueAt.getTime()).toBe(now.getTime() + day);
  });

  it("advances a due card and leaves a card that is not due yet alone", () => {
    const due = { ...INITIAL_REVIEW, reps: 2, intervalDays: 3, dueAt: new Date(now.getTime() - day) };

    expect(quizReview(due, true, now)?.reps).toBe(3);
    expect(quizReview({ ...due, dueAt: new Date(now.getTime() + day) }, true, now)).toBeNull();
  });
});
