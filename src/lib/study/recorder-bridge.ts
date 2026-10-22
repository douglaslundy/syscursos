// Liga o botao "Transcrever gravando o audio" (barra de estudo, acima do video) ao gravador de `LessonTranscriber`.
// O gravador so se registra quando pode comecar (sem transcricao, navegador compativel e parado).
let starter: (() => void) | null = null;

export const RECORDER_EVENT = "syscursos:recorder";

export function registerRecorder(next: (() => void) | null) {
  starter = next;

  if (typeof window !== "undefined") window.dispatchEvent(new Event(RECORDER_EVENT));
}

export const getRecorder = () => starter;
