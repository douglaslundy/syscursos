// "mm:ss" (ou "h:mm:ss" a partir de 1h) para marcar o inicio de cada trecho da transcricao.
export function clock(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

// Junta os textos dos trechos de 1 min numa linha por trecho: "[05:00] texto...". Trecho sem texto e pulado.
export function joinSegments(parts: Array<string | null>, segmentSeconds: number) {
  return parts
    .map((text, index) => (text ? `[${clock(index * segmentSeconds)}] ${text}` : null))
    .filter((line): line is string => line !== null)
    .join("\n");
}
