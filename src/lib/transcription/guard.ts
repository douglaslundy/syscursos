// Estado compartilhado entre o player/painel da aula e o transcritor (componentes irmaos na pagina).
// Enquanto ha transcricao em andamento ou ainda nao salva, a aula nao pode avancar sozinha.
type Listener = (busy: boolean) => void;

export const VIDEO_ENDED_EVENT = "lesson-video-ended";

let busy = false;
const listeners = new Set<Listener>();

export function isTranscribing() {
  return busy;
}

export function setTranscribing(value: boolean) {
  if (busy === value) return;

  busy = value;
  listeners.forEach((listener) => listener(value));
}

export function onTranscribingChange(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// Avisa o transcritor que o video terminou (so o player do YouTube tem esse sinal).
export function announceVideoEnded() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(VIDEO_ENDED_EVENT));
}
