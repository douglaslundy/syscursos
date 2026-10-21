import { prisma } from "@/lib/db/prisma";
import { appSettings } from "@/server/services/app-settings";
import { requireRole } from "@/server/auth/guards";
import { decryptSecret, encryptSecret } from "@/server/security/secret-box";
import { pingGemini } from "@/server/services/gemini-transcribe-service";
import { extractYouTubeVideoId, getGoogleDriveFileId } from "@/server/services/video-platform-service";

const GOOGLE_KEY = "google_api_key";

export type GoogleKeyTestResult =
  | "ok"
  | "empty"
  | "invalid"
  | "disabled"
  | "unshared"
  | "no_sample"
  | "network"
  | "youtube_disabled";

// Chave salva na UI tem prioridade; GOOGLE_API_KEY do ambiente e o fallback.
export async function getGoogleApiKey() {
  const row = await appSettings.findUnique({ where: { key: GOOGLE_KEY } });
  return (row ? decryptSecret(row.value) : null) ?? process.env.GOOGLE_API_KEY ?? null;
}

export async function getGoogleKeyStatus() {
  await requireRole("ADMIN");
  const row = await appSettings.findUnique({ where: { key: GOOGLE_KEY } });
  const stored = row ? decryptSecret(row.value) : null;
  const key = stored ?? process.env.GOOGLE_API_KEY ?? null;

  return {
    configured: key !== null,
    source: stored ? ("ui" as const) : key ? ("env" as const) : null,
    hint: key ? `...${key.slice(-4)}` : null,
    unreadable: row !== null && stored === null,
  };
}

export async function saveGoogleApiKey(key: string) {
  await requireRole("ADMIN");
  await appSettings.upsert({
    where: { key: GOOGLE_KEY },
    create: { key: GOOGLE_KEY, value: encryptSecret(key) },
    update: { value: encryptSecret(key) },
  });
}

export async function removeGoogleApiKey() {
  await requireRole("ADMIN");
  await appSettings.deleteMany({ where: { key: GOOGLE_KEY } });
}

// Testa a chave informada (ou a salva) lendo os metadados de um arquivo real do Drive ja cadastrado.
export async function testGoogleApiKey(candidate: string | null): Promise<GoogleKeyTestResult> {
  await requireRole("ADMIN");
  const key = candidate || (await getGoogleApiKey());

  if (!key) {
    return "empty";
  }

  const lessons = await prisma.lesson.findMany({
    where: { youtubeUrl: { contains: "drive.google.com/file" } },
    select: { youtubeUrl: true },
    take: 5,
  });
  const fileId = lessons.map((lesson) => getGoogleDriveFileId(lesson.youtubeUrl)).find(Boolean);

  if (!fileId) {
    return "no_sample";
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,videoMediaMetadata(durationMillis)&key=${encodeURIComponent(key)}`,
      { signal: AbortSignal.timeout(10_000) },
    );

    if (response.ok) {
      return await testYouTubeApi(key);
    }

    const body = (await response.json().catch(() => ({}))) as {
      error?: { status?: string; message?: string; details?: Array<{ reason?: string }> };
    };
    const reasons = (body.error?.details ?? []).map((detail) => detail.reason);

    if (reasons.includes("API_KEY_INVALID") || /api key not valid/i.test(body.error?.message ?? "")) return "invalid";
    if (reasons.includes("SERVICE_DISABLED") || reasons.includes("accessNotConfigured")) return "disabled";
    return "unshared";
  } catch (error) {
    console.error("Google API key test failed.", error);
    return "network";
  }
}

// Mesma chave serve para o YouTube Data API v3 (duracao das aulas do YouTube); precisa estar ativado no projeto.
async function testYouTubeApi(key: string): Promise<GoogleKeyTestResult> {
  const sample = await prisma.lesson.findFirst({
    where: { OR: [{ youtubeUrl: { contains: "youtube.com" } }, { youtubeUrl: { contains: "youtu.be" } }] },
    select: { youtubeUrl: true },
  });
  const videoId = sample ? extractYouTubeVideoId(sample.youtubeUrl) : null;

  if (!videoId) {
    return "ok";
  }

  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoId}&key=${encodeURIComponent(key)}`,
    { signal: AbortSignal.timeout(10_000) },
  );
  return response.ok ? "ok" : "youtube_disabled";
}

// --- Transcricao de aulas (Drive): metodo escolhido pelo admin e chave do Gemini ---
const GEMINI_KEY = "gemini_api_key";
const METHOD_KEY = "transcription_method";

export type TranscriptionMethod = "browser" | "gemini";
export type GeminiKeyTestResult = "ok" | "empty" | "invalid" | "quota" | "network";

export async function getGeminiApiKey() {
  const row = await appSettings.findUnique({ where: { key: GEMINI_KEY } });
  return row ? decryptSecret(row.value) : null;
}

export async function getGeminiKeyStatus() {
  await requireRole("ADMIN");
  const row = await appSettings.findUnique({ where: { key: GEMINI_KEY } });
  const key = row ? decryptSecret(row.value) : null;
  return { configured: key !== null, hint: key ? `...${key.slice(-4)}` : null, unreadable: row !== null && key === null };
}

export async function saveGeminiApiKey(key: string) {
  await requireRole("ADMIN");
  const value = encryptSecret(key);
  await appSettings.upsert({ where: { key: GEMINI_KEY }, create: { key: GEMINI_KEY, value }, update: { value } });
}

// Sem chave, o metodo Gemini nao funciona: volta para o navegador.
export async function removeGeminiApiKey() {
  await requireRole("ADMIN");
  await appSettings.deleteMany({ where: { key: GEMINI_KEY } });
  await appSettings.deleteMany({ where: { key: METHOD_KEY, value: "gemini" } });
}

export async function testGeminiApiKey(candidate: string | null): Promise<GeminiKeyTestResult> {
  await requireRole("ADMIN");
  const key = candidate || (await getGeminiApiKey());

  if (!key) return "empty";

  const result = await pingGemini(key);
  if (result.ok) return "ok";
  return result.reason === "invalid_key" ? "invalid" : result.reason === "quota" ? "quota" : "network";
}

// Metodo efetivo: "gemini" so vale com chave legivel; o padrao e "browser".
export async function getTranscriptionMethod(): Promise<TranscriptionMethod> {
  const row = await appSettings.findUnique({ where: { key: METHOD_KEY } });

  if (row?.value === "gemini" && (await getGeminiApiKey())) {
    return "gemini";
  }

  return "browser";
}

export async function saveTranscriptionMethod(method: TranscriptionMethod): Promise<"saved" | "need_key"> {
  await requireRole("ADMIN");

  if (method === "gemini" && !(await getGeminiApiKey())) {
    return "need_key";
  }

  await appSettings.upsert({
    where: { key: METHOD_KEY },
    create: { key: METHOD_KEY, value: method },
    update: { value: method },
  });
  return "saved";
}
