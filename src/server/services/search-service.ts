import { prisma } from "@/lib/db/prisma";
import { MIN_QUERY, cleanQuery, makeSnippet } from "@/lib/study/search";
import { requireStudentProfileId } from "@/server/services/student-service";
import { listAvailableCourses } from "@/server/services/study-access";

export type SearchHit = {
  type: "lesson" | "transcript" | "note" | "summary";
  lessonId: string;
  courseId: string;
  title: string;
  courseTitle: string;
  snippet: string;
};

const LIMIT = 15;

// Busca nas aulas (titulo e transcricao), anotacoes e resumos, apenas dos cursos que o aluno pode estudar agora.
export async function searchStudy(rawQuery: string | undefined): Promise<{ query: string; hits: SearchHit[] }> {
  const query = cleanQuery(rawQuery);

  if (query.length < MIN_QUERY) return { query, hits: [] };

  const studentId = await requireStudentProfileId();
  const courses = await listAvailableCourses(studentId);

  if (courses.length === 0) return { query, hits: [] };

  const courseTitle = new Map(courses.map((course) => [course.id, course.title]));
  const inCourses = { status: "ACTIVE" as const, module: { courseId: { in: courses.map((course) => course.id) } } };
  const match = { contains: query, mode: "insensitive" as const };
  const [lessons, notes, summaries] = await Promise.all([
    prisma.lesson.findMany({
      where: { ...inCourses, OR: [{ title: match }, { transcript: match }] },
      take: LIMIT,
      select: { id: true, title: true, transcript: true, module: { select: { courseId: true } } },
    }),
    prisma.lessonNote.findMany({
      where: { studentId, content: match, lesson: inCourses },
      take: LIMIT,
      select: { content: true, lesson: { select: { id: true, title: true, module: { select: { courseId: true } } } } },
    }),
    prisma.lessonAiContent.findMany({
      where: { kind: "SUMMARY", content: match, lesson: inCourses },
      take: LIMIT,
      select: { content: true, lesson: { select: { id: true, title: true, module: { select: { courseId: true } } } } },
    }),
  ]);
  const hits: SearchHit[] = [
    ...lessons.map((lesson): SearchHit => {
      const inTitle = lesson.title.toLowerCase().includes(query.toLowerCase());

      return {
        type: inTitle ? "lesson" : "transcript",
        lessonId: lesson.id,
        courseId: lesson.module.courseId,
        title: lesson.title,
        courseTitle: courseTitle.get(lesson.module.courseId) ?? "",
        snippet: makeSnippet(inTitle || !lesson.transcript ? lesson.title : lesson.transcript, query),
      };
    }),
    ...notes.map((note): SearchHit => ({
      type: "note",
      lessonId: note.lesson.id,
      courseId: note.lesson.module.courseId,
      title: note.lesson.title,
      courseTitle: courseTitle.get(note.lesson.module.courseId) ?? "",
      snippet: makeSnippet(note.content, query),
    })),
    ...summaries.map((summary): SearchHit => ({
      type: "summary",
      lessonId: summary.lesson.id,
      courseId: summary.lesson.module.courseId,
      title: summary.lesson.title,
      courseTitle: courseTitle.get(summary.lesson.module.courseId) ?? "",
      snippet: makeSnippet(summary.content, query),
    })),
  ];

  return { query, hits };
}
