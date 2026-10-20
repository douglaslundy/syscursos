import { parseFlashcards, parseMindMap } from "@/lib/ai/parsers";
import { markdownToBlocks, type PdfBlock } from "@/lib/ai/pdf-content";
import { getTechnique, isTechniqueId } from "@/lib/ai/techniques";
import { prisma } from "@/lib/db/prisma";
import {
  renderFlashcardsPdf,
  renderMarkdownPdf,
  renderMindMapPdf,
  renderTextPdf,
  type PdfHeader,
} from "@/server/pdf/render-pdf";
import { findTranscribableLesson } from "@/server/services/transcript-service";

export type LessonPdfKind = "transcript" | "notes" | "summary" | "flashcards" | "mindmap";
export const LESSON_PDF_KINDS: readonly LessonPdfKind[] = ["transcript", "notes", "summary", "flashcards", "mindmap"];

const slug = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()
    .slice(0, 50);

// Cada linha da transcricao ("[01:30] texto") vira um paragrafo.
const transcriptBlocks = (text: string): PdfBlock[] =>
  text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => ({ type: "paragraph", text: line }));

// Monta o PDF pedido pelo aluno; null quando o aluno nao tem acesso ou o conteudo ainda nao existe.
export async function buildLessonPdf(input: { courseId: string; lessonId: string; kind: LessonPdfKind; technique?: string }) {
  const found = await findTranscribableLesson(input.courseId, input.lessonId);

  if (!found) return null;

  const { lesson, studentId } = found;
  const header: PdfHeader = { course: lesson.module.course.title, module: lesson.module.title, lesson: lesson.title };
  const file = (name: string) => `${slug(lesson.title) || "aula"}-${name}.pdf`;
  const technique = isTechniqueId(input.technique) ? input.technique : "";

  if (input.kind === "transcript") {
    return lesson.transcript
      ? { name: file("transcricao"), bytes: renderTextPdf({ header, title: "Transcricao da aula", blocks: transcriptBlocks(lesson.transcript) }) }
      : null;
  }

  if (input.kind === "notes") {
    const note = await prisma.lessonNote.findUnique({ where: { studentId_lessonId: { studentId, lessonId: input.lessonId } } });

    return note?.content.trim()
      ? { name: file("anotacoes"), bytes: renderTextPdf({ header, title: "Minhas anotacoes", blocks: markdownToBlocks(note.content) }) }
      : null;
  }

  const kind = input.kind === "summary" ? "SUMMARY" : input.kind === "flashcards" ? "FLASHCARDS" : "MINDMAP";

  if (kind !== "FLASHCARDS" && !technique) return null;

  const item = await prisma.lessonAiContent.findUnique({
    where: { lessonId_kind_technique: { lessonId: input.lessonId, kind, technique: kind === "FLASHCARDS" ? "" : technique } },
  });

  if (!item) return null;

  if (kind === "SUMMARY") {
    const label = getTechnique(technique as Parameters<typeof getTechnique>[0]).label;
    return { name: file(`resumo-${technique}`), bytes: renderMarkdownPdf({ header, title: `Resumo - ${label}`, markdown: item.content }) };
  }

  if (kind === "FLASHCARDS") {
    const cards = parseFlashcards(item.content);
    return cards ? { name: file("flashcards"), bytes: renderFlashcardsPdf({ header, cards }) } : null;
  }

  const map = parseMindMap(item.content);

  return map ? { name: file(`mapa-mental-${technique}`), bytes: renderMindMapPdf({ header, map }) } : null;
}
