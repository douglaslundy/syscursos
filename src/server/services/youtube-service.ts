export function getYouTubeEmbedUrl(youtubeUrl: string, youtubeVideoId: string | null) {
  const videoId = normalizeYouTubeVideoId(youtubeVideoId) || extractYouTubeVideoId(youtubeUrl);

  if (!videoId) {
    return null;
  }

  return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`;
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

function normalizeYouTubeVideoId(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return /^[a-zA-Z0-9_-]{11}$/.test(trimmed) ? trimmed : null;
}
