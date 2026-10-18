// "mm:ss" (ou "h:mm:ss" a partir de 1h) para marcar o inicio de cada trecho da transcricao.
export function clock(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

// Uma linha por trecho gravado: "[05:00] texto...". start = segundos de gravacao (pausas nao contam). Trecho sem texto e pulado.
export function joinSegments(parts: Array<{ start: number; text: string }>) {
  return parts
    .filter((part) => part.text)
    .map((part) => `[${clock(part.start)}] ${part.text}`)
    .join("\n");
}
