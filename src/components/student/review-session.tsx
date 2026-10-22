"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { buttonClass, primaryClass } from "@/components/student/study-modal";
import type { ReviewGrade } from "@/lib/study/srs";
import { reviewCardAction } from "@/server/actions/study-actions";
import type { ReviewCard } from "@/server/services/review-service";

const grades: Array<{ grade: ReviewGrade; label: string; key: string }> = [
  { grade: "again", label: "Errei", key: "1" },
  { grade: "hard", label: "Dificil", key: "2" },
  { grade: "good", label: "Bom", key: "3" },
  { grade: "easy", label: "Facil", key: "4" },
];

export function ReviewSession({ cards }: { cards: ReviewCard[] }) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(0);
  const current = cards[index];

  function grade(value: ReviewGrade) {
    if (!current) return;

    // A proxima revisao e agendada no servidor; falha de rede nao trava a sessao.
    void reviewCardAction({ courseId: current.courseId, lessonId: current.lessonId, cardKey: current.cardKey, grade: value }).catch(() => null);
    setDone((count) => count + 1);
    setRevealed(false);
    setIndex((position) => position + 1);
  }

  // Espaco mostra a resposta; 1 a 4 dao a nota.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement | null)?.closest("input, textarea, select, button")) return;

      if (event.key === " " && !revealed) {
        event.preventDefault();
        setRevealed(true);
      }

      const found = grades.find((item) => item.key === event.key);

      if (found && revealed) grade(found.grade);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!current) {
    return (
      <div className="rounded-md border border-stroke-subtle bg-surface p-6 text-center">
        <p className="text-lg font-semibold text-copy-primary">Revisao concluida!</p>
        <p className="mt-2 text-sm text-copy-secondary">Voce revisou {done} cartoes hoje. Volte amanha para os proximos.</p>
        <Link className={`${primaryClass} mt-4`} href="/app/progress">
          Ver meu progresso
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-copy-muted">
        Cartao {index + 1} de {cards.length} {current.isNew ? "(novo)" : "(revisao)"}
      </p>
      <p className="-mt-3 text-xs text-copy-secondary">
        Curso: {current.courseTitle} | Modulo: {current.moduleTitle} | Aula: {current.lessonTitle}
      </p>
      <div className="min-h-44 rounded-md border border-stroke-subtle bg-surface p-5" key={index}>
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
          {grades.map((item) => (
            <button className={item.grade === "good" ? primaryClass : buttonClass} key={item.grade} onClick={() => grade(item.grade)} type="button">
              {item.label} ({item.key})
            </button>
          ))}
        </div>
      ) : (
        <button className={primaryClass} onClick={() => setRevealed(true)} type="button">
          Mostrar resposta (espaco)
        </button>
      )}
    </div>
  );
}
