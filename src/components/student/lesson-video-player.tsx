"use client";

import { useEffect, useId, useMemo, useRef } from "react";

type LessonVideoPlayerProps = {
  videoEmbed: { url: string; supportsCompletionTracking: boolean } | null;
  title: string;
  onEnded: () => void;
};

type YouTubePlayerEvent = {
  data: number;
};

type YouTubePlayer = {
  destroy: () => void;
};

type YouTubeApi = {
  Player: new (
    elementId: string,
    options: {
      events?: {
        onStateChange?: (event: YouTubePlayerEvent) => void;
      };
    },
  ) => YouTubePlayer;
};

declare global {
  interface Window {
    YT?: YouTubeApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const ENDED_STATE = 0;

export function LessonVideoPlayer({
  videoEmbed,
  title,
  onEnded,
}: LessonVideoPlayerProps) {
  const iframeId = useId().replace(/:/g, "");
  const hasSubmittedRef = useRef(false);
  const playerUrl = useMemo(() => {
    if (!videoEmbed) {
      return null;
    }

    if (!videoEmbed.supportsCompletionTracking) {
      return videoEmbed.url;
    }

    try {
      const url = new URL(videoEmbed.url);
      url.searchParams.set("enablejsapi", "1");
      url.searchParams.set("origin", window.location.origin);
      return url.toString();
    } catch {
      return videoEmbed.url;
    }
  }, [videoEmbed]);

  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;

  useEffect(() => {
    if (!videoEmbed?.supportsCompletionTracking) {
      return;
    }

    let player: YouTubePlayer | null = null;
    const scriptId = "youtube-iframe-api";

    const handleEnded = (event: YouTubePlayerEvent) => {
      if (event.data !== ENDED_STATE || hasSubmittedRef.current) {
        return;
      }

      hasSubmittedRef.current = true;
      onEndedRef.current();
    };

    const createPlayer = () => {
      if (!window.YT?.Player) {
        return;
      }

      player = new window.YT.Player(iframeId, {
        events: {
          onStateChange: handleEnded,
        },
      });
    };

    if (window.YT?.Player) {
      createPlayer();
    } else {
      const existingScript = document.getElementById(scriptId);
      if (!existingScript) {
        const script = document.createElement("script");
        script.id = scriptId;
        script.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(script);
      }

      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previous?.();
        createPlayer();
      };
    }

    return () => {
      player?.destroy();
    };
  }, [videoEmbed?.supportsCompletionTracking, iframeId]);

  if (!playerUrl) {
    return (
      <div className="flex aspect-video items-center justify-center bg-surface px-4 text-center text-sm text-copy-muted">
        Link de video invalido.
      </div>
    );
  }

  return (
    <iframe
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
      className="aspect-video w-full"
      id={iframeId}
      referrerPolicy="strict-origin-when-cross-origin"
      src={playerUrl}
      title={title}
    />
  );
}
