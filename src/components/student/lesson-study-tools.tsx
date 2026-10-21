"use client";

import { useEffect, useState, useTransition, type ReactNode } from "react";

import { gradeCard } from "@/lib/ai/deck";
import { parseFlashcards, parseMindMap, type Flashcard } from "@/lib/ai/parsers";
import { layoutMindMap, markdownToBlocks, wrapLabel } from "@/lib/ai/pdf-content";
import { SUMMARY_TECHNIQUES, type SummaryTechniqueId } from "@/lib/ai/techniques";
import { generateAiContentAction } from "@/server/actions/ai-actions";
import type { AiGenerateError, AiItem } from "@/server/services/ai/ai-content-service";

type LessonStudyToolsProps = {
  courseId: string;
  lessonId: string;
  aiEnabled: boolean;
  techniques: SummaryTechniqueId[];
  initialItems: AiItem[];
};

type Panel = "summary" | "flashcards" | "mindmap" | null;

const errorText: Record<AiGenerateError, string> = {
  forbidden: "Voce nao tem acesso a esta aula.",
  no_transcript: "Esta aula ainda nao tem transcricao.",
  invalid_technique: "Esta tecnica nao esta disponivel.",
  no_summary: "Gere antes o resumo desta tecnica.",
  no_provider: "A inteligencia artificial ainda nao foi configurada pelo administrador.",
  invalid_key: "A chave da inteligencia artificial esta invalida. Avise o administrador.",
  quota: "O limite de uso da inteligencia artificial foi atingido. Tente mais tarde.",
  rate_limited: "Muitos pedidos seguidos. Aguarde um minuto e tente de novo.",
  failed: "Nao foi possivel gerar agora. Tente novamente.",
};

const buttonClass =
  "inline-flex min-h-10 items-center justify-center rounded-md border border-stroke-subtle px-4 text-sm font-medium text-copy-secondary transition hover:bg-surface-hover hover:text-copy-primary disabled:cursor-not-allowed disabled:opacity-50";
const primaryClass =
  "inline-flex min-h-10 items-center justify-center rounded-md bg-brand-primary px-4 text-sm font-medium text-copy-primary transition hover:bg-brand-primaryHover disabled:cursor-not-allowed disabled:opacity-60";

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 px-4 py-6 backdrop-blur-sm">
      <div className="mx-auto flex min-h-full max-w-3xl items-center justify-center">
        <section
          aria-label={title}
          aria-modal="true"
          className="w-full rounded-md border border-stroke-subtle bg-surface p-4 shadow-xl md:p-6"
          role="dialog"
        >
          <div className="mb-4 flex items-start justify-between gap-4">
            <h3 className="text-lg font-semibold text-copy-primary">{title}</h3>
            <button aria-label="Fechar" className={buttonClass} onClick={onClose} type="button">
              Fechar
            </button>
          </div>
          {children}
        </section>
      </div>
    </div>
  );
}

function Markdown({ text }: { text: string }) {
  return (
    <div className="max-h-[60vh] space-y-2 overflow-y-auto text-sm leading-6 text-copy-secondary">
      {markdownToBlocks(text).map((block, index) =>
        block.type === "heading" ? (
          <p className="pt-2 font-semibold text-copy-primary" key={index}>
            {block.text}
          </p>
        ) : block.type === "bullet" ? (
          <p className="pl-4" key={index}>
            - {block.text}
          </p>
        ) : (
          <p key={index}>{block.text}</p>
        ),
      )}
    </div>
  );
}

function Deck({ cards }: { cards: Flashcard[] }) {
  const [queue, setQueue] = useState(cards);
  const [revealed, setRevealed] = useState(false);
  const [round, setRound] = useState(0);
  const current = queue[0];

  function grade(result: "again" | "good") {
    setQueue((value) => gradeCard(value, result));
    setRevealed(false);
    setRound((value) => value + 1);
  }

  if (!current) {
    return (
      <div className="space-y-3 text-center">
        <p className="text-base font-semibold text-copy-primary">Baralho concluido! {cards.length} cartoes revisados.</p>
        <button
          className={primaryClass}
          onClick={() => {
            setQueue(cards);
            setRevealed(false);
          }}
          type="button"
        >
          Recomecar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-copy-muted">
        {queue.length} de {cards.length} cartoes restantes
      </p>
      <div className="min-h-40 rounded-md border border-stroke-subtle bg-background p-5" key={round}>
        <p className="text-xs uppercase tracking-[0.12em] text-copy-muted">Pergunta</p>
        <p className="mt-1 text-base font-medium text-copy-primary">{current.q}</p>
        {revealed ? (
          <>
            <p className="mt-4 text-xs uppercase tracking-[0.12em] text-copy-muted">Resposta</p>
            <p className="mt-1 text-sm leading-6 text-copy-secondary">{current.a}</p>
          </>
        ) : null}
      </div>
      {revealed ? (
        <div className="flex flex-wrap gap-2">
          <button className={buttonClass} onClick={() => grade("again")} type="button">
            Errei (ver de novo)
          </button>
          <button className={primaryClass} onClick={() => grade("good")} type="button">
            Acertei
          </button>
        </div>
      ) : (
        <button className={primaryClass} onClick={() => setRevealed(true)} type="button">
          Mostrar resposta
        </button>
      )}
    </div>
  );
}

function MindMap({ content }: { content: string }) {
  const map = parseMindMap(content);

  if (!map) return <p className="text-sm text-destructive">Mapa mental invalido.</p>;

  const layout = layoutMindMap(map);

  return (
    <div className="max-h-[60vh] overflow-auto rounded-md border border-stroke-subtle bg-background p-2">
      <svg height={layout.height + 4} role="img" viewBox={`-2 -2 ${layout.width + 4} ${layout.height + 4}`} width={layout.width + 4}>
        {layout.edges.map((edge, index) => {
          const x1 = edge.from.x + edge.from.width;
          const y1 = edge.from.y + edge.from.height / 2;
          const x2 = edge.to.x;
          const y2 = edge.to.y + edge.to.height / 2;
          const mid = (x1 + x2) / 2;

          return <path d={`M${x1} ${y1} C${mid} ${y1} ${mid} ${y2} ${x2} ${y2}`} fill="none" key={index} stroke="#6F7680" strokeWidth={1.5} />;
        })}
        {layout.nodes.map((node, index) => {
          const lines = wrapLabel(node.text);
          const root = node.depth === 0;

          return (
            <g key={index}>
              <rect fill={root ? "#FF4D00" : "#1A1D21"} height={node.height} rx={8} stroke={root ? "#FF4D00" : "#3A4048"} width={node.width} x={node.x} y={node.y} />
              {lines.map((line, row) => (
                <text
                  fill="#FFFFFF"
                  fontSize={12}
                  fontWeight={root ? 700 : 400}
                  key={row}
                  textAnchor="middle"
                  x={node.x + node.width / 2}
                  y={node.y + node.height / 2 + (row - (lines.length - 1) / 2) * 15 + 4}
                >
                  {line}
                </text>
              ))}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function LessonStudyTools({ courseId, lessonId, aiEnabled, techniques, initialItems }: LessonStudyToolsProps) {
  const [items, setItems] = useState(initialItems);
  const [panel, setPanel] = useState<Panel>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const find = (kind: AiItem["kind"], technique = "") => items.find((item) => item.kind === kind && item.technique === technique);
  const pdfBase = `/app/courses/${courseId}/lessons/${lessonId}/pdf`;
  const usable = techniques.filter((id) => aiEnabled || find("SUMMARY", id));

  function open(next: Panel) {
    setError(null);
    setPanel(next);
    setSelected(next === "summary" || next === "mindmap" ? (techniques.length === 1 ? techniques[0] : null) : null);
  }

  function generate(kind: AiItem["kind"], technique = "") {
    setError(null);
    startTransition(async () => {
      const result = await generateAiContentAction({ courseId, lessonId, kind, technique: technique || undefined });

      if (!result.ok) {
        setError(errorText[result.error]);
        return;
      }

      setItems((current) => [
        ...current.filter((item) => !(item.kind === kind && item.technique === technique)),
        result.item,
      ]);
      setSelected(technique || null);
    });
  }

  const summary = selected ? find("SUMMARY", selected) : undefined;
  const mindmap = selected ? find("MINDMAP", selected) : undefined;
  const flashcards = find("FLASHCARDS");
  const cards = flashcards ? parseFlashcards(flashcards.content) : null;
  const label = (id: string) => SUMMARY_TECHNIQUES.find((item) => item.id === id)?.label ?? id;
  const available = (kind: AiItem["kind"]) => aiEnabled || items.some((item) => item.kind === kind);

  return (
    <section className="mt-6 rounded-md border border-stroke-subtle bg-surface p-4" id="estudo-ia">
      <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-copy-muted">Estudar com inteligencia artificial</h2>
      {aiEnabled || items.length > 0 ? null : (
        <p className="mt-2 text-sm text-copy-secondary">A IA ainda nao foi configurada pelo administrador.</p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <button className={buttonClass} disabled={!available("SUMMARY") || techniques.length === 0} onClick={() => open("summary")} type="button">
          Resumo da aula
        </button>
        <button className={buttonClass} disabled={!available("FLASHCARDS")} onClick={() => open("flashcards")} type="button">
          Flashcards
        </button>
        <button className={buttonClass} disabled={!available("MINDMAP") || techniques.length === 0} onClick={() => open("mindmap")} type="button">
          Mapa mental
        </button>
      </div>

      {panel === "summary" ? (
        <Modal onClose={() => setPanel(null)} title="Resumo da aula">
          {techniques.length > 1 ? (
            <div className="mb-4">
              <p className="mb-2 text-sm text-copy-secondary">Escolha a tecnica de resumo:</p>
              <div className="flex flex-wrap gap-2">
                {techniques.map((id) => {
                  const done = Boolean(find("SUMMARY", id));

                  return (
                    <button
                      aria-pressed={selected === id}
                      className={selected === id ? primaryClass : buttonClass}
                      disabled={pending || (!done && !aiEnabled)}
                      key={id}
                      onClick={() => (done ? (setError(null), setSelected(id)) : generate("SUMMARY", id))}
                      type="button"
                    >
                      {label(id)}
                      {done ? " (pronto)" : ""}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
          {pending ? <p className="text-sm text-copy-secondary">Gerando... pode levar alguns segundos.</p> : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {summary && selected ? (
            <>
              <p className="mb-2 text-xs text-copy-muted">Tecnica: {label(selected)}</p>
              <Markdown text={summary.content} />
              <div className="mt-4 flex flex-wrap gap-2">
                <a className={primaryClass} href={`${pdfBase}/summary?technique=${selected}`}>
                  Baixar PDF
                </a>
                <button
                  className={buttonClass}
                  onClick={() => {
                    setError(null);
                    setPanel("mindmap");
                  }}
                  type="button"
                >
                  Mapa mental deste resumo
                </button>
              </div>
            </>
          ) : techniques.length === 1 && !pending ? (
            <button className={primaryClass} disabled={!aiEnabled} onClick={() => generate("SUMMARY", techniques[0])} type="button">
              Gerar resumo ({label(techniques[0])})
            </button>
          ) : !pending && !error ? (
            <p className="text-sm text-copy-secondary">Escolha uma tecnica para ver ou gerar o resumo.</p>
          ) : null}
        </Modal>
      ) : null}

      {panel === "flashcards" ? (
        <Modal onClose={() => setPanel(null)} title="Flashcards da aula">
          {pending ? <p className="text-sm text-copy-secondary">Gerando... pode levar alguns segundos.</p> : null}
          {error ? <p className="mb-3 text-sm text-destructive">{error}</p> : null}
          {cards ? (
            <>
              <Deck cards={cards} />
              <div className="mt-4">
                <a className={buttonClass} href={`${pdfBase}/flashcards`}>
                  Baixar PDF
                </a>
              </div>
            </>
          ) : !pending ? (
            <button className={primaryClass} disabled={!aiEnabled} onClick={() => generate("FLASHCARDS")} type="button">
              Gerar flashcards
            </button>
          ) : null}
        </Modal>
      ) : null}

      {panel === "mindmap" ? (
        <Modal onClose={() => setPanel(null)} title="Mapa mental do resumo">
          <p className="mb-2 text-sm text-copy-secondary">
            O mapa mental e feito a partir de um resumo. Escolha de qual tecnica:
          </p>
          <div className="mb-4 flex flex-wrap gap-2">
            {usable.map((id) => {
              const hasSummary = Boolean(find("SUMMARY", id));

              return (
                <button
                  aria-pressed={selected === id}
                  className={selected === id ? primaryClass : buttonClass}
                  disabled={pending || !hasSummary}
                  key={id}
                  onClick={() => (find("MINDMAP", id) ? (setError(null), setSelected(id)) : generate("MINDMAP", id))}
                  title={hasSummary ? undefined : "Gere antes o resumo desta tecnica"}
                  type="button"
                >
                  {label(id)}
                  {find("MINDMAP", id) ? " (pronto)" : hasSummary ? "" : " (sem resumo)"}
                </button>
              );
            })}
          </div>
          {pending ? <p className="text-sm text-copy-secondary">Gerando... pode levar alguns segundos.</p> : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {mindmap && selected ? (
            <>
              <MindMap content={mindmap.content} />
              <div className="mt-4">
                <a className={primaryClass} href={`${pdfBase}/mindmap?technique=${selected}`}>
                  Baixar PDF
                </a>
              </div>
            </>
          ) : !pending && !error ? (
            <p className="text-sm text-copy-secondary">
              {usable.some((id) => find("SUMMARY", id)) ? "Escolha uma tecnica." : "Gere primeiro um resumo da aula."}
            </p>
          ) : null}
        </Modal>
      ) : null}
    </section>
  );
}
