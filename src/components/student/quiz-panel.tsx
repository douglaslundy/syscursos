"use client";

import { useEffect, useState, useTransition } from "react";

import type { Quiz } from "@/lib/ai/quiz";
import { buttonClass, primaryClass } from "@/components/student/study-modal";
import { submitQuizAction } from "@/server/actions/study-actions";
import type { QuizResult } from "@/server/services/quiz-service";

type QuizPanelProps = {
  courseId: string;
  lessonId: string;
  quiz: Quiz;
  attempts: Array<{ score: number; total: number; createdAt: string }>;
};

const errorText = {
  forbidden: "Voce nao tem acesso a esta aula.",
  no_quiz: "O quiz desta aula ainda nao foi gerado.",
  invalid: "Responda com as alternativas disponiveis e tente de novo.",
} as const;

const letter = (index: number) => String.fromCharCode(65 + index);

export function QuizPanel({ courseId, lessonId, quiz, attempts: initialAttempts }: QuizPanelProps) {
  const [answers, setAnswers] = useState<Array<number | null>>(() => quiz.questions.map(() => null));
  const [result, setResult] = useState<QuizResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(initialAttempts);
  const [pending, startTransition] = useTransition();
  const answered = answers.filter((value) => value !== null).length;
  const best = attempts.reduce((max, attempt) => Math.max(max, attempt.score / attempt.total), 0);

  // Teclas 1-4 respondem a primeira questao ainda em branco.
  useEffect(() => {
    if (result) return undefined;

    const onKey = (event: KeyboardEvent) => {
      const option = Number(event.key) - 1;
      const target = event.target as HTMLElement | null;

      if (option < 0 || option > 3 || target?.closest("input, textarea, select")) return;

      setAnswers((current) => {
        const index = current.findIndex((value) => value === null);

        return index === -1 ? current : current.map((value, position) => (position === index ? option : value));
      });
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [result]);

  function submit() {
    setError(null);
    startTransition(async () => {
      const response = await submitQuizAction({ courseId, lessonId, answers });

      if (!response.ok) {
        setError(errorText[response.error]);
        return;
      }

      setResult(response);
      setAttempts((current) => [{ score: response.score, total: response.total, createdAt: new Date().toISOString() }, ...current].slice(0, 5));
    });
  }

  function restart() {
    setAnswers(quiz.questions.map(() => null));
    setResult(null);
  }

  return (
    <div className="max-h-[65vh] space-y-4 overflow-y-auto pr-1">
      {result ? (
        <p className="rounded-md border border-stroke-subtle bg-background p-3 text-base font-semibold text-copy-primary" role="status">
          Voce acertou {result.score} de {result.total} ({Math.round((result.score / result.total) * 100)}%).
          {result.score < result.total ? " As questoes erradas foram para a sua revisao do dia." : " Excelente!"}
        </p>
      ) : (
        <p className="text-xs text-copy-muted">
          {answered} de {quiz.questions.length} respondidas. Dica: as teclas 1 a 4 respondem a proxima questao.
          {attempts.length > 0 ? ` Melhor nota: ${Math.round(best * 100)}%.` : ""}
        </p>
      )}

      {quiz.questions.map((question, index) => {
        const outcome = result?.results[index];

        return (
          <fieldset className="rounded-md border border-stroke-subtle bg-background p-4" key={index}>
            <legend className="px-1 text-sm font-semibold text-copy-primary">
              {index + 1}. {question.q}
            </legend>
            <div className="mt-2 space-y-2">
              {question.options.map((option, position) => {
                const chosen = answers[index] === position;
                const isAnswer = outcome && position === outcome.answer;
                const isWrongChoice = outcome && chosen && !outcome.correct;

                return (
                  <label
                    className={`flex cursor-pointer items-start gap-2 rounded-md border px-3 py-2 text-sm ${
                      isAnswer ? "border-green-500 text-copy-primary" : isWrongChoice ? "border-red-500 text-copy-primary" : "border-stroke-subtle text-copy-secondary"
                    }`}
                    key={position}
                  >
                    <input
                      checked={chosen}
                      disabled={Boolean(result)}
                      name={`q-${index}`}
                      onChange={() => setAnswers((current) => current.map((value, i) => (i === index ? position : value)))}
                      type="radio"
                    />
                    <span>
                      <strong>{letter(position)}.</strong> {option}
                    </span>
                  </label>
                );
              })}
            </div>
            {outcome ? (
              <p className="mt-2 text-xs leading-5 text-copy-secondary">
                {outcome.correct ? "Correto. " : `Resposta certa: ${letter(outcome.answer)}. `}
                {outcome.explanation}
              </p>
            ) : null}
          </fieldset>
        );
      })}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        {result ? (
          <button className={primaryClass} onClick={restart} type="button">
            Refazer o quiz
          </button>
        ) : (
          <button className={primaryClass} disabled={pending || answered === 0} onClick={submit} type="button">
            {pending ? "Corrigindo..." : "Corrigir"}
          </button>
        )}
        {result ? null : (
          <button className={buttonClass} disabled={answered === 0} onClick={restart} type="button">
            Limpar respostas
          </button>
        )}
      </div>
    </div>
  );
}
