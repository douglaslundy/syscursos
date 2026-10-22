import { describe, expect, it } from "vitest";

import { clampCount, pickDueFirst, pickQuestions, shuffle } from "@/lib/study/quiz-pick";
import { groupByCourse, parseReviewView } from "@/lib/study/review-view";

describe("quiz pick", () => {
  it("clamps the requested count to 1..available and defaults to 10", () => {
    expect(clampCount(undefined, 50)).toBe(10);
    expect(clampCount("abc", 50)).toBe(10);
    expect(clampCount(0, 50)).toBe(10);
    expect(clampCount(25, 50)).toBe(25);
    expect(clampCount(500, 30)).toBe(30);
    expect(clampCount(10, 4)).toBe(4);
    expect(clampCount(1000, 1000)).toBe(100);
  });

  it("shuffles without losing or repeating items", () => {
    const items = [1, 2, 3, 4, 5, 6];

    expect([...shuffle(items, () => 0.3)].sort()).toEqual(items);
    expect(items).toEqual([1, 2, 3, 4, 5, 6]);
    expect(new Set(pickQuestions(items, 4)).size).toBe(4);
  });
});

describe("pickDueFirst", () => {
  it("takes the due items first and fills with the ones still waiting", () => {
    const items = [1, 2, 3, 4, 5, 6];
    const isDue = (item: number) => item % 2 === 0;

    expect(pickDueFirst(items, isDue, 2).every(isDue)).toBe(true);
    expect(pickDueFirst(items, isDue, 4).filter(isDue)).toHaveLength(3);
    expect(new Set(pickDueFirst(items, isDue, 5)).size).toBe(5);
  });
});

describe("review view", () => {
  it("groups cards by course in alphabetical order and defaults to courses", () => {
    const groups = groupByCourse([
      { courseId: "b", courseTitle: "Beta", n: 1 },
      { courseId: "a", courseTitle: "Alfa", n: 2 },
      { courseId: "b", courseTitle: "Beta", n: 3 },
    ]);

    expect(groups.map((group) => [group.courseTitle, group.cards.length])).toEqual([["Alfa", 1], ["Beta", 2]]);
    expect(parseReviewView(undefined)).toBe("courses");
    expect(parseReviewView("random")).toBe("random");
    expect(parseReviewView("x")).toBe("courses");
  });
});
