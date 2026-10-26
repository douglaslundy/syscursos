"use client";

import { useEffect, useState, useTransition } from "react";

import type { Quiz } from "@/lib/ai/quiz";
import { Modal, buttonClass, primaryClass } from "@/components/student/study-modal";
import type { AnswerReveal, QuizResult, QuizSubmitResult } from "@/server/services/quiz-service";

type QuizPanelProps = {
  quiz: Quiz;
  // Corrige no servidor (quiz da aula ou prova final).
  submit: (answers: Array<number | null>) => Promise<QuizSubmitResult>;
  // Se vier, cada pergunta e conferida ao clicar em Responder (certo/errado + gabarito antes da proxima). Sem ele (prova final), so corrige no envio.
  check?: (index: number, choice: number) => Promise<AnswerReveal | null>;
  passScore?: number;
  attempts: Array<{ score: number; total: number; createdAt: string }>;
};

type Reveal = AnswerReveal | "failed" | null;

const errorText = {
  forbidden: "Voce nao tem acesso a esta aula.",
  no_quiz: "O quiz desta aula ainda nao foi gerado.",
  invalid: "Responda com as alternativas disponiveis e tente de novo.",
} as const;

const letter = (index: number) => String.fromCharCode(65 + index);

// Uma pergunta por vez (como slides); ao enviar, o resultado completo abre em um modal.
export function QuizPanel({ quiz, submit: submitAnswers, check, passScore, attempts: initialAttempts }: QuizPanelProps) {
  const [answers, setAnswers] = useState<Array<number | null>>(() => quiz.questions.map(() => null));
  const [reveals, setReveals] = useState<Reveal[]>(() => quiz.questions.map(() => null));
  const [current, setCurrent] = useState(0);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [resultOpen, setResultOpen] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(initialAttempts);
  const [pending, startTransition] = useTransition();
  const total = quiz.questions.length;
  const answered = answers.filter((value) => value !== null).length;
  const best = attempts.reduce((max, attempt) => Math.max(max, attempt.score / attempt.total), 0);
  const question = quiz.questions[current];
  const isLast = current === total - 1;
  const reveal = reveals[current];
  const locked = reveal !== null;
  // Com conferencia por pergunta, so avanca depois de Responder.
  const canAdvance = !check || locked;

  // Teclas 1-4 respondem a pergunta que esta na tela.
  useEffect(() => {
    if (result || locked) return undefined;

    const onKey = (event: KeyboardEvent) => {
      const option = Number(event.key) - 1;
      const target = event.target as HTMLElement | null;

      if (option < 0 || option > 3 || target?.closest("input, textarea, select")) return;

      setAnswers((values) => values.map((value, position) => (position === current ? option : value)));
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [result, current, locked]);

  function confirmAnswer() {
    const choice = answers[current];

    if (!check || choice === null) return;

    setError(null);
    startTransition(async () => {
      const outcome = await check(current, choice);

      setReveals((values) => values.map((value, position) => (position === current ? (outcome ?? "failed") : value)));
    });
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const response = await submitAnswers(answers);

      if (!response.ok) {
        setError(errorText[response.error]);
        return;
      }

      setResult(response);
      setReviewing(false);
      setResultOpen(true);
      setAttempts((previous) => [{ score: response.score, total: response.total, createdAt: new Date().toISOString() }, ...previous].slice(0, 5));
    });
  }

  function restart() {
    setAnswers(quiz.questions.map(() => null));
    setReveals(quiz.questions.map(() => null));
    setCurrent(0);
    setResult(null);
    setResultOpen(false);
    setReviewing(false);
  }

  const wrong = result
    ? quiz.questions.flatMap((item, index) => {
        const outcome = result.results[index];

        return outcome && !outcome.correct ? [{ item, index, outcome }] : [];
      })
    : [];
  const summary = result
    ? `Voce acertou ${result.score} de ${result.total} (${Math.round((result.score / result.total) * 100)}%).${
        passScore !== undefined
          ? result.score / result.total >= passScore
            ? " Aprovado!"
            : ` Nota minima para aprovacao: ${Math.round(passScore * 100)}%.`
          : result.score < result.total
            ? " As questoes erradas foram para a sua revisao do dia."
            : " Excelente!"
      }`
    : "";

  return (
    <div className="space-y-4">
      {result ? (
        <div className="space-y-3">
          <p className="rounded-md border border-stroke-subtle bg-background p-3 text-base font-semibold text-copy-primary" role="status">
            {summary}
          </p>
          <div className="flex flex-wrap gap-2">
            <button className={primaryClass} onClick={() => setResultOpen(true)} type="button">
              Ver resultado
            </button>
            <button className={buttonClass} onClick={restart} type="button">
              Refazer o quiz
            </button>
          </div>
        </div>
      ) : (
        <>
          <div>
            <p className="text-xs text-copy-muted">
              Pergunta {current + 1} de {total} - {answered} respondidas. Dica: as teclas 1 a 4 respondem.
              {attempts.length > 0 ? ` Melhor nota: ${Math.round(best * 100)}%.` : ""}
            </p>
            <div aria-hidden="true" className="mt-2 flex gap-1">
              {quiz.questions.map((_, index) => (
                <span
                  className={`h-1.5 flex-1 rounded-full ${index === current ? "bg-brand-primary" : answers[index] !== null ? "bg-brand-primary/40" : "bg-stroke-subtle"}`}
                  key={index}
                />
              ))}
            </div>
          </div>

          {question.context ? (
            <p className="whitespace-pre-line rounded-md border border-stroke-subtle bg-surface p-3 text-sm leading-6 text-copy-secondary" key={`ctx-${current}`}>
              {question.context}
            </p>
          ) : null}
          <fieldset className="rounded-md border border-stroke-subtle bg-background p-4" key={current}>
            <legend className="px-1 text-sm font-semibold text-copy-primary">
              {current + 1}. {question.q}
            </legend>
            <div className="mt-2 space-y-2">
              {question.options.map((option, position) => (
                <label
                  className={`flex cursor-pointer items-start gap-2 rounded-md border px-3 py-2 text-sm ${
                    answers[current] === position ? "border-brand-primary text-copy-primary" : "border-stroke-subtle text-copy-secondary"
                  }`}
                  key={position}
                >
                  <input
                    checked={answers[current] === position}
                    disabled={locked}
                    name={`q-${current}`}
                    onChange={() => setAnswers((values) => values.map((value, i) => (i === current ? position : value)))}
                    type="radio"
                  />
                  <span>
                    <strong>{letter(position)}.</strong> {option}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {reveal === "failed" ? <p className="text-sm text-copy-secondary">Nao foi possivel conferir esta pergunta agora. Siga em frente; ela sera corrigida no envio.</p> : null}
          {reveal && reveal !== "failed" ? (
            <div className={`rounded-md border p-3 text-sm ${reveal.correct ? "border-green-500/60" : "border-red-500/60"}`} role="status">
              <p className="font-semibold text-copy-primary">
                {reveal.correct ? "Resposta correta!" : `Resposta incorreta. A correta e ${letter(reveal.answer)}. ${question.options[reveal.answer]}`}
              </p>
              <p className="mt-1 text-xs leading-5 text-copy-secondary">{reveal.explanation}</p>
            </div>
          ) : null}
          {error ?<p className="text-sm text-destructive">{error}</p> : null}
          {isLast && answered < total ? (
            <p className="text-xs text-copy-muted">{total - answered} sem resposta. Elas contam como erradas.</p>
          ) : null}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button aria-label="Pergunta anterior" className={buttonClass} disabled={current === 0} onClick={() => setCurrent((value) => value - 1)} type="button">
              &larr;
            </button>
            {check && !locked ? (
              <button className={primaryClass} disabled={pending || answers[current] === null} onClick={confirmAnswer} type="button">
                {pending ? "Conferindo..." : "Responder"}
              </button>
            ) : isLast ? (
              <button className={primaryClass} disabled={pending || answered === 0} onClick={submit} type="button">
                {pending ? "Enviando..." : "Enviar respostas"}
              </button>
            ) : (
              <button aria-label="Proxima pergunta" className={buttonClass} disabled={!canAdvance} onClick={() => setCurrent((value) => value + 1)} type="button">
                Proxima &rarr;
              </button>
            )}
          </div>
        </>
      )}

      {result && resultOpen ? (
        <Modal onClose={() => setResultOpen(false)} title="Resultado do quiz">
          <div className="max-h-[65vh] space-y-4 overflow-y-auto pr-1">
            <p className="rounded-md border border-stroke-subtle bg-background p-3 text-base font-semibold text-copy-primary" role="status">
              {summary}
            </p>
            <p className="text-sm text-copy-secondary">
              {result.score} {result.score === 1 ? "acerto" : "acertos"} e {result.total - result.score} {result.total - result.score === 1 ? "erro" : "erros"}.
            </p>
            {reviewing ? (
              <ul className="space-y-3">
                {wrong.map(({ item, index, outcome }) => {
                  const chosen = answers[index];

                  return (
                    <li className="rounded-md border border-red-500/60 bg-background p-3 text-sm" key={index}>
                      <p className="font-semibold text-copy-primary">
                        {index + 1}. {item.q}
                      </p>
                      <p className="mt-1 text-copy-secondary">
                        Sua resposta: {chosen === null ? "sem resposta" : `${letter(chosen)}. ${item.options[chosen]}`}
                      </p>
                      <p className="text-copy-primary">
                        Resposta certa: {letter(outcome.answer)}. {item.options[outcome.answer]}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-copy-secondary">{outcome.explanation}</p>
                    </li>
                  );
                })}
              </ul>
            ) : null}
            <div className="flex flex-wrap gap-2">
              {wrong.length > 0 ? (
                <button className={primaryClass} onClick={() => setReviewing((value) => !value)} type="button">
                  {reviewing ? "Ocultar respostas erradas" : "Ver respostas erradas"}
                </button>
              ) : null}
              <button className={buttonClass} onClick={restart} type="button">
                Refazer o quiz
              </button>
              <button className={buttonClass} onClick={() => setResultOpen(false)} type="button">
                Fechar
              </button>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
