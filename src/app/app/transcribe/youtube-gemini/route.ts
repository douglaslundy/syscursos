import { NextResponse } from "next/server";

import { isValidChunk } from "@/lib/transcription/chunks";
import { transcribeYoutubeRange } from "@/server/services/gemini-transcribe-service";
import { getGeminiApiKey } from "@/server/services/settings-service";
import { findTranscribableLesson } from "@/server/services/transcript-service";
import { extractYouTubeVideoId } from "@/server/services/video-platform-service";
import { studentLessonParamsSchema } from "@/server/validators/student";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Transcreve um trecho (start..end, em segundos) de uma aula do YouTube pelo Gemini, sem o aluno gravar o audio.
// Serve quando o YouTube bloqueia a legenda no servidor. O texto volta ao navegador para conferencia; nada e salvo aqui.
export async function POST(request: Request) {
  const url = new URL(request.url);
  const params = studentLessonParamsSchema.safeParse({
    courseId: url.searchParams.get("courseId"),
    lessonId: url.searchParams.get("lessonId"),
  });
  const start = Number(url.searchParams.get("start"));
  const end = Number(url.searchParams.get("end"));

  if (!params.success || !isValidChunk(start, end)) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const found = await findTranscribableLesson(params.data.courseId, params.data.lessonId);

  if (!found || found.lesson.transcript) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const videoId = extractYouTubeVideoId(found.lesson.youtubeUrl);

  if (!videoId) {
    return NextResponse.json({ error: "unsupported" }, { status: 422 });
  }

  const key = await getGeminiApiKey();

  if (!key) {
    return NextResponse.json({ error: "not_configured" }, { status: 409 });
  }

  const result = await transcribeYoutubeRange(key, videoId, start, end);

  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: result.reason === "quota" ? 429 : 502 });
  }

  return NextResponse.json({ text: result.text });
}
