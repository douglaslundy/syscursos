import { describe, expect, it } from "vitest";

import { gradeQuiz, parseQuiz } from "@/lib/ai/quiz";
import { INITIAL_REVIEW, cardKey, nextReview } from "@/lib/study/srs";
import { currentStreak, dayKey, longestStreak, weekStart } from "@/lib/study/streak";

const question = (extra: Record<string, unknown> = {}) => ({
  q: "Qual e a capital?",
  options: ["A", "B", "C", "D"],
  correct: 2,
  explanation: "Porque sim.",
  ...extra,
});

describe("parseQuiz", () => {
  it("accepts valid questions, also inside a code fence", () => {
    const quiz = parseQuiz("```json\n" + JSON.stringify({ questions: [question()] }) + "\n```");

    expect(quiz?.questions).toHaveLength(1);
    expect(quiz?.questions[0].correct).toBe(2);
  });

  it("drops questions without 4 distinct options or with an invalid answer index", () => {
    const raw = JSON.stringify({
      questions: [question({ options: ["A", "B", "C"] }), question({ options: ["A", "A", "C", "D"] }), question({ correct: 4 }), question()],
    });

    expect(parseQuiz(raw)?.questions).toHaveLength(1);
  });

  it("returns null for garbage or an empty result", () => {
    expect(parseQuiz("nao e json")).toBeNull();
    expect(parseQuiz(JSON.stringify({ questions: [] }))).toBeNull();
  });
});

describe("gradeQuiz", () => {
  it("counts only the correct answers", () => {
    const quiz = parseQuiz(JSON.stringify({ questions: [question(), question({ correct: 0 })] }));

    expect(gradeQuiz(quiz!, [2, 1])).toBe(1);
    expect(gradeQuiz(quiz!, [null, 0])).toBe(1);
  });
});

describe("nextReview", () => {
  const now = new Date("2026-10-21T12:00:00Z");

  it("grows the interval on consecutive good answers", () => {
    const first = nextReview(INITIAL_REVIEW, "good", now);
    const second = nextReview(first, "good", now);
    const third = nextReview(second, "good", now);

    expect([first.intervalDays, second.intervalDays]).toEqual([1, 3]);
    expect(third.intervalDays).toBeGreaterThan(second.intervalDays);
  });

  it("resets to tomorrow and lowers ease on a miss", () => {
    const grown = nextReview(nextReview(INITIAL_REVIEW, "good", now), "good", now);
    const missed = nextReview(grown, "again", now);

    expect(missed.intervalDays).toBe(1);
    expect(missed.lapses).toBe(1);
    expect(missed.ease).toBeLessThan(grown.ease);
    expect(missed.dueAt.getTime()).toBe(now.getTime() + 86_400_000);
  });

  it("never lets ease fall below 1.3", () => {
    let state = INITIAL_REVIEW;
    for (let index = 0; index < 20; index += 1) state = nextReview(state, "again", now);

    expect(state.ease).toBe(1.3);
  });
});

describe("cardKey", () => {
  it("is stable across case and spacing and differs between questions", () => {
    expect(cardKey("  Qual  e a CAPITAL? ")).toBe(cardKey("qual e a capital?"));
    expect(cardKey("a")).not.toBe(cardKey("b"));
  });
});

describe("streaks", () => {
  const today = new Date("2026-10-21T15:00:00Z");

  it("counts consecutive days and keeps yesterday's streak alive", () => {
    expect(currentStreak(["2026-10-21", "2026-10-20", "2026-10-19", "2026-10-17"], today)).toBe(3);
    expect(currentStreak(["2026-10-20", "2026-10-19"], today)).toBe(2);
    expect(currentStreak(["2026-10-18"], today)).toBe(0);
  });

  it("finds the longest run", () => {
    expect(longestStreak(["2026-10-01", "2026-10-02", "2026-10-03", "2026-10-10", "2026-10-11"])).toBe(3);
    expect(longestStreak([])).toBe(0);
  });

  it("uses the Sao Paulo day and a Monday week start", () => {
    expect(dayKey(new Date("2026-10-21T02:00:00Z"))).toBe("2026-10-20");
    expect(weekStart(new Date("2026-10-21T15:00:00Z"))).toBe("2026-10-19");
  });
});
