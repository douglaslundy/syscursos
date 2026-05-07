type MarkdownContentProps = {
  content: string;
};

export function MarkdownContent({ content }: MarkdownContentProps) {
  const blocks = parseMarkdownBlocks(content);

  return (
    <div className="space-y-3 text-sm leading-7 text-copy-secondary">
      {blocks.map((block) => {
        if (block.type === "heading") {
          const Tag = `h${block.level}` as const;
          return (
            <Tag className="font-semibold tracking-normal text-copy-primary" key={block.key}>
              {block.text}
            </Tag>
          );
        }

        return <p key={block.key}>{block.text}</p>;
      })}
    </div>
  );
}

type MarkdownBlock =
  | { type: "heading"; level: 1 | 2 | 3 | 4 | 5 | 6; text: string; key: string }
  | { type: "paragraph"; text: string; key: string };

function parseMarkdownBlocks(value: string): MarkdownBlock[] {
  const lines = value.replace(/\r\n/g, "\n").split("\n");
  const blocks: MarkdownBlock[] = [];
  let paragraphLines: string[] = [];

  const flushParagraph = () => {
    const text = paragraphLines.join(" ").trim();
    if (text) {
      blocks.push({ type: "paragraph", text, key: `p-${blocks.length}` });
    }
    paragraphLines = [];
  };

  for (const line of lines) {
    const headingMatch = /^(#{1,6})\s+(.+)$/.exec(line.trim());

    if (headingMatch) {
      flushParagraph();
      blocks.push({
        type: "heading",
        level: headingMatch[1].length as 1 | 2 | 3 | 4 | 5 | 6,
        text: headingMatch[2].trim(),
        key: `h-${blocks.length}`,
      });
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      continue;
    }

    paragraphLines.push(line.trim());
  }

  flushParagraph();
  return blocks;
}
