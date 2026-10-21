import { prisma } from "@/lib/db/prisma";
import { requireAnyRole } from "@/server/auth/guards";
import { notifyUser } from "@/server/services/notification-service";
import { requireStudentProfileId } from "@/server/services/student-service";
import { findTranscribableLesson } from "@/server/services/transcript-service";

const MAX_PER_DAY = 10;
const LIST_LIMIT = 30;

export type LessonQuestionItem = { id: string; body: string; answer: string | null; mine: boolean; createdAt: string; answeredAt: string | null };

// Respondidas (de qualquer aluno da aula, sem nome) + as proprias ainda sem resposta.
export async function listLessonQuestions(lessonId: string): Promise<LessonQuestionItem[]> {
  const studentId = await requireStudentProfileId();
  const rows = await prisma.lessonQuestion.findMany({
    where: { lessonId, OR: [{ answeredAt: { not: null } }, { studentId }] },
    orderBy: { createdAt: "desc" },
    take: LIST_LIMIT,
  });

  return rows.map((row) => ({
    id: row.id,
    body: row.body,
    answer: row.answer,
    mine: row.studentId === studentId,
    createdAt: row.createdAt.toISOString(),
    answeredAt: row.answeredAt?.toISOString() ?? null,
  }));
}

export async function askQuestion(input: { courseId: string; lessonId: string; body: string }) {
  const found = await findTranscribableLesson(input.courseId, input.lessonId);
  const body = input.body.trim().slice(0, 2000);

  if (!found || !body) return { ok: false as const, error: "invalid" as const };

  const since = new Date(Date.now() - 24 * 3_600_000);

  if ((await prisma.lessonQuestion.count({ where: { studentId: found.studentId, createdAt: { gte: since } } })) >= MAX_PER_DAY) {
    return { ok: false as const, error: "limit" as const };
  }

  const course = await prisma.course.findUnique({ where: { id: input.courseId }, select: { producerId: true, title: true } });

  await prisma.lessonQuestion.create({ data: { lessonId: input.lessonId, courseId: input.courseId, studentId: found.studentId, body } });

  if (course) {
    await notifyUser(course.producerId, { kind: "question_new", title: `Nova duvida em "${found.lesson.title}" (${course.title})`, href: "/admin/questions" });
  }

  return { ok: true as const };
}

// Escopo do painel: o produtor ve so as duvidas dos seus cursos; o admin ve todas da organizacao.
async function staffScope() {
  const user = await requireAnyRole(["ADMIN", "PRODUCER"]);

  return { user, where: { course: { organizationId: user.organizationId, ...(user.role === "PRODUCER" ? { producerId: user.id } : {}) } } };
}

export async function listQuestionsForStaff(onlyPending: boolean) {
  const { where } = await staffScope();
  const rows = await prisma.lessonQuestion.findMany({
    where: { ...where, ...(onlyPending ? { answeredAt: null } : {}) },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      body: true,
      answer: true,
      createdAt: true,
      answeredAt: true,
      courseId: true,
      lessonId: true,
      lesson: { select: { title: true } },
      course: { select: { title: true } },
      student: { select: { user: { select: { name: true } } } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    body: row.body,
    answer: row.answer,
    createdAt: row.createdAt.toISOString(),
    answeredAt: row.answeredAt?.toISOString() ?? null,
    lessonTitle: row.lesson.title,
    courseTitle: row.course.title,
    studentName: row.student.user.name,
  }));
}

export async function answerQuestion(id: string, answer: string) {
  const { user, where } = await staffScope();
  const clean = answer.trim().slice(0, 4000);

  if (!clean) return false;

  const question = await prisma.lessonQuestion.findFirst({
    where: { id, ...where },
    select: { id: true, courseId: true, lessonId: true, lesson: { select: { title: true } }, student: { select: { userId: true } } },
  });

  if (!question) return false;

  await prisma.lessonQuestion.update({ where: { id }, data: { answer: clean, answeredById: user.id, answeredAt: new Date() } });
  await notifyUser(question.student.userId, {
    kind: "question_answered",
    title: `Sua duvida em "${question.lesson.title}" foi respondida`,
    href: `/app/courses/${question.courseId}/lessons/${question.lessonId}#duvidas`,
  });

  return true;
}

export async function countPendingQuestions() {
  const { where } = await staffScope();

  return prisma.lessonQuestion.count({ where: { ...where, answeredAt: null } });
}
