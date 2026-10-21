import { parseFlashcards } from "@/lib/ai/parsers";
import { parseQuiz } from "@/lib/ai/quiz";
import { prisma } from "@/lib/db/prisma";
import { requireStudentProfileId } from "@/server/services/student-service";
import { listAvailableCourses } from "@/server/services/study-access";

export type ExportFormat = "md" | "anki";

const slug = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()
    .slice(0, 60) || "curso";

// Campo do Anki (texto separado por tab): sem tab/quebra de linha, que viram <br>.
const ankiField = (value: string) => value.replace(/\t/g, " ").replace(/\r?\n/g, "<br>").trim();

// Anotacoes, resumos, flashcards e quizzes de um curso, so para quem tem acesso a ele.
export async function buildCourseExport(courseId: string, format: ExportFormat) {
  const studentId = await requireStudentProfileId();
  const course = (await listAvailableCourses(studentId)).find((item) => item.id === courseId);

  if (!course) return null;

  const courseModules = await prisma.module.findMany({
    where: { courseId, status: "ACTIVE" },
    orderBy: { position: "asc" },
    select: {
      title: true,
      lessons: {
        where: { status: "ACTIVE" },
        orderBy: { position: "asc" },
        select: {
          id: true,
          title: true,
          aiContents: { where: { kind: { in: ["SUMMARY", "FLASHCARDS", "QUIZ"] } }, orderBy: { createdAt: "asc" }, select: { kind: true, technique: true, content: true } },
        },
      },
    },
  });
  const lessonIds = courseModules.flatMap((mod) => mod.lessons.map((lesson) => lesson.id));
  const notes = await prisma.lessonNote.findMany({ where: { studentId, lessonId: { in: lessonIds } }, select: { lessonId: true, content: true } });
  const noteByLesson = new Map(notes.map((note) => [note.lessonId, note.content]));
  const base = slug(course.title);

  if (format === "anki") {
    const rows: string[] = [];

    for (const mod of courseModules) {
      for (const lesson of mod.lessons) {
        const tags = `${base} ${slug(lesson.title)}`;

        for (const item of lesson.aiContents) {
          if (item.kind === "FLASHCARDS") {
            for (const card of parseFlashcards(item.content) ?? []) rows.push(`${ankiField(card.q)}\t${ankiField(card.a)}\t${tags}`);
          } else if (item.kind === "QUIZ") {
            for (const question of parseQuiz(item.content)?.questions ?? []) {
              rows.push(`${ankiField(question.q)}\t${ankiField(`${question.options[question.correct]} ${question.explanation}`)}\t${tags}`);
            }
          }
        }
      }
    }

    return { name: `${base}-anki.txt`, contentType: "text/plain; charset=utf-8", body: rows.join("\n") };
  }

  const lines = [`# ${course.title}`, ""];

  for (const mod of courseModules) {
    lines.push(`## ${mod.title}`, "");

    for (const lesson of mod.lessons) {
      const note = noteByLesson.get(lesson.id);
      const summaries = lesson.aiContents.filter((item) => item.kind === "SUMMARY");

      if (!note && summaries.length === 0) continue;

      lines.push(`### ${lesson.title}`, "");
      if (note) lines.push("**Minhas anotacoes**", "", note, "");
      for (const summary of summaries) lines.push(`**Resumo (${summary.technique})**`, "", summary.content, "");
    }
  }

  return { name: `${base}.md`, contentType: "text/markdown; charset=utf-8", body: lines.join("\n") };
}
