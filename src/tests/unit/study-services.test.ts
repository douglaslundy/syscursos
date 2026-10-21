import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  studyDay: { upsert: vi.fn(), findMany: vi.fn() },
  studentProfile: { findUnique: vi.fn(), update: vi.fn() },
  quizAttempt: { findMany: vi.fn() },
  lessonProgress: { count: vi.fn(), upsert: vi.fn() },
  flashcardReview: { count: vi.fn() },
  lessonBookmark: { count: vi.fn(), create: vi.fn() },
}));
const findLesson = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db/prisma", () => ({ prisma: db }));
vi.mock("@/server/services/transcript-service", () => ({ findTranscribableLesson: findLesson }));
vi.mock("@/server/services/student-service", () => ({ requireStudentProfileId: vi.fn().mockResolvedValue("s1") }));

import { addBookmark, savePosition } from "@/server/services/bookmark-service";
import { getProgressSummary, recordStudyTime } from "@/server/services/study-stats-service";

const ids = { courseId: "c1", lessonId: "l1" };

beforeEach(() => {
  vi.clearAllMocks();
  findLesson.mockResolvedValue({ studentId: "s1", lesson: {} });
});

describe("recordStudyTime", () => {
  it("clamps one beat to 60 seconds", async () => {
    await recordStudyTime({ ...ids, seconds: 9999 });

    expect(db.studyDay.upsert).toHaveBeenCalledWith(expect.objectContaining({ create: expect.objectContaining({ seconds: 60 }), update: { seconds: { increment: 60 } } }));
  });

  it("ignores students without access to the lesson", async () => {
    findLesson.mockResolvedValueOnce(null);

    expect(await recordStudyTime({ ...ids, seconds: 30 })).toBe(false);
    expect(db.studyDay.upsert).not.toHaveBeenCalled();
  });
});

describe("getProgressSummary", () => {
  it("computes streak, week minutes and quiz average", async () => {
    const now = new Date("2026-10-21T15:00:00Z");
    const day = (key: string, seconds: number, lessons = 0) => ({ day: new Date(`${key}T00:00:00Z`), seconds, lessons });

    db.studyDay.findMany.mockResolvedValue([day("2026-10-19", 600), day("2026-10-20", 1200, 2), day("2026-10-21", 300)]);
    db.studentProfile.findUnique.mockResolvedValue({ weeklyGoalMinutes: 300 });
    db.quizAttempt.findMany.mockResolvedValue([{ score: 8, total: 10 }, { score: 6, total: 10 }]);
    db.lessonProgress.count.mockResolvedValue(12);
    db.flashcardReview.count.mockResolvedValue(4);

    const summary = await getProgressSummary(now);

    expect(summary).toMatchObject({ streak: 3, weekMinutes: 35, weekLessons: 2, todayMinutes: 5, weeklyGoalMinutes: 300, quizAverage: 70, completedTotal: 12, dueCards: 4 });
    expect(summary.recent).toHaveLength(14);
  });
});

describe("bookmarks and position", () => {
  it("rejects an empty label and stops at the per-lesson limit", async () => {
    expect(await addBookmark({ ...ids, seconds: 5, label: "   " })).toEqual({ ok: false, error: "invalid" });

    db.lessonBookmark.count.mockResolvedValueOnce(100);
    expect(await addBookmark({ ...ids, seconds: 5, label: "x" })).toEqual({ ok: false, error: "limit" });
    expect(db.lessonBookmark.create).not.toHaveBeenCalled();
  });

  it("saves the position without changing the completion status", async () => {
    await savePosition({ ...ids, seconds: 123.7 });

    expect(db.lessonProgress.upsert).toHaveBeenCalledWith(expect.objectContaining({ update: { positionSeconds: 124 } }));
  });
});

describe("sendStudyReminders", () => {
  it("notifies only students who studied recently but not today, once per day", async () => {
    const now = new Date("2026-10-21T21:00:00Z");
    const row = (studentId: string, key: string) => ({ studentId, day: new Date(`${key}T00:00:00Z`) });
    const notification = { findMany: vi.fn().mockResolvedValue([{ userId: "u3" }]), createMany: vi.fn() };
    const profile = { findMany: vi.fn().mockResolvedValue([{ id: "a", userId: "u1" }, { id: "c", userId: "u3" }]) };

    db.studyDay.findMany.mockResolvedValue([row("a", "2026-10-20"), row("a", "2026-10-19"), row("b", "2026-10-21"), row("c", "2026-10-20")]);
    Object.assign(db, { notification, studentProfile: { ...db.studentProfile, ...profile } });

    const { sendStudyReminders } = await import("@/server/services/reminder-service");

    expect(await sendStudyReminders(now)).toBe(1);
    expect(profile.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: { in: ["a", "c"] } } }));
    expect(notification.createMany).toHaveBeenCalledWith({ data: [expect.objectContaining({ userId: "u1", kind: "study_reminder", title: expect.stringContaining("2 dias") })] });
  });
});
