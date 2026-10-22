// Ponte entre o player do YouTube e os demais componentes da aula (transcricao clicavel, marcadores, velocidade, retomar).
// YouTube e o player proprio expoem controle; no Drive em iframe `getPlayer()` e null e os recursos de tempo ficam desligados.
export type PlayerControls = {
  getTime: () => number;
  seek: (seconds: number) => void;
  setRate: (rate: number) => void;
  // So o player proprio: faixa de audio do video para transcrever sem pedir o compartilhamento de tela.
  captureAudio?: () => MediaStream | null;
};

let controls: PlayerControls | null = null;

export const PLAYER_READY_EVENT = "syscursos:player-ready";

export function registerPlayer(next: PlayerControls | null) {
  controls = next;

  if (typeof window !== "undefined") window.dispatchEvent(new Event(PLAYER_READY_EVENT));
}

export const getPlayer = () => controls;

export function seekTo(seconds: number) {
  controls?.seek(Math.max(0, seconds));
}

// "01:30" ou "1:02:03" -> segundos; texto invalido -> null.
export function parseClock(value: string) {
  const parts = value.trim().split(":").map(Number);

  if (parts.length < 2 || parts.length > 3 || parts.some((part) => !Number.isInteger(part) || part < 0)) return null;

  return parts.reduce((total, part) => total * 60 + part, 0);
}
