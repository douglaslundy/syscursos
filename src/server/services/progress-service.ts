export type ProgressSummary = {
  completedLessons: number;
  totalLessons: number;
  percentage: number;
};

export function calculateCourseProgress(
  completedLessons: number,
  totalLessons: number,
): ProgressSummary {
  if (totalLessons <= 0) {
    return {
      completedLessons: 0,
      totalLessons: 0,
      percentage: 0,
    };
  }

  const safeCompleted = Math.min(Math.max(completedLessons, 0), totalLessons);

  return {
    completedLessons: safeCompleted,
    totalLessons,
    percentage: Math.round((safeCompleted / totalLessons) * 100),
  };
}
