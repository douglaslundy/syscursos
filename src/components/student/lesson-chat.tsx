"use client";

import { Fragment, useEffect, useState, useTransition } from "react";

import { primaryClass } from "@/components/student/study-modal";
import { PLAYER_READY_EVENT, getPlayer, parseClock, seekTo } from "@/lib/study/player-bridge";
import { askLessonChatAction } from "@/server/actions/ai-actions";
import type { ChatError } from "@/server/services/ai/chat-service";

type Turn = { question: string; answer: string };

const errorText: Record<ChatError, string> = {
  forbidden: "Voce nao tem acesso a esta aula.",
  no_transcript: "Esta aula ainda nao tem transcricao.",
  invalid: "Escreva uma pergunta (minimo de 3 letras).",
  no_provider: "A inteligencia artificial ainda nao foi configurada pelo administrador.",
  rate_limited: "Muitos pedidos seguidos. Aguarde um minuto e tente de novo.",
  daily_limit: "Voce atingiu o limite de 30 perguntas por dia. Volte amanha.",
  invalid_key: "A chave da inteligencia artificial esta invalida. Avise o administrador.",
  quota: "O limite de uso da inteligencia artificial foi atingido. Tente mais tarde.",
  failed: "Nao foi possivel responder agora. Tente novamente.",
};

// Transforma "[05:30]" da resposta em botao que leva o video a esse minuto (so quando o player do YouTube esta ativo).
function Answer({ text, canSeek }: { text: string; canSeek: boolean }) {
  const parts = text.split(/(\[(?:\d+:)?\d{1,2}:\d{2}\])/g);

  return (
    <p className="whitespace-pre-wrap text-sm leading-6 text-copy-secondary">
      {parts.map((part, index) => {
        const seconds = /^\[.*\]$/.test(part) ? parseClock(part.slice(1, -1)) : null;

        return seconds !== null && canSeek ? (
          <button className="mx-0.5 rounded border border-stroke-subtle px-1 text-xs font-medium text-brand-primary hover:bg-surface-hover" key={index} onClick={() => seekTo(seconds)} type="button">
            {part.slice(1, -1)}
          </button>
        ) : (
          <Fragment key={index}>{part}</Fragment>
        );
      })}
    </p>
  );
}

export function LessonChat({ courseId, lessonId, enabled }: { courseId: string; lessonId: string; enabled: boolean }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [question, setQuestion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [canSeek, setCanSeek] = useState(false);

  // Os minutos so viram botao quando o player do YouTube esta ativo.
  useEffect(() => {
    const update = () => setCanSeek(getPlayer() !== null);

    update();
    window.addEventListener(PLAYER_READY_EVENT, update);
    return () => window.removeEventListener(PLAYER_READY_EVENT, update);
  }, []);

  function send() {
    const asked = question.trim();

    setError(null);
    startTransition(async () => {
      const result = await askLessonChatAction({ courseId, lessonId, question: asked });

      if (!result.ok) {
        setError(errorText[result.error]);
        return;
      }

      setTurns((current) => [...current, { question: asked, answer: result.answer }]);
      setQuestion("");
    });
  }

  return (
    <section className="mt-6 rounded-md border border-stroke-subtle bg-surface p-4" id="perguntar">
      <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-copy-muted">Perguntar sobre a aula</h2>
      <p className="mt-1 text-xs text-copy-muted">A IA responde so com o que foi dito na aula e indica o minuto.</p>
      {turns.map((turn, index) => (
        <div className="mt-3 space-y-1 rounded-md border border-stroke-subtle bg-background p-3" key={index}>
          <p className="text-sm font-medium text-copy-primary">{turn.question}</p>
          <Answer canSeek={canSeek} text={turn.answer} />
        </div>
      ))}
      <div className="mt-3 grid gap-2">
        <textarea
          aria-label="Sua pergunta sobre a aula"
          className="min-h-16 rounded-md border border-stroke-subtle bg-background px-3 py-2 text-sm outline-none"
          disabled={!enabled}
          maxLength={500}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder={enabled ? "Ex.: o que foi dito sobre o tema X?" : "A IA ainda nao foi configurada pelo administrador."}
          value={question}
        />
        <div className="flex items-center gap-3">
          <button className={primaryClass} disabled={!enabled || pending || question.trim().length < 3} onClick={send} type="button">
            {pending ? "Pensando..." : "Perguntar"}
          </button>
          {error ? <span className="text-sm text-destructive">{error}</span> : null}
        </div>
      </div>
    </section>
  );
}
