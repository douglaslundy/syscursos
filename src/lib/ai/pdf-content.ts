import type { MindMapNode } from "@/lib/ai/parsers";

export type PdfBlock =
  | { type: "heading"; level: number; text: string }
  | { type: "paragraph"; text: string }
  | { type: "bullet"; text: string };

const stripInline = (value: string) => value.replace(/\*\*(.+?)\*\*/g, "$1").replace(/__(.+?)__/g, "$1").replace(/`([^`]+)`/g, "$1");

// Markdown simples (titulos, listas, paragrafos) em blocos que o gerador de PDF sabe desenhar.
export function markdownToBlocks(markdown: string): PdfBlock[] {
  const blocks: PdfBlock[] = [];
  let paragraph: string[] = [];
  const flush = () => {
    if (paragraph.length > 0) blocks.push({ type: "paragraph", text: stripInline(paragraph.join(" ")) });
    paragraph = [];
  };

  for (const raw of markdown.replace(/\r/g, "").split("\n")) {
    const line = raw.trim();
    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    const bullet = /^(?:[-*+]|\d+[.)])\s+(.*)$/.exec(line);

    if (!line) flush();
    else if (heading) {
      flush();
      blocks.push({ type: "heading", level: heading[1].length, text: stripInline(heading[2]) });
    } else if (bullet) {
      flush();
      blocks.push({ type: "bullet", text: stripInline(bullet[1]) });
    } else paragraph.push(line);
  }

  flush();
  return blocks;
}

// As fontes padrao do PDF (Helvetica) usam WinAnsi: Latin-1 e a pontuacao tipografica do Windows-1252.
const WIN_ANSI_EXTRA = new Set("€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ");

export function toPdfText(value: string) {
  return Array.from(value.replace(/\r/g, ""))
    .map((char) => {
      const code = char.codePointAt(0) ?? 0;
      return code === 10 || code === 9 || (code >= 32 && code <= 255 && code !== 127) || WIN_ANSI_EXTRA.has(char) ? char : "?";
    })
    .join("");
}

export type MapNodeLayout = { text: string; lines: string[]; x: number; y: number; width: number; height: number; depth: number };
export type MapEdge = { from: MapNodeLayout; to: MapNodeLayout };
export type MindMapLayout = { nodes: MapNodeLayout[]; edges: MapEdge[]; width: number; height: number };

export const MAP_NODE_WIDTH = 190;
export const MAP_NODE_HEIGHT = 46;
// Titulo inteiro no no: quebra em quantas linhas precisar e o no cresce para caber.
export const MAP_LABEL_CHARS = 28;
export const MAP_LINE_HEIGHT = 15;
const GAP_X = 50;
const GAP_Y = 14;

// Arvore da esquerda para a direita: cada folha ocupa uma linha, o pai fica centrado nos filhos.
export function layoutMindMap(root: MindMapNode): MindMapLayout {
  const nodes: MapNodeLayout[] = [];
  const edges: MapEdge[] = [];
  let nextLeafY = 0;
  // Fundo do ultimo no de cada coluna: evita que um pai alto sobreponha o vizinho.
  const columnBottom: number[] = [];

  const place = (node: MindMapNode, depth: number): MapNodeLayout => {
    const children = (node.children ?? []).map((child) => place(child, depth + 1));
    const lines = wrapLabel(node.title, MAP_LABEL_CHARS, Infinity);
    const height = Math.max(MAP_NODE_HEIGHT, lines.length * MAP_LINE_HEIGHT + 16);
    let row: number;

    if (children.length > 0) {
      const last = children[children.length - 1];

      row = (children[0].y + last.y + last.height) / 2 - height / 2;
    } else {
      row = nextLeafY;
      nextLeafY += height + GAP_Y;
    }

    row = Math.max(row, (columnBottom[depth] ?? -GAP_Y) + GAP_Y);
    columnBottom[depth] = row + height;
    // Uma folha mais baixa que o previsto empurra as proximas.
    nextLeafY = Math.max(nextLeafY, children.length === 0 ? row + height + GAP_Y : nextLeafY);

    const placed: MapNodeLayout = {
      text: node.title,
      lines,
      x: depth * (MAP_NODE_WIDTH + GAP_X),
      y: row,
      width: MAP_NODE_WIDTH,
      height,
      depth,
    };

    nodes.push(placed);
    children.forEach((child) => edges.push({ from: placed, to: child }));
    return placed;
  };

  place(root, 0);

  const width = Math.max(...nodes.map((node) => node.x + node.width));
  const height = Math.max(...nodes.map((node) => node.y + node.height));

  return { nodes, edges, width, height };
}

// Quebra o titulo em ate `lines` linhas de `max` caracteres, com reticencias no fim se faltar espaco.
export function wrapLabel(text: string, max = 24, lines = 2) {
  const words = text.split(/\s+/).filter(Boolean);
  const out: string[] = [];
  let current = "";

  for (const word of words) {
    if (current && `${current} ${word}`.length > max) {
      out.push(current);
      current = word;
    } else current = current ? `${current} ${word}` : word;

    // Palavra maior que a linha (URL, termo tecnico): quebra em pedacos para nao perder texto.
    while (lines === Infinity && current.length > max) {
      out.push(current.slice(0, max));
      current = current.slice(max);
    }
  }

  if (current) out.push(current);

  const shown = out.slice(0, lines).map((line) => (line.length > max ? `${line.slice(0, max - 1)}…` : line));

  if (out.length > lines) shown[lines - 1] = `${shown[lines - 1].replace(/…$/, "").slice(0, max - 1)}…`;

  return shown;
}
