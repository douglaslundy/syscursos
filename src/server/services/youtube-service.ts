export function getYouTubeEmbedUrl(youtubeUrl: string, youtubeVideoId: string | null) {
  const videoId = youtubeVideoId || extractYouTubeVideoId(youtubeUrl);

  if (!videoId) {
    return null;
  }

  return `https://www.youtube.com/embed/${videoId}`;
}

export function extractYouTubeVideoId(youtubeUrl: string) {
  try {
    const url = new URL(youtubeUrl);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      return url.pathname.replace("/", "") || null;
    }

    if (host === "youtube.com" && url.pathname === "/watch") {
      return url.searchParams.get("v");
    }

    if (host === "youtube.com" && url.pathname.startsWith("/embed/")) {
      return url.pathname.split("/")[2] || null;
    }

    return null;
  } catch {
    return null;
  }
}
