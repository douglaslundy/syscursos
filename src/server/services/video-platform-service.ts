export type LessonVideoProvider = "YOUTUBE" | "GOOGLE_DRIVE" | "ONEDRIVE";

export type LessonVideoEmbed = {
  provider: LessonVideoProvider;
  url: string;
  supportsCompletionTracking: boolean;
};

export function getLessonVideoEmbed(videoUrl: string, youtubeVideoId: string | null): LessonVideoEmbed | null {
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

  const youtubeEmbedUrl = getYouTubeEmbedUrl(videoUrl, youtubeVideoId);

  if (youtubeEmbedUrl) {
    return {
      provider: "YOUTUBE",
      url: youtubeEmbedUrl,
      supportsCompletionTracking: true,
    };
  }

  return null;
}

export function getLessonThumbnailUrl(videoUrl: string, youtubeVideoId: string | null) {
  return (
    getYouTubeThumbnailUrl(videoUrl, youtubeVideoId) ??
    getGoogleDriveThumbnailUrl(videoUrl) ??
    getOneDriveThumbnailUrl(videoUrl)
  );
}

export function getYouTubeEmbedUrl(youtubeUrl: string, youtubeVideoId: string | null) {
  const urlVideoId = extractYouTubeVideoId(youtubeUrl);
  const videoId = isYouTubeUrl(youtubeUrl) ? urlVideoId ?? normalizeYouTubeVideoId(youtubeVideoId) : null;

  if (!videoId) {
    return null;
  }

  return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&enablejsapi=1`;
}

export function getYouTubeThumbnailUrl(youtubeUrl: string, youtubeVideoId: string | null) {
  const urlVideoId = extractYouTubeVideoId(youtubeUrl);
  const videoId = isYouTubeUrl(youtubeUrl) ? urlVideoId ?? normalizeYouTubeVideoId(youtubeVideoId) : null;

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
  const fileId = getGoogleDriveFileId(videoUrl);

  if (!fileId) {
    return null;
  }

  return `https://drive.google.com/file/d/${fileId}/preview`;
}

export function getGoogleDriveThumbnailUrl(videoUrl: string) {
  const fileId = getGoogleDriveFileId(videoUrl);

  if (!fileId) {
    return null;
  }

  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
}

export function getOneDriveEmbedUrl(videoUrl: string) {
  return isSupportedOneDriveUrl(videoUrl) ? videoUrl : null;
}

export function getOneDriveThumbnailUrl(videoUrl: string) {
  if (!isSupportedOneDriveUrl(videoUrl)) {
    return null;
  }

  return `https://api.onedrive.com/v1.0/shares/${getOneDriveShareId(videoUrl)}/root/thumbnails/0/large/content`;
}

export function isSupportedLessonVideoUrl(value: string) {
  return getLessonVideoEmbed(value, null) !== null;
}

function isYouTubeUrl(videoUrl: string) {
  try {
    const url = new URL(videoUrl);
    const host = url.hostname.replace(/^www\./, "");
    return host === "youtube.com" || host === "youtu.be";
  } catch {
    return false;
  }
}

function getGoogleDriveFileId(videoUrl: string) {
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

    return fileId;
  } catch {
    return null;
  }
}

function isSupportedOneDriveUrl(videoUrl: string) {
  try {
    const url = new URL(videoUrl);
    const host = url.hostname.replace(/^www\./, "");

    if (url.protocol !== "https:" || (host !== "1drv.ms" && host !== "onedrive.live.com")) {
      return false;
    }

    return host !== "1drv.ms" || url.pathname.startsWith("/v/");
  } catch {
    return false;
  }
}

function getOneDriveShareId(videoUrl: string) {
  return `u!${Buffer.from(videoUrl).toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_")}`;
}

function normalizeYouTubeVideoId(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return /^[a-zA-Z0-9_-]{11}$/.test(trimmed) ? trimmed : null;
}
