const fold = (value: string) => value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export const MIN_QUERY = 2;
export const MAX_QUERY = 80;

export const cleanQuery = (value: string | undefined) => (value ?? "").replace(/\s+/g, " ").trim().slice(0, MAX_QUERY);

// Trecho do texto em volta da primeira ocorrencia (sem acento/caixa); sem ocorrencia, o comeco do texto.
export function makeSnippet(text: string, query: string, radius = 90) {
  const flat = text.replace(/\s+/g, " ").trim();
  const at = fold(flat).indexOf(fold(query));

  if (at < 0) return flat.slice(0, radius * 2);

  const start = Math.max(0, at - radius);
  const end = Math.min(flat.length, at + query.length + radius);

  return `${start > 0 ? "..." : ""}${flat.slice(start, end)}${end < flat.length ? "..." : ""}`;
}
