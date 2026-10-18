import { extractYouTubeVideoId, getGoogleDriveFileId } from "@/server/services/video-platform-service";

const FETCH_TIMEOUT_MS = 8000;

// seconds 0 = arquivo sem duracao (PDF, OneDrive...): conta como processado; null = falhou, tenta de novo.
export type DurationLookup = { seconds: number | null; reason?: "no_drive_key" | "unsupported" | "failed" };

// YouTube: YouTube Data API v3 com a chave Google; sem chave, tenta a pagina publica (YouTube bloqueia IPs de servidor). Drive: API v3 (exige a chave Google (Configuracoes do admin) e arquivo compartilhado).
// OneDrive e PDFs nao expoem duracao: ficam sem valor e o planejador usa uma estimativa.
export async function fetchLessonDuration(
  videoUrl: string,
  youtubeVideoId: string | null,
  googleKey: string | null,
): Promise<DurationLookup> {
  try {
    const driveId = getGoogleDriveFileId(videoUrl);

    if (driveId) {
      return await fetchDriveDuration(driveId, googleKey);
    }

    const videoId = extractYouTubeVideoId(videoUrl) ?? (youtubeVideoId?.length === 11 ? youtubeVideoId : null);

    if (videoId && /youtu/.test(videoUrl)) {
      return await fetchYouTubeDuration(videoId, googleKey);
    }

    return { seconds: 0, reason: "unsupported" };
  } catch (error) {
    console.error("Lesson duration lookup failed.", error);
    return { seconds: null, reason: "failed" };
  }
}

async function fetchDriveDuration(fileId: string, key: string | null): Promise<DurationLookup> {

  if (!key) {
    return { seconds: null, reason: "no_drive_key" };
  }

  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?fields=mimeType,videoMediaMetadata(durationMillis)&key=${key}`;
  const response = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });

  if (!response.ok) {
    return { seconds: null, reason: "failed" };
  }

  const data = (await response.json()) as { mimeType?: string; videoMediaMetadata?: { durationMillis?: string } };

  if (data.mimeType && !data.mimeType.startsWith("video/")) {
    return { seconds: 0, reason: "unsupported" };
  }

  const millis = Number(data.videoMediaMetadata?.durationMillis);
  return Number.isFinite(millis) && millis > 0
    ? { seconds: Math.round(millis / 1000) }
    : { seconds: null, reason: "failed" };
}

// ISO 8601 (PT1H2M3S) -> segundos.
export function parseIsoDuration(value: string) {
  const match = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(value);
  if (!match) return 0;
  const [, days, hours, minutes, seconds] = match.map((part) => Number(part ?? 0));
  return days * 86400 + hours * 3600 + minutes * 60 + seconds;
}

async function fetchYouTubeDuration(videoId: string, key: string | null): Promise<DurationLookup> {
  if (key) {
    const api = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoId}&key=${encodeURIComponent(key)}`,
      { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) },
    );
    const data = api.ok ? ((await api.json()) as { items?: Array<{ contentDetails?: { duration?: string } }> }) : null;
    const seconds = parseIsoDuration(data?.items?.[0]?.contentDetails?.duration ?? "");
    if (seconds > 0) return { seconds };
  }

  const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: { "user-agent": "Mozilla/5.0", "accept-language": "en-US,en;q=0.9" },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  const match = /"lengthSeconds":"(\d+)"/.exec(await response.text());
  const seconds = match ? Number(match[1]) : 0;
  return seconds > 0 ? { seconds } : { seconds: null, reason: "failed" };
}
