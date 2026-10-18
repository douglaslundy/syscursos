import { NextResponse } from "next/server";

import { transcribeWav } from "@/server/services/gemini-transcribe-service";
import { getGeminiApiKey, getTranscriptionMethod } from "@/server/services/settings-service";
import { findTranscribableLesson } from "@/server/services/transcript-service";
import { studentLessonParamsSchema } from "@/server/validators/student";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// 1 min de WAV 16 kHz mono 16 bits = ~1,9 MB; o limite da Vercel para o corpo e 4,5 MB.
const MAX_BODY_BYTES = 3_000_000;

// Recebe um trecho de audio (WAV) do aluno e devolve o texto do Gemini. O audio nao e guardado.
export async function POST(request: Request) {
  const url = new URL(request.url);
  const params = studentLessonParamsSchema.safeParse({
    courseId: url.searchParams.get("courseId"),
    lessonId: url.searchParams.get("lessonId"),
  });

  if (!params.success) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const lesson = await findTranscribableLesson(params.data.courseId, params.data.lessonId);

  if (!lesson || lesson.transcript) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const key = (await getTranscriptionMethod()) === "gemini" ? await getGeminiApiKey() : null;

  if (!key) {
    return NextResponse.json({ error: "not_configured" }, { status: 409 });
  }

  const body = Buffer.from(await request.arrayBuffer());

  if (body.length < 1000 || body.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "invalid_size" }, { status: 413 });
  }

  const result = await transcribeWav(key, body);

  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: result.reason === "quota" ? 429 : 502 });
  }

  return NextResponse.json({ text: result.text });
}
