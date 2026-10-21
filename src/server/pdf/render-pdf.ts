import { jsPDF } from "jspdf";

import type { MindMapNode } from "@/lib/ai/parsers";
import {
  MAP_NODE_HEIGHT,
  layoutMindMap,
  markdownToBlocks,
  toPdfText,
  wrapLabel,
  type PdfBlock,
} from "@/lib/ai/pdf-content";

export type PdfHeader = { course: string; module: string; lesson: string };

const MARGIN = 48;
const LINE = 1.35;

function footer(doc: jsPDF, header: PdfHeader) {
  const pages = doc.getNumberOfPages();
  const label = toPdfText(`${header.course}  |  ${header.module}  |  ${header.lesson}`);

  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    const width = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();

    doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(120);
    doc.text(doc.splitTextToSize(label, width - MARGIN * 2 - 50)[0] as string, MARGIN, height - 24);
    doc.text(`${page}/${pages}`, width - MARGIN, height - 24, { align: "right" });
  }
}

function identification(doc: jsPDF, header: PdfHeader, title: string) {
  const width = doc.internal.pageSize.getWidth() - MARGIN * 2;
  let y = MARGIN;

  doc.setFont("helvetica", "bold").setFontSize(18).setTextColor(20);
  for (const line of doc.splitTextToSize(toPdfText(title), width) as string[]) {
    doc.text(line, MARGIN, y);
    y += 22;
  }

  doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(70);
  for (const [name, value] of [
    ["Curso", header.course],
    ["Modulo", header.module],
    ["Aula", header.lesson],
  ] as const) {
    for (const line of doc.splitTextToSize(toPdfText(`${name}: ${value}`), width) as string[]) {
      doc.text(line, MARGIN, y);
      y += 13;
    }
  }

  doc.setDrawColor(200).line(MARGIN, y + 2, MARGIN + width, y + 2);
  return y + 20;
}

function writeBlocks(doc: jsPDF, blocks: PdfBlock[], startY: number) {
  const pageHeight = doc.internal.pageSize.getHeight();
  const width = doc.internal.pageSize.getWidth() - MARGIN * 2;
  let y = startY;

  for (const block of blocks) {
    const size = block.type === "heading" ? Math.max(11, 17 - block.level * 1.5) : 10.5;
    const indent = block.type === "bullet" ? 14 : 0;
    const lines = doc.splitTextToSize(toPdfText(block.text), width - indent) as string[];
    const lineHeight = size * LINE;

    doc.setFont("helvetica", block.type === "heading" ? "bold" : "normal").setFontSize(size).setTextColor(block.type === "heading" ? 20 : 40);

    if (block.type === "heading") y += 6;

    lines.forEach((line, index) => {
      if (y > pageHeight - MARGIN - 10) {
        doc.addPage();
        y = MARGIN;
      }

      if (block.type === "bullet" && index === 0) doc.text("-", MARGIN + 3, y);

      doc.text(line, MARGIN + indent, y);
      y += lineHeight;
    });

    y += block.type === "heading" ? 2 : 6;
  }
}

function toBuffer(doc: jsPDF) {
  return Buffer.from(doc.output("arraybuffer"));
}

export function renderTextPdf(input: { header: PdfHeader; title: string; blocks: PdfBlock[] }) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const y = identification(doc, input.header, input.title);

  writeBlocks(doc, input.blocks, y);
  footer(doc, input.header);
  return toBuffer(doc);
}

export function renderMarkdownPdf(input: { header: PdfHeader; title: string; markdown: string }) {
  return renderTextPdf({ header: input.header, title: input.title, blocks: markdownToBlocks(input.markdown) });
}

export function renderFlashcardsPdf(input: { header: PdfHeader; cards: Array<{ q: string; a: string }> }) {
  const blocks: PdfBlock[] = input.cards.flatMap((card, index): PdfBlock[] => [
    { type: "heading", level: 3, text: `${index + 1}. ${card.q}` },
    { type: "paragraph", text: card.a },
  ]);

  return renderTextPdf({ header: input.header, title: "Flashcards", blocks });
}

// Uma pagina do tamanho do mapa (vetorial, da para ampliar) com a identificacao no topo.
export function renderMindMapPdf(input: { header: PdfHeader; map: MindMapNode }) {
  const layout = layoutMindMap(input.map);
  const top = 140;
  const width = Math.max(layout.width + MARGIN * 2, 420);
  const height = layout.height + top + MARGIN + 20;
  const doc = new jsPDF({ unit: "pt", format: [width, height], orientation: width > height ? "landscape" : "portrait" });

  identification(doc, input.header, "Mapa mental");

  doc.setLineWidth(1).setDrawColor(150);
  for (const edge of layout.edges) {
    const x1 = MARGIN + edge.from.x + edge.from.width;
    const y1 = top + edge.from.y + edge.from.height / 2;
    const x2 = MARGIN + edge.to.x;
    const y2 = top + edge.to.y + edge.to.height / 2;
    const mid = (x1 + x2) / 2;

    doc.lines([[mid - x1, 0], [0, y2 - y1], [x2 - mid, 0]], x1, y1, [1, 1], "S", false);
  }

  for (const node of layout.nodes) {
    const x = MARGIN + node.x;
    const y = top + node.y;
    const root = node.depth === 0;

    doc.setFillColor(root ? 255 : 245, root ? 77 : 245, root ? 0 : 245).setDrawColor(root ? 255 : 160, root ? 77 : 160, root ? 0 : 160);
    doc.roundedRect(x, y, node.width, node.height, 6, 6, "FD");
    doc.setFont("helvetica", root ? "bold" : "normal").setFontSize(9).setTextColor(root ? 255 : 30);

    const lines = wrapLabel(toPdfText(node.text)).map((line) => toPdfText(line));
    const offset = (MAP_NODE_HEIGHT - lines.length * 11) / 2 + 8;
    lines.forEach((line, index) => doc.text(line, x + node.width / 2, y + offset + index * 11, { align: "center" }));
  }

  footer(doc, input.header);
  return toBuffer(doc);
}

// Certificado em A4 paisagem. A verificacao publica fica na URL impressa no rodape.
export function renderCertificatePdf(input: { studentName: string; courseTitle: string; code: string; issuedAt: Date; verifyUrl: string }) {
  const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "landscape" });
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const center = width / 2;
  const maxWidth = width - 160;
  const date = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(input.issuedAt);

  doc.setDrawColor(255, 77, 0).setLineWidth(3).rect(24, 24, width - 48, height - 48);
  doc.setDrawColor(200).setLineWidth(0.5).rect(34, 34, width - 68, height - 68);

  doc.setFont("helvetica", "bold").setFontSize(30).setTextColor(20);
  doc.text("CERTIFICADO DE CONCLUSAO", center, 120, { align: "center" });

  doc.setFont("helvetica", "normal").setFontSize(13).setTextColor(80);
  doc.text("Certificamos que", center, 175, { align: "center" });

  doc.setFont("helvetica", "bold").setFontSize(26).setTextColor(255, 77, 0);
  doc.text(doc.splitTextToSize(toPdfText(input.studentName), maxWidth) as string[], center, 215, { align: "center" });

  doc.setFont("helvetica", "normal").setFontSize(13).setTextColor(80);
  doc.text("concluiu com aproveitamento o curso", center, 258, { align: "center" });

  doc.setFont("helvetica", "bold").setFontSize(20).setTextColor(20);
  doc.text(doc.splitTextToSize(toPdfText(input.courseTitle), maxWidth) as string[], center, 295, { align: "center" });

  doc.setFont("helvetica", "normal").setFontSize(11).setTextColor(90);
  doc.text(toPdfText(`Emitido em ${date}`), center, 400, { align: "center" });
  doc.text(`Codigo de verificacao: ${input.code}`, center, 420, { align: "center" });
  doc.setFontSize(9).setTextColor(120);
  doc.text(toPdfText(`Confira a autenticidade em ${input.verifyUrl}`), center, 438, { align: "center" });

  return toBuffer(doc);
}
