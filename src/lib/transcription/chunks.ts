// Trechos do video enviados ao Gemini um por vez: cada chamada precisa caber no tempo maximo da funcao (60 s).
export const YOUTUBE_CHUNK_SECONDS = 300;
export const MAX_VIDEO_SECONDS = 6 * 3600;

export type Chunk = { start: number; end: number };

// Proximo trecho a partir de "start"; null quando a duracao conhecida ja foi coberta. Sem duracao, segue ate o limite.
export function nextChunk(start: number, durationSeconds: number | null): Chunk | null {
  const limit = durationSeconds && durationSeconds > 0 ? Math.min(durationSeconds, MAX_VIDEO_SECONDS) : MAX_VIDEO_SECONDS;

  if (start >= limit) return null;

  return { start, end: Math.min(start + YOUTUBE_CHUNK_SECONDS, limit) };
}

export function isValidChunk(start: number, end: number) {
  return (
    Number.isInteger(start) &&
    Number.isInteger(end) &&
    start >= 0 &&
    end > start &&
    end - start <= YOUTUBE_CHUNK_SECONDS &&
    end <= MAX_VIDEO_SECONDS
  );
}
