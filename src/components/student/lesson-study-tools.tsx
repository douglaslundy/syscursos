"use client";

import { useEffect, useState, useTransition } from "react";

import { Modal, buttonClass, readyClass, primaryClass } from "@/components/student/study-modal";
import { QuizPanel } from "@/components/student/quiz-panel";
import { gradeCard } from "@/lib/ai/deck";
import { parseFlashcards, parseMindMap, type Flashcard } from "@/lib/ai/parsers";
import { layoutMindMap, markdownToBlocks } from "@/lib/ai/pdf-content";
import { parseQuiz } from "@/lib/ai/quiz";
import { SUMMARY_TECHNIQUES, getTechnique, type SummaryTechniqueId } from "@/lib/ai/techniques";
import { cardKey } from "@/lib/study/srs";
import { generateAiContentAction } from "@/server/actions/ai-actions";
import { generateExternalAiAction, reviewExternalCardAction, submitExternalQuizAction } from "@/server/actions/external-notebook-actions";
import { reviewCardAction, submitQuizAction } from "@/server/actions/study-actions";
import type { AiGenerateError, AiItem } from "@/server/services/ai/ai-content-service";

type LessonStudyToolsProps = {
  // Aula de caderno externo: usa as acoes do caderno e nao tem PDF (courseId nao se aplica).
  external?: boolean;
  courseId: string;
  lessonId: string;
  aiEnabled: boolean;
  techniques: SummaryTechniqueId[];
  initialItems: AiItem[];
  quizAttempts: Array<{ score: number; total: number; createdAt: string }>;
};

type Panel = "summary" | "flashcards" | "mindmap" | "quiz" | null;

const errorText: Record<AiGenerateError, string> = {
  forbidden: "Voce nao tem acesso a esta aula.",
  not_completed: "Conclua a aula para liberar este material.",
  no_transcript: "Esta aula ainda nao tem transcricao.",
  invalid_technique: "Esta tecnica nao esta disponivel.",
  no_summary: "Gere antes o resumo desta tecnica.",
  no_provider: "A inteligencia artificial ainda nao foi configurada pelo administrador.",
  invalid_key: "A chave da inteligencia artificial esta invalida. Avise o administrador.",
  quota: "O limite de uso da inteligencia artificial foi atingido. Tente mais tarde.",
  rate_limited: "Muitos pedidos seguidos. Aguarde um minuto e tente de novo.",
  failed: "Nao foi possivel gerar agora. Tente novamente.",
};

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

function Deck({ cards, courseId, lessonId, external }: { cards: Flashcard[]; courseId: string; lessonId: string; external?: boolean }) {
  const [queue, setQueue] = useState(cards);
  const [revealed, setRevealed] = useState(false);
  const [round, setRound] = useState(0);
  const current = queue[0];

  function grade(result: "again" | "good" | "easy") {
    // A nota alimenta a repeticao espacada; falha de rede nao atrapalha o estudo da sessao.
    const review = { lessonId, cardKey: cardKey(current.q), grade: result };

    void (external ? reviewExternalCardAction(review) : reviewCardAction({ courseId, ...review })).catch(() => null);
    setQueue((value) => gradeCard(value, result === "again" ? "again" : "good"));
    setRevealed(false);
    setRound((value) => value + 1);
  }

  // Atalhos: espaco mostra a resposta; 1 = errei, 2 = acertei, 3 = facil.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement | null)?.closest("input, textarea, select, button") || !current) return;

      if (event.key === " " && !revealed) {
        event.preventDefault();
        setRevealed(true);
      } else if (revealed && event.key === "1") grade("again");
      else if (revealed && event.key === "2") grade("good");
      else if (revealed && event.key === "3") grade("easy");
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

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
            Errei (1)
          </button>
          <button className={primaryClass} onClick={() => grade("good")} type="button">
            Acertei (2)
          </button>
          <button className={buttonClass} onClick={() => grade("easy")} type="button">
            Facil (3)
          </button>
        </div>
      ) : (
        <button className={primaryClass} onClick={() => setRevealed(true)} type="button">
          Mostrar resposta (espaco)
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
          const lines = node.lines;
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

export function LessonStudyTools({ external, courseId, lessonId, aiEnabled, techniques, initialItems, quizAttempts }: LessonStudyToolsProps) {
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
    // Com varias tecnicas, ja abre a que foi gerada (se houver); senao o aluno escolhe.
    const kind = next === "summary" ? "SUMMARY" : next === "mindmap" ? "MINDMAP" : null;
    const generated = kind ? items.find((item) => item.kind === kind && techniques.some((id) => id === item.technique)) : undefined;

    setSelected(kind ? (techniques.length === 1 ? techniques[0] : (generated?.technique ?? null)) : null);
  }

  function generate(kind: AiItem["kind"], technique = "") {
    setError(null);
    startTransition(async () => {
      const request = { lessonId, kind, technique: technique || undefined };
      const result = await (external ? generateExternalAiAction(request) : generateAiContentAction({ courseId, ...request }));

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
  const quizItem = find("QUIZ");
  const quiz = quizItem ? parseQuiz(quizItem.content) : null;
  const flashcards = find("FLASHCARDS");
  const cards = flashcards ? parseFlashcards(flashcards.content) : null;
  const label = (id: string) => SUMMARY_TECHNIQUES.find((item) => item.id === id)?.label ?? id;
  const hasContent = (kind: AiItem["kind"]) => items.some((item) => item.kind === kind);
  const available = (kind: AiItem["kind"]) => aiEnabled || hasContent(kind);
  // Botao de um conteudo ja gerado: cor diferente e marca, para o aluno saber que ha algo para abrir.
  const toolClass = (kind: AiItem["kind"]) => (hasContent(kind) ? readyClass : buttonClass);
  const toolTitle = (kind: AiItem["kind"]) => (hasContent(kind) ? "Conteudo ja gerado: clique para abrir" : undefined);

  return (
    <section className="mt-6 rounded-md border border-stroke-subtle bg-surface p-4" id="estudo-ia">
      <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-copy-muted">Estudar com inteligencia artificial</h2>
      {aiEnabled || items.length > 0 ? null : (
        <p className="mt-2 text-sm text-copy-secondary">A IA ainda nao foi configurada pelo administrador.</p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <button className={toolClass("SUMMARY")} disabled={!available("SUMMARY") || techniques.length === 0} onClick={() => open("summary")} title={toolTitle("SUMMARY")} type="button">
          {hasContent("SUMMARY") ? "✓ " : ""}Resumo da aula
        </button>
        <button className={toolClass("FLASHCARDS")} disabled={!available("FLASHCARDS")} onClick={() => open("flashcards")} title={toolTitle("FLASHCARDS")} type="button">
          {hasContent("FLASHCARDS") ? "✓ " : ""}Flashcards
        </button>
        <button className={toolClass("MINDMAP")} disabled={!available("MINDMAP") || techniques.length === 0} onClick={() => open("mindmap")} title={toolTitle("MINDMAP")} type="button">
          {hasContent("MINDMAP") ? "✓ " : ""}Mapa mental
        </button>
        <button className={toolClass("QUIZ")} disabled={!available("QUIZ")} onClick={() => open("quiz")} title={toolTitle("QUIZ")} type="button">
          {hasContent("QUIZ") ? "✓ " : ""}Quiz
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

                  const technique = getTechnique(id);

                  return (
                    <span className="group relative" key={id}>
                      <button
                        aria-describedby={`tip-${id}`}
                        aria-pressed={selected === id}
                        className={selected === id ? primaryClass : buttonClass}
                        disabled={pending || (!done && !aiEnabled)}
                        onClick={() => (done ? (setError(null), setSelected(id)) : generate("SUMMARY", id))}
                        type="button"
                      >
                        {label(id)}
                        {done ? " (pronto)" : ""}
                      </button>
                      <span
                        className="pointer-events-none invisible absolute left-0 top-full z-10 mt-1 w-64 rounded-md border border-stroke-subtle bg-surface-elevated p-3 text-xs leading-5 text-copy-secondary opacity-0 shadow-lg transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100"
                        id={`tip-${id}`}
                        role="tooltip"
                      >
                        <strong className="block text-copy-primary">{technique.label}</strong>
                        {technique.description}
                        <span className="mt-1 block">{technique.how}</span>
                      </span>
                    </span>
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
                {external ? null : (
                  <a className={primaryClass} href={`${pdfBase}/summary?technique=${selected}`}>
                    Baixar PDF
                  </a>
                )}
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
              <Deck cards={cards} courseId={courseId} external={external} lessonId={lessonId} />
              {external ? null : (
                <div className="mt-4">
                  <a className={buttonClass} href={`${pdfBase}/flashcards`}>
                    Baixar PDF
                  </a>
                </div>
              )}
            </>
          ) : !pending ? (
            <button className={primaryClass} disabled={!aiEnabled} onClick={() => generate("FLASHCARDS")} type="button">
              Gerar flashcards
            </button>
          ) : null}
        </Modal>
      ) : null}

      {panel === "quiz" ? (
        <Modal onClose={() => setPanel(null)} title="Quiz da aula">
          {pending ? <p className="text-sm text-copy-secondary">Gerando o quiz... pode levar alguns segundos.</p> : null}
          {error ? <p className="mb-3 text-sm text-destructive">{error}</p> : null}
          {quiz ? (
            <QuizPanel attempts={quizAttempts} quiz={quiz} submit={(answers) => (external ? submitExternalQuizAction({ lessonId, answers }) : submitQuizAction({ courseId, lessonId, answers }))} />
          ) : !pending ? (
            <>
              <p className="mb-3 text-sm text-copy-secondary">
                O quiz e gerado uma unica vez e fica salvo.
              </p>
              <button className={primaryClass} disabled={!aiEnabled} onClick={() => generate("QUIZ")} type="button">
                Gerar quiz
              </button>
            </>
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
              {external ? null : (
                <div className="mt-4">
                  <a className={primaryClass} href={`${pdfBase}/mindmap?technique=${selected}`}>
                    Baixar PDF
                  </a>
                </div>
              )}
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
