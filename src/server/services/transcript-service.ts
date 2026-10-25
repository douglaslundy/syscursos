import { YoutubeTranscript } from "youtube-transcript";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db/prisma";
import { clock } from "@/lib/transcription/format";
import * as repository from "@/server/repositories/student-repository";
import { getCourseAccessStatus, requireStudentProfileId } from "@/server/services/student-service";
import { extractYouTubeVideoId } from "@/server/services/video-platform-service";

export type TranscriptResult = "ok" | "exists" | "unsupported" | "unavailable";

const LINE_SECONDS = 30;
const MAX_TRANSCRIPT_CHARS = 400_000;

type Segment = { text: string; offset: number };

function decodeEntities(text: string) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

// Junta os trechos em linhas de ~30s com o tempo no inicio: "[01:30] texto...". offset em segundos.
export function formatTranscript(segments: Segment[]) {
  const lines: string[] = [];
  let lineStart = -LINE_SECONDS;
  let current = "";

  for (const segment of segments) {
    const text = decodeEntities(segment.text);

    if (!text) continue;

    if (segment.offset - lineStart >= LINE_SECONDS) {
      if (current) lines.push(current);
      lineStart = segment.offset;
      current = `[${clock(segment.offset)}] ${text}`;
    } else {
      current += ` ${text}`;
    }
  }

  if (current) lines.push(current);
  return lines.join("\n");
}

// Captcha/429 vale para qualquer idioma. Os demais erros (sem legenda, "video indisponivel") tambem aparecem quando o
// YouTube recusa IP de nuvem, entao a biblioteca nao distingue "sem legenda" de "servidor bloqueado".
export function isCaptchaError(error: unknown) {
  return /too ?many|captcha|429/i.test(error instanceof Error ? `${error.name} ${error.message}` : String(error));
}

async function fetchSegments(videoId: string): Promise<Segment[]> {
  // A lib devolve offset/duration em ms ou em s conforme a fonte; duracao de trecho >= 100 so existe em ms.
  const toSegments = (items: Array<{ text: string; offset: number; duration: number }>) => {
    const scale = items.some((item) => item.duration >= 100) ? 1000 : 1;
    return items.map((item) => ({ text: item.text, offset: item.offset / scale }));
  };

  try {
    return toSegments(await YoutubeTranscript.fetchTranscript(videoId, { lang: "pt" }));
  } catch (error) {
    if (isCaptchaError(error)) throw error;

    return toSegments(await YoutubeTranscript.fetchTranscript(videoId));
  }
}

// Aula ativa do curso e id do aluno logado, se ele tem matricula disponivel; senao null.
export async function findTranscribableLesson(courseId: string, lessonId: string) {
  const studentId = await requireStudentProfileId();
  const enrollment = await repository.findEnrollmentForCourse(studentId, courseId);

  if (!enrollment || getCourseAccessStatus(enrollment) !== "AVAILABLE") {
    return null;
  }

  const lesson = await repository.getActiveLessonForStudent(courseId, lessonId);

  if (!lesson) return null;

  // Material de estudo (quiz, resumo, mapa, baralho) so existe para o aluno depois de concluir a aula.
  const progress = await prisma.lessonProgress.findUnique({ where: { studentId_lessonId: { studentId, lessonId } }, select: { status: true } });

  return { lesson, studentId, completed: progress?.status === "COMPLETED" };
}

// Transcricao gravada por um aluno so pode ser apagada por ele; a de legenda do YouTube ou antiga (sem autor) por qualquer aluno.
export function canResetTranscript(lesson: { transcriptAuthorId: string | null }, studentId: string) {
  return lesson.transcriptAuthorId === null || lesson.transcriptAuthorId === studentId;
}

// Guarda a transcricao feita pelo navegador do aluno (gravacao + Whisper ou Gemini). Vale para todos; so grava uma vez.
export async function saveRecordedTranscript(courseId: string, lessonId: string, text: string) {
  const found = await findTranscribableLesson(courseId, lessonId);

  if (!found) return "forbidden" as const;
  if (found.lesson.transcript) return "exists" as const;

  const clean = text.trim().slice(0, MAX_TRANSCRIPT_CHARS);

  if (!clean) return "empty" as const;

  await prisma.lesson.update({ where: { id: lessonId }, data: { transcript: clean, transcriptAuthorId: found.studentId } });
  return "ok" as const;
}

// Apaga a transcricao da aula para refazer, se for do proprio aluno (ver canResetTranscript).
export async function resetLessonTranscript(courseId: string, lessonId: string) {
  const found = await findTranscribableLesson(courseId, lessonId);

  if (!found) {
    redirect("/app/forbidden");
  }

  if (!canResetTranscript(found.lesson, found.studentId)) {
    return "not_owner" as const;
  }

  // Resumos, flashcards e mapas mentais derivam da transcricao antiga: saem junto com ela.
  await prisma.$transaction([
    prisma.lesson.update({ where: { id: lessonId }, data: { transcript: null, transcriptAuthorId: null } }),
    prisma.lessonAiContent.deleteMany({ where: { lessonId } }),
  ]);
  return "ok" as const;
}

// Gera e guarda a transcricao (legenda do YouTube) da aula. Vale para todos os alunos; so gera uma vez.
export async function generateLessonTranscript(courseId: string, lessonId: string): Promise<TranscriptResult> {
  const found = await findTranscribableLesson(courseId, lessonId);

  if (!found) {
    redirect("/app/forbidden");
  }

  const { lesson } = found;

  if (lesson.transcript) {
    return "exists";
  }

  const videoId = extractYouTubeVideoId(lesson.youtubeUrl);

  if (!videoId) {
    return "unsupported";
  }

  try {
    const text = formatTranscript(await fetchSegments(videoId)).slice(0, MAX_TRANSCRIPT_CHARS);

    if (!text) {
      return "unavailable";
    }

    await prisma.lesson.update({ where: { id: lessonId }, data: { transcript: text } });
    return "ok";
  } catch (error) {
    console.error("Transcript generation failed.", { videoId, name: error instanceof Error ? error.name : typeof error, message: error instanceof Error ? error.message : String(error) });
    return "unavailable";
  }
}
