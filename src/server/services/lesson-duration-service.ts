import { extractYouTubeVideoId, getGoogleDriveFileId } from "@/server/services/video-platform-service";

const FETCH_TIMEOUT_MS = 8000;

export type DurationLookup = { seconds: number | null; reason?: "no_drive_key" | "unsupported" | "failed" };

// YouTube: le lengthSeconds da pagina publica. Drive: API v3 (exige a chave Google (Configuracoes do admin) e arquivo compartilhado).
// OneDrive e PDFs nao expoem duracao: ficam sem valor e o planejador usa uma estimativa.
export async function fetchLessonDuration(
  videoUrl: string,
  youtubeVideoId: string | null,
  driveKey: string | null,
): Promise<DurationLookup> {
  try {
    const driveId = getGoogleDriveFileId(videoUrl);

    if (driveId) {
      return await fetchDriveDuration(driveId, driveKey);
    }

    const videoId = extractYouTubeVideoId(videoUrl) ?? (youtubeVideoId?.length === 11 ? youtubeVideoId : null);

    if (videoId && /youtu/.test(videoUrl)) {
      return await fetchYouTubeDuration(videoId);
    }

    return { seconds: null, reason: "unsupported" };
  } catch (error) {
    console.error("Lesson duration lookup failed.", error);
    return { seconds: null, reason: "failed" };
  }
}

async function fetchDriveDuration(fileId: string, key: string | null): Promise<DurationLookup> {

  if (!key) {
    return { seconds: null, reason: "no_drive_key" };
  }

  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?fields=videoMediaMetadata(durationMillis)&key=${key}`;
  const response = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });

  if (!response.ok) {
    return { seconds: null, reason: "failed" };
  }

  const data = (await response.json()) as { videoMediaMetadata?: { durationMillis?: string } };
  const millis = Number(data.videoMediaMetadata?.durationMillis);
  return Number.isFinite(millis) && millis > 0
    ? { seconds: Math.round(millis / 1000) }
    : { seconds: null, reason: "failed" };
}

async function fetchYouTubeDuration(videoId: string): Promise<DurationLookup> {
  const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: { "user-agent": "Mozilla/5.0", "accept-language": "en-US,en;q=0.9" },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  const match = /"lengthSeconds":"(\d+)"/.exec(await response.text());
  const seconds = match ? Number(match[1]) : 0;
  return seconds > 0 ? { seconds } : { seconds: null, reason: "failed" };
}
