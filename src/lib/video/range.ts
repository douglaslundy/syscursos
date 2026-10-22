// Cada pedido ao Drive traz no maximo este tanto: o navegador pede "bytes=N-" e vai buscando o resto conforme toca,
// o que mantem cada resposta curta (cabe no tempo da funcao) e evita baixar o arquivo inteiro se o aluno sair.
export const CHUNK_BYTES = 8 * 1024 * 1024;

export type ByteRange = { start: number; end: number };

// Sem cabecalho Range: comeca do inicio. Formato que nao entendemos (ex.: "bytes=-500", varias faixas): null -> 416.
export function parseByteRange(header: string | null): ByteRange | null {
  if (header === null) return { start: 0, end: CHUNK_BYTES - 1 };

  const match = /^bytes=(\d{1,15})-(\d{0,15})$/.exec(header.trim());

  if (!match) return null;

  const start = Number(match[1]);
  const requestedEnd = match[2] === "" ? Number.POSITIVE_INFINITY : Number(match[2]);

  if (requestedEnd < start) return null;

  return { start, end: Math.min(requestedEnd, start + CHUNK_BYTES - 1) };
}
