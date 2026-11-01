import { type RefObject, useEffect, useRef } from "react";

const SKIP_SECONDS = 10;

type Options = {
  videoRef: RefObject<HTMLVideoElement | null>;
  src: string;
  title: string;
  onEnded: () => void;
};

// Celular: ao bloquear a tela (ou sair do navegador) o <video> e pausado pelo sistema, mas um <audio> continua.
// Entao, com a aula tocando e a pagina indo para segundo plano, o som passa para um <audio> da mesma fonte, na mesma posicao;
// ao voltar, o video retoma de onde o audio parou. Tambem registra os controles da tela de bloqueio (Media Session).
export function useBackgroundAudio({ videoRef, src, title, onEnded }: Options) {
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;

  useEffect(() => {
    const video = videoRef.current;

    // Computador mantem o video tocando em segundo plano; so o celular precisa da troca.
    if (!video || !window.matchMedia?.("(pointer: coarse)").matches) return;

    let audio: HTMLAudioElement | null = null;
    let wantPlay = false;
    const session = "mediaSession" in navigator ? navigator.mediaSession : null;
    // Elemento que esta tocando agora (o audio, enquanto a tela esta bloqueada).
    const current = () => audio ?? video;

    function toAudio() {
      if (audio || !wantPlay) return;

      const element = new Audio(src);

      audio = element;
      element.preload = "auto";
      element.playbackRate = video!.playbackRate;
      // Antes de carregar, define a posicao inicial de reproducao.
      element.currentTime = video!.currentTime;
      element.onended = () => {
        video!.currentTime = element.currentTime;
        audio = null;
        wantPlay = false;
        onEndedRef.current();
      };
      // Se o navegador recusar o audio, o video segue como estava.
      element.play().then(() => video!.pause()).catch(() => {
        if (audio === element) audio = null;
      });
    }

    function toVideo() {
      if (!audio) return;

      const element = audio;
      const resume = !element.paused;

      audio = null;
      element.onended = null;
      element.pause();
      video!.currentTime = element.currentTime;
      if (resume) void video!.play().catch(() => undefined);
    }

    const onVisibility = () => (document.hidden ? toAudio() : toVideo());
    const onPlay = () => {
      wantPlay = true;
    };
    // Pausa com a pagina oculta vem do sistema (bloqueio de tela), nao do aluno: continua so com o audio.
    const onPause = () => {
      if (document.hidden) toAudio();
      else if (!audio) wantPlay = false;
    };

    document.addEventListener("visibilitychange", onVisibility);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);

    if (session) {
      session.metadata = new MediaMetadata({ title });
      session.setActionHandler("play", () => void current().play());
      session.setActionHandler("pause", () => current().pause());
      session.setActionHandler("seekbackward", () => {
        current().currentTime = Math.max(0, current().currentTime - SKIP_SECONDS);
      });
      session.setActionHandler("seekforward", () => {
        current().currentTime += SKIP_SECONDS;
      });
      session.setActionHandler("seekto", (details) => {
        if (details.seekTime !== undefined && details.seekTime !== null) current().currentTime = details.seekTime;
      });
    }

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      audio?.pause();
      audio = null;

      if (session) {
        session.metadata = null;
        (["play", "pause", "seekbackward", "seekforward", "seekto"] as const).forEach((action) => session.setActionHandler(action, null));
      }
    };
  }, [videoRef, src, title]);
}
