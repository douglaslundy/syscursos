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

export type MapNodeLayout = { text: string; x: number; y: number; width: number; height: number; depth: number };
export type MapEdge = { from: MapNodeLayout; to: MapNodeLayout };
export type MindMapLayout = { nodes: MapNodeLayout[]; edges: MapEdge[]; width: number; height: number };

export const MAP_NODE_WIDTH = 190;
export const MAP_NODE_HEIGHT = 46;
const GAP_X = 50;
const GAP_Y = 14;

// Arvore da esquerda para a direita: cada folha ocupa uma linha, o pai fica centrado nos filhos.
export function layoutMindMap(root: MindMapNode): MindMapLayout {
  const nodes: MapNodeLayout[] = [];
  const edges: MapEdge[] = [];
  let nextLeaf = 0;

  const place = (node: MindMapNode, depth: number): MapNodeLayout => {
    const children = (node.children ?? []).map((child) => place(child, depth + 1));
    const row = children.length > 0 ? (children[0].y + children[children.length - 1].y) / 2 : nextLeaf++ * (MAP_NODE_HEIGHT + GAP_Y);
    const placed: MapNodeLayout = {
      text: node.title,
      x: depth * (MAP_NODE_WIDTH + GAP_X),
      y: row,
      width: MAP_NODE_WIDTH,
      height: MAP_NODE_HEIGHT,
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
  }

  if (current) out.push(current);

  const shown = out.slice(0, lines).map((line) => (line.length > max ? `${line.slice(0, max - 1)}…` : line));

  if (out.length > lines) shown[lines - 1] = `${shown[lines - 1].replace(/…$/, "").slice(0, max - 1)}…`;

  return shown;
}
