export type LessonVideoProvider = "YOUTUBE" | "GOOGLE_DRIVE" | "ONEDRIVE";

export type LessonVideoEmbed = {
  provider: LessonVideoProvider;
  url: string;
  supportsCompletionTracking: boolean;
};

export function getLessonVideoEmbed(videoUrl: string, youtubeVideoId: string | null): LessonVideoEmbed | null {
  const youtubeEmbedUrl = getYouTubeEmbedUrl(videoUrl, youtubeVideoId);

  if (youtubeEmbedUrl) {
    return {
      provider: "YOUTUBE",
      url: youtubeEmbedUrl,
      supportsCompletionTracking: true,
    };
  }

  const googleDriveEmbedUrl = getGoogleDriveEmbedUrl(videoUrl);

  if (googleDriveEmbedUrl) {
    return {
      provider: "GOOGLE_DRIVE",
      url: googleDriveEmbedUrl,
      supportsCompletionTracking: false,
    };
  }

  const oneDriveEmbedUrl = getOneDriveEmbedUrl(videoUrl);

  if (oneDriveEmbedUrl) {
    return {
      provider: "ONEDRIVE",
      url: oneDriveEmbedUrl,
      supportsCompletionTracking: false,
    };
  }

  return null;
}

export function getYouTubeEmbedUrl(youtubeUrl: string, youtubeVideoId: string | null) {
  const videoId = normalizeYouTubeVideoId(youtubeVideoId) || extractYouTubeVideoId(youtubeUrl);

  if (!videoId) {
    return null;
  }

  return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&enablejsapi=1`;
}

export function getYouTubeThumbnailUrl(youtubeUrl: string, youtubeVideoId: string | null) {
  const videoId = normalizeYouTubeVideoId(youtubeVideoId) || extractYouTubeVideoId(youtubeUrl);

  if (!videoId) {
    return null;
  }

  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

export function extractYouTubeVideoId(youtubeUrl: string) {
  try {
    const url = new URL(youtubeUrl);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      return normalizeYouTubeVideoId(url.pathname.split("/").filter(Boolean)[0]);
    }

    if (host === "youtube.com" && url.pathname === "/watch") {
      return normalizeYouTubeVideoId(url.searchParams.get("v"));
    }

    if (host === "youtube.com" && url.pathname.startsWith("/embed/")) {
      return normalizeYouTubeVideoId(url.pathname.split("/")[2]);
    }

    if (host === "youtube.com" && url.pathname.startsWith("/shorts/")) {
      return normalizeYouTubeVideoId(url.pathname.split("/")[2]);
    }

    if (host === "youtube.com" && url.pathname.startsWith("/live/")) {
      return normalizeYouTubeVideoId(url.pathname.split("/")[2]);
    }

    return null;
  } catch {
    return null;
  }
}

export function getGoogleDriveEmbedUrl(videoUrl: string) {
  try {
    const url = new URL(videoUrl);

    if (url.protocol !== "https:" || url.hostname !== "drive.google.com") {
      return null;
    }

    const parts = url.pathname.split("/").filter(Boolean);
    const fileIndex = parts.indexOf("file");
    const idIndex = fileIndex >= 0 && parts[fileIndex + 1] === "d" ? fileIndex + 2 : -1;
    const fileId = idIndex >= 0 ? parts[idIndex] : null;

    if (!fileId || !/^[a-zA-Z0-9_-]+$/.test(fileId)) {
      return null;
    }

    return `https://drive.google.com/file/d/${fileId}/preview`;
  } catch {
    return null;
  }
}

export function getOneDriveEmbedUrl(videoUrl: string) {
  try {
    const url = new URL(videoUrl);
    const host = url.hostname.replace(/^www\./, "");

    if (url.protocol !== "https:" || (host !== "1drv.ms" && host !== "onedrive.live.com")) {
      return null;
    }

    if (host === "1drv.ms" && !url.pathname.startsWith("/v/")) {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

export function isSupportedLessonVideoUrl(value: string) {
  return getLessonVideoEmbed(value, null) !== null;
}

function normalizeYouTubeVideoId(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return /^[a-zA-Z0-9_-]{11}$/.test(trimmed) ? trimmed : null;
}
