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
// O Google limita rajadas de pedidos (403 "Sorry..."): uma falha isolada nao deve derrubar o player; tenta de novo antes de cair na janela do Google.
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

export function OwnVideoPlayer({ src, fallbackUrl, title, startSeconds, onEnded }: OwnVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const endedRef = useRef(false);
  const onEndedRef = useRef(onEnded);
  const retriesRef = useRef(0);
  const resumeRef = useRef<number | null>(null);
  const [failed, setFailed] = useState(false);

  onEndedRef.current = onEnded;

  const handleError = (video: HTMLVideoElement) => {
    if (retriesRef.current >= MAX_RETRIES) {
      setFailed(true);
      return;
    }

    retriesRef.current += 1;
    resumeRef.current = video.currentTime;
    setTimeout(() => {
      if (videoRef.current === video) video.load();
    }, RETRY_DELAY_MS * retriesRef.current);
  };

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
      onError={(event) => handleError(event.currentTarget)}
      onLoadedMetadata={(event) => {
        const video = event.currentTarget;
        // Depois de uma falha, retoma de onde o video parou, nao do ponto salvo da aula.
        const resumeAt = resumeRef.current ?? startSeconds;

        resumeRef.current = null;
        retriesRef.current = 0;

        if (resumeAt > RESUME_MIN_SECONDS && resumeAt < video.duration - RESUME_END_MARGIN) {
          video.currentTime = resumeAt;
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
