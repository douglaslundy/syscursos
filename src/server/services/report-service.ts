import { parseQuiz } from "@/lib/ai/quiz";
import { prisma } from "@/lib/db/prisma";
import { requireAnyRole } from "@/server/auth/guards";

const MAX_ATTEMPTS = 2_000;
const MIN_VISITS = 3;

export type LessonRate = { lessonId: string; title: string; courseTitle: string; visited: number; completed: number; rate: number };
export type MissedQuestion = { lessonTitle: string; courseTitle: string; question: string; misses: number; attempts: number };

// Relatorio do produtor (ou admin): onde os alunos abandonam, quais questoes mais erram e duvidas sem resposta.
export async function getInstructorReport() {
  const user = await requireAnyRole(["ADMIN", "PRODUCER"]);
  const courseWhere = { organizationId: user.organizationId, ...(user.role === "PRODUCER" ? { producerId: user.id } : {}) };
  const courses = await prisma.course.findMany({ where: courseWhere, select: { id: true, title: true } });
  const courseIds = courses.map((course) => course.id);

  if (courseIds.length === 0) return { lowCompletion: [], missed: [], quizAverage: null, attemptsTotal: 0, pendingQuestions: 0 };

  const lessons = await prisma.lesson.findMany({
    where: { status: "ACTIVE", module: { courseId: { in: courseIds } } },
    select: { id: true, title: true, module: { select: { courseId: true } } },
  });
  const lessonById = new Map(lessons.map((lesson) => [lesson.id, lesson]));
  const courseTitle = new Map(courses.map((course) => [course.id, course.title]));
  const [visits, done, attempts, pendingQuestions] = await Promise.all([
    prisma.lessonProgress.groupBy({ by: ["lessonId"], where: { lessonId: { in: lessons.map((lesson) => lesson.id) } }, _count: { _all: true } }),
    prisma.lessonProgress.groupBy({ by: ["lessonId"], where: { lessonId: { in: lessons.map((lesson) => lesson.id) }, status: "COMPLETED" }, _count: { _all: true } }),
    prisma.quizAttempt.findMany({ where: { lessonId: { in: lessons.map((lesson) => lesson.id) } }, orderBy: { createdAt: "desc" }, take: MAX_ATTEMPTS, select: { lessonId: true, score: true, total: true, answers: true } }),
    prisma.lessonQuestion.count({ where: { courseId: { in: courseIds }, answeredAt: null } }),
  ]);
  const completedBy = new Map(done.map((row) => [row.lessonId, row._count._all]));
  const lowCompletion = visits
    .filter((row) => row._count._all >= MIN_VISITS && lessonById.has(row.lessonId))
    .map((row): LessonRate => {
      const lesson = lessonById.get(row.lessonId);
      const completed = completedBy.get(row.lessonId) ?? 0;

      return {
        lessonId: row.lessonId,
        title: lesson?.title ?? "",
        courseTitle: courseTitle.get(lesson?.module.courseId ?? "") ?? "",
        visited: row._count._all,
        completed,
        rate: Math.round((completed / row._count._all) * 100),
      };
    })
    .sort((a, b) => a.rate - b.rate)
    .slice(0, 10);
  const quizLessonIds = Array.from(new Set(attempts.flatMap((attempt) => (attempt.lessonId ? [attempt.lessonId] : []))));
  const quizRows = await prisma.lessonAiContent.findMany({ where: { lessonId: { in: quizLessonIds }, kind: "QUIZ" }, select: { lessonId: true, content: true } });
  const quizByLesson = new Map(quizRows.map((row) => [row.lessonId, parseQuiz(row.content)]));
  const tally = new Map<string, MissedQuestion>();

  for (const attempt of attempts) {
    const quiz = attempt.lessonId ? quizByLesson.get(attempt.lessonId) : null;
    const answers = Array.isArray(attempt.answers) ? attempt.answers : [];

    if (!attempt.lessonId || !quiz || answers.length !== quiz.questions.length) continue;

    quiz.questions.forEach((question, index) => {
      const key = `${attempt.lessonId}:${index}`;
      const current = tally.get(key) ?? {
        lessonTitle: lessonById.get(attempt.lessonId ?? "")?.title ?? "",
        courseTitle: courseTitle.get(lessonById.get(attempt.lessonId ?? "")?.module.courseId ?? "") ?? "",
        question: question.q,
        misses: 0,
        attempts: 0,
      };

      current.attempts += 1;
      if (answers[index] !== question.correct) current.misses += 1;
      tally.set(key, current);
    });
  }

  const missed = Array.from(tally.values())
    .filter((item) => item.attempts >= MIN_VISITS && item.misses > 0)
    .sort((a, b) => b.misses / b.attempts - a.misses / a.attempts)
    .slice(0, 10);
  const points = attempts.reduce((sum, attempt) => sum + attempt.score, 0);
  const total = attempts.reduce((sum, attempt) => sum + attempt.total, 0);

  return { lowCompletion, missed, quizAverage: total > 0 ? Math.round((points / total) * 100) : null, attemptsTotal: attempts.length, pendingQuestions };
}
