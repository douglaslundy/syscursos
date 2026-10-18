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

async function fetchSegments(videoId: string): Promise<Segment[]> {
  // A lib devolve offset/duration em ms ou em s conforme a fonte; duracao de trecho >= 100 so existe em ms.
  const toSegments = (items: Array<{ text: string; offset: number; duration: number }>) => {
    const scale = items.some((item) => item.duration >= 100) ? 1000 : 1;
    return items.map((item) => ({ text: item.text, offset: item.offset / scale }));
  };

  try {
    return toSegments(await YoutubeTranscript.fetchTranscript(videoId, { lang: "pt" }));
  } catch {
    return toSegments(await YoutubeTranscript.fetchTranscript(videoId));
  }
}

// Aula ativa do curso, se o aluno logado tem matricula disponivel; senao null.
export async function findTranscribableLesson(courseId: string, lessonId: string) {
  const studentId = await requireStudentProfileId();
  const enrollment = await repository.findEnrollmentForCourse(studentId, courseId);

  if (!enrollment || getCourseAccessStatus(enrollment) !== "AVAILABLE") {
    return null;
  }

  return repository.getActiveLessonForStudent(courseId, lessonId);
}

// Guarda a transcricao feita pelo navegador do aluno (gravacao + Whisper ou Gemini). Vale para todos; so grava uma vez.
export async function saveRecordedTranscript(courseId: string, lessonId: string, text: string) {
  const lesson = await findTranscribableLesson(courseId, lessonId);

  if (!lesson) return "forbidden" as const;
  if (lesson.transcript) return "exists" as const;

  const clean = text.trim().slice(0, MAX_TRANSCRIPT_CHARS);

  if (!clean) return "empty" as const;

  await prisma.lesson.update({ where: { id: lessonId }, data: { transcript: clean } });
  return "ok" as const;
}

// Gera e guarda a transcricao (legenda do YouTube) da aula. Vale para todos os alunos; so gera uma vez.
export async function generateLessonTranscript(courseId: string, lessonId: string): Promise<TranscriptResult> {
  const lesson = await findTranscribableLesson(courseId, lessonId);

  if (!lesson) {
    redirect("/app/forbidden");
  }

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
    console.error("Transcript generation failed.", error);
    return "unavailable";
  }
}
