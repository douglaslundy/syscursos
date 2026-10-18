import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/server/auth/guards";
import { decryptSecret, encryptSecret } from "@/server/security/secret-box";
import { getGoogleDriveFileId } from "@/server/services/video-platform-service";

const GOOGLE_KEY = "google_api_key";

export type GoogleKeyTestResult = "ok" | "empty" | "invalid" | "disabled" | "unshared" | "no_sample" | "network";

// Chave salva na UI tem prioridade; GOOGLE_API_KEY do ambiente e o fallback.
export async function getGoogleApiKey() {
  const row = await prisma.appSetting.findUnique({ where: { key: GOOGLE_KEY } });
  return (row ? decryptSecret(row.value) : null) ?? process.env.GOOGLE_API_KEY ?? null;
}

export async function getGoogleKeyStatus() {
  await requireRole("ADMIN");
  const row = await prisma.appSetting.findUnique({ where: { key: GOOGLE_KEY } });
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
  await prisma.appSetting.upsert({
    where: { key: GOOGLE_KEY },
    create: { key: GOOGLE_KEY, value: encryptSecret(key) },
    update: { value: encryptSecret(key) },
  });
}

export async function removeGoogleApiKey() {
  await requireRole("ADMIN");
  await prisma.appSetting.deleteMany({ where: { key: GOOGLE_KEY } });
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
      return "ok";
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
