import { useEffect } from "react";

import { saveDraft } from "@/lib/transcription/draft";
import { VIDEO_ENDED_EVENT, setTranscribing } from "@/lib/transcription/guard";

// Avisa o resto da pagina (player, "proxima aula") e o navegador enquanto ha transcricao a perder.
export function useBusyGuard(busy: boolean) {
  useEffect(() => {
    setTranscribing(busy);

    if (!busy) return;

    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [busy]);
}

// O texto em conferencia tambem fica guardado no navegador ate ser salvo no banco.
export function useDraftAutosave(active: boolean, lessonId: string, draft: string) {
  useEffect(() => {
    if (!active) return;

    const timer = window.setTimeout(() => saveDraft(lessonId, draft), 500);
    return () => window.clearTimeout(timer);
  }, [active, draft, lessonId]);
}

// O player do YouTube avisa quando o video acaba; um instante depois `onEnded` roda, para pegar o fim da fala.
export function useVideoEnded(shouldFinish: () => boolean, onEnded: () => void, graceMs: number) {
  useEffect(() => {
    let timer: number | undefined;
    const handle = () => {
      if (shouldFinish()) timer = window.setTimeout(onEnded, graceMs);
    };

    window.addEventListener(VIDEO_ENDED_EVENT, handle);
    return () => {
      window.removeEventListener(VIDEO_ENDED_EVENT, handle);
      window.clearTimeout(timer);
    };
    // shouldFinish e onEnded leem refs, entao a identidade deles nao muda o comportamento.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graceMs]);
}
