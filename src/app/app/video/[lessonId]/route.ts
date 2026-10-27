import { NextResponse } from "next/server";
import { z } from "zod";

import { parseByteRange } from "@/lib/video/range";
import { getGoogleApiKey } from "@/server/services/settings-service";
import { findTranscribableLesson } from "@/server/services/transcript-service";
import { getGoogleDriveFileId } from "@/server/services/video-platform-service";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const querySchema = z.object({ courseId: z.string().uuid(), lessonId: z.string().uuid() });
const PASS_THROUGH = ["content-type", "content-range", "content-length"] as const;

const RETRY_DELAYS_MS = [400, 1200];

// O Google responde 403 em HTML ("Sorry...") quando recebe rajadas de pedidos; 429 e 5xx tambem passam. Tenta de novo com
// pausa curta. 403 em JSON (cota de download do arquivo) nao melhora tentando, entao segue direto para o fallback.
function isTransient(response: Response) {
  return response.status === 429 || response.status >= 500 || (response.status === 403 && (response.headers.get("content-type") ?? "").includes("text/html"));
}

async function fetchDriveRange(fileId: string, key: string, range: { start: number; end: number }, signal: AbortSignal) {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&supportsAllDrives=true&key=${encodeURIComponent(key)}`;

  for (let attempt = 0; ; attempt += 1) {
    const response = await fetch(url, { headers: { range: `bytes=${range.start}-${range.end}` }, signal }).catch((error: unknown) => {
      // Cliente que sai no meio do video aborta o fetch: nao e erro do servidor.
      if (!signal.aborted) console.error("Drive video request failed.", error instanceof Error ? error.name : typeof error);
      return null;
    });

    if (signal.aborted || attempt >= RETRY_DELAYS_MS.length || (response && !isTransient(response))) return response;

    await response?.body?.cancel();
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]));
  }
}

// Entrega o video de uma aula do Drive ao player proprio, lendo pela Drive API com a chave do admin. O aluno nunca ve a
// chave nem o link do Drive; so passa quem tem matricula valida no curso. Serve em faixas (Range) para tocar e pular.
export async function GET(request: Request, context: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await context.params;
  const parsed = querySchema.safeParse({ courseId: new URL(request.url).searchParams.get("courseId"), lessonId });

  if (!parsed.success) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const found = await findTranscribableLesson(parsed.data.courseId, parsed.data.lessonId);

  if (!found) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const fileId = getGoogleDriveFileId(found.lesson.youtubeUrl);

  if (!fileId) {
    return NextResponse.json({ error: "unsupported" }, { status: 422 });
  }

  const key = await getGoogleApiKey();

  if (!key) {
    return NextResponse.json({ error: "not_configured" }, { status: 409 });
  }

  const range = parseByteRange(request.headers.get("range"));

  if (!range) {
    return new Response(null, { status: 416 });
  }

  const upstream = await fetchDriveRange(fileId, key, range, request.signal);

  if (!upstream) {
    return NextResponse.json({ error: "network" }, { status: 502 });
  }

  if (!upstream.ok) {
    // 403 do Drive tambem e "limite de downloads do arquivo": o player cai na janela do Google.
    console.error("Drive video refused.", { status: upstream.status, lessonId });
    return NextResponse.json({ error: "drive_refused" }, { status: upstream.status === 404 ? 404 : upstream.status === 416 ? 416 : 502 });
  }

  const headers = new Headers({ "accept-ranges": "bytes", "cache-control": "private, max-age=600" });

  for (const name of PASS_THROUGH) {
    const value = upstream.headers.get(name);

    if (value) headers.set(name, value);
  }

  return new Response(upstream.body, { status: upstream.status, headers });
}
