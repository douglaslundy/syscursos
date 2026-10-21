import { parseClock } from "@/lib/study/player-bridge";

export type TranscriptLine = { index: number; seconds: number | null; clock: string | null; text: string };

const LINE = /^\[((?:\d+:)?\d{1,2}:\d{2})\]\s*(.*)$/;

// A transcricao guarda uma linha por trecho: "[mm:ss] texto". Linhas sem marca de tempo ficam com seconds = null.
export function parseTranscriptLines(transcript: string): TranscriptLine[] {
  return transcript
    .split(/\r?\n/)
    .map((raw) => raw.trim())
    .filter(Boolean)
    .map((raw, index) => {
      const match = LINE.exec(raw);

      return match ? { index, seconds: parseClock(match[1]), clock: match[1], text: match[2] } : { index, seconds: null, clock: null, text: raw };
    });
}

const fold = (value: string) => value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Busca sem acento e sem diferenca de maiuscula.
export function filterLines(lines: TranscriptLine[], query: string) {
  const needle = fold(query.trim());

  return needle ? lines.filter((line) => fold(line.text).includes(needle)) : lines;
}
