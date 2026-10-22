"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { QuizPanel } from "@/components/student/quiz-panel";
import { Modal, buttonClass, primaryClass } from "@/components/student/study-modal";
import type { Quiz } from "@/lib/ai/quiz";
import { DEFAULT_QUIZ_QUESTIONS } from "@/lib/study/quiz-pick";
import { refreshCourseQuizAction, startCourseQuizAction, submitCourseQuizAction } from "@/server/actions/quiz-actions";
import type { QuizRef } from "@/server/services/course-quiz-service";

type CourseQuizProps = { courseId: string; courseTitle: string; questions: number };

type Session = { quiz: Quiz; refs: QuizRef[]; id: number };

export function CourseQuiz({ courseId, courseTitle, questions }: CourseQuizProps) {
  const router = useRouter();
  const [asking, setAsking] = useState(false);
  const [count, setCount] = useState(Math.min(DEFAULT_QUIZ_QUESTIONS, questions));
  const [session, setSession] = useState<Session | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function start(total: number) {
    setMessage(null);
    startTransition(async () => {
      const result = await startCourseQuizAction({ courseId, count: total });

      if (!result.ok) {
        setMessage(result.error === "forbidden" ? "Voce nao tem acesso a este curso." : "Este curso ainda nao tem quiz gerado.");
        return;
      }

      setAsking(false);
      setSession({ quiz: result.quiz, refs: result.refs, id: Date.now() });
    });
  }

  function refresh() {
    setMessage(null);
    startTransition(async () => {
      await refreshCourseQuizAction(courseId);
      router.refresh();
      setMessage("Lista atualizada com os quizzes gerados por todos os alunos.");
    });
  }

  function closeSession() {
    setSession(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button className={primaryClass} disabled={pending || questions === 0} onClick={() => setAsking((value) => !value)} type="button">
          Responder quiz
        </button>
        <button className={buttonClass} disabled={pending || questions === 0} onClick={() => start(questions)} type="button">
          Refazer todas ({questions})
        </button>
        <button className={buttonClass} disabled={pending} onClick={refresh} type="button">
          {pending ? "Atualizando..." : "Atualizar"}
        </button>
        <a className={buttonClass} href={`/app/export/${courseId}?format=anki`}>
          Exportar para Anki
        </a>
      </div>

      {asking ? (
        <form
          className="flex flex-wrap items-end gap-3 rounded-md border border-stroke-subtle bg-surface p-4"
          onSubmit={(event) => {
            event.preventDefault();
            start(count);
          }}
        >
          <label className="grid gap-1 text-sm text-copy-secondary">
            Quantas perguntas quer responder? (1 a {questions})
            <input
              className="min-h-10 w-32 rounded-md border border-stroke-subtle bg-background px-3 text-sm text-copy-primary outline-none"
              max={questions}
              min={1}
              onChange={(event) => setCount(Math.max(1, Math.min(questions, Number(event.target.value) || 1)))}
              type="number"
              value={count}
            />
          </label>
          <button className={primaryClass} disabled={pending} type="submit">
            {pending ? "Preparando..." : "Responder"}
          </button>
        </form>
      ) : null}

      {message ? (
        <p aria-live="polite" className="text-sm text-copy-secondary">
          {message}
        </p>
      ) : null}

      {session ? (
        <Modal onClose={closeSession} title={`Quiz - ${courseTitle}`}>
          <QuizPanel
            attempts={[]}
            key={session.id}
            quiz={session.quiz}
            submit={(answers) => submitCourseQuizAction({ courseId, refs: session.refs, answers })}
          />
        </Modal>
      ) : null}
    </div>
  );
}
