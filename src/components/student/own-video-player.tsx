"use client";

import { useEffect, useRef, useState } from "react";

import { registerPlayer } from "@/lib/study/player-bridge";

type OwnVideoPlayerProps = {
  src: string;
  // Janela do Google: usada se o Drive recusar o arquivo (limite de downloads, arquivo nao compartilhado).
  fallbackUrl: string;
  title: string;
  startSeconds: number;
  onEnded: () => void;
};

type CapturableVideo = HTMLVideoElement & { captureStream?: () => MediaStream };

// Ignora os primeiros segundos e o final: retomar a 3s do fim so faria a aula terminar de novo.
const RESUME_MIN_SECONDS = 10;
const RESUME_END_MARGIN = 5;

export function OwnVideoPlayer({ src, fallbackUrl, title, startSeconds, onEnded }: OwnVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const endedRef = useRef(false);
  const onEndedRef = useRef(onEnded);
  const [failed, setFailed] = useState(false);

  onEndedRef.current = onEnded;

  useEffect(() => {
    const video = videoRef.current;

    if (!video || failed) return;

    registerPlayer({
      getTime: () => video.currentTime,
      seek: (seconds) => {
        video.currentTime = seconds;
      },
      setRate: (rate) => {
        video.playbackRate = rate;
      },
      // Audio do proprio video, sem o seletor de compartilhamento de tela do navegador.
      captureAudio: () => {
        const stream = (video as CapturableVideo).captureStream?.();

        return stream && stream.getAudioTracks().length > 0 ? new MediaStream(stream.getAudioTracks()) : null;
      },
    });

    return () => registerPlayer(null);
  }, [failed]);

  if (failed) {
    return (
      <div>
        <iframe
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          className="aspect-video w-full"
          referrerPolicy="strict-origin-when-cross-origin"
          src={fallbackUrl}
          title={title}
        />
        <p className="bg-surface px-3 py-2 text-xs text-copy-muted">
          O player da plataforma nao conseguiu abrir este video; usando o player do Google.
        </p>
      </div>
    );
  }

  return (
    <video
      className="aspect-video w-full bg-black"
      controls
      controlsList="nodownload"
      onEnded={() => {
        if (endedRef.current) return;

        endedRef.current = true;
        onEndedRef.current();
      }}
      onError={() => setFailed(true)}
      onLoadedMetadata={(event) => {
        const video = event.currentTarget;

        if (startSeconds > RESUME_MIN_SECONDS && startSeconds < video.duration - RESUME_END_MARGIN) {
          video.currentTime = startSeconds;
        }
      }}
      playsInline
      preload="metadata"
      ref={videoRef}
      src={src}
      title={title}
    />
  );
}
