"use client";

import { useState, useTransition } from "react";

import { primaryClass } from "@/components/student/study-modal";
import { askQuestionAction } from "@/server/actions/question-actions";
import type { LessonQuestionItem } from "@/server/services/question-service";

type LessonQuestionsProps = { courseId: string; lessonId: string; initial: LessonQuestionItem[] };

const date = (iso: string) => new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(iso));

export function LessonQuestions({ courseId, lessonId, initial }: LessonQuestionsProps) {
  const [items, setItems] = useState(initial);
  const [body, setBody] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function send() {
    setMessage(null);
    startTransition(async () => {
      const result = await askQuestionAction({ courseId, lessonId, body });

      if (!result.ok) {
        setMessage(result.error === "limit" ? "Limite de 10 duvidas por dia atingido." : "Escreva a sua duvida (minimo de 3 letras).");
        return;
      }

      setItems((current) => [{ id: crypto.randomUUID(), body, answer: null, mine: true, createdAt: new Date().toISOString(), answeredAt: null }, ...current]);
      setBody("");
      setMessage("Duvida enviada. Voce sera avisado quando for respondida.");
    });
  }

  return (
    <section className="mt-6 rounded-md border border-stroke-subtle bg-surface p-4" id="duvidas">
      <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-copy-muted">Duvidas da aula</h2>
      <div className="mt-3 grid gap-2">
        <textarea
          aria-label="Sua duvida"
          className="min-h-20 rounded-md border border-stroke-subtle bg-background px-3 py-2 text-sm outline-none"
          maxLength={2000}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Escreva a sua duvida sobre esta aula"
          value={body}
        />
        <div className="flex items-center gap-3">
          <button className={primaryClass} disabled={pending || body.trim().length < 3} onClick={send} type="button">
            Enviar duvida
          </button>
          {message ? (
            <span aria-live="polite" className="text-sm text-copy-secondary">
              {message}
            </span>
          ) : null}
        </div>
      </div>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-copy-secondary">Ainda nao ha duvidas respondidas nesta aula.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((item) => (
            <li className="rounded-md border border-stroke-subtle bg-background p-3" key={item.id}>
              <p className="text-sm text-copy-primary">
                {item.mine ? <span className="mr-2 text-xs font-semibold text-brand-primary">Sua duvida</span> : null}
                {item.body}
              </p>
              <p className="mt-1 text-xs text-copy-muted">{date(item.createdAt)}</p>
              {item.answer ? (
                <p className="mt-2 border-l-2 border-brand-primary pl-3 text-sm text-copy-secondary">{item.answer}</p>
              ) : (
                <p className="mt-2 text-xs text-copy-muted">Aguardando resposta do professor.</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
