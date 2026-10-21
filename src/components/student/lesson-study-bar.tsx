"use client";

import { useEffect, useState } from "react";

import { Pomodoro } from "@/components/student/pomodoro";
import { PLAYER_READY_EVENT, getPlayer } from "@/lib/study/player-bridge";
import { recordStudyTimeAction, savePositionAction } from "@/server/actions/study-actions";

const BEAT_MS = 30_000;
const POSITION_MS = 15_000;
const RATES = [0.75, 1, 1.25, 1.5, 1.75, 2];

type LessonStudyBarProps = { courseId: string; lessonId: string; focus: boolean; onToggleFocus: () => void };

// Barra de estudo da aula: tempo estudado (sequencia e metas), posicao do video, velocidade, modo foco e Pomodoro.
export function LessonStudyBar({ courseId, lessonId, focus, onToggleFocus }: LessonStudyBarProps) {
  const [hasPlayer, setHasPlayer] = useState(false);
  const [rate, setRate] = useState(1);

  useEffect(() => {
    const update = () => setHasPlayer(getPlayer() !== null);

    update();
    window.addEventListener(PLAYER_READY_EVENT, update);
    return () => window.removeEventListener(PLAYER_READY_EVENT, update);
  }, []);

  // Tempo estudado: um batimento a cada 30 s enquanto a aba esta visivel. Falha de rede nao atrapalha a aula.
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void recordStudyTimeAction({ courseId, lessonId, seconds: BEAT_MS / 1000 }).catch(() => null);
    }, BEAT_MS);

    return () => clearInterval(timer);
  }, [courseId, lessonId]);

  // Posicao do video para retomar depois (so quando o player do YouTube esta disponivel e o aluno avancou).
  useEffect(() => {
    let last = 0;
    const timer = setInterval(() => {
      const seconds = Math.floor(getPlayer()?.getTime() ?? 0);

      if (seconds > 10 && seconds !== last) {
        last = seconds;
        void savePositionAction({ courseId, lessonId, seconds }).catch(() => null);
      }
    }, POSITION_MS);

    return () => clearInterval(timer);
  }, [courseId, lessonId]);

  function changeRate(value: number) {
    setRate(value);
    getPlayer()?.setRate(value);
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3">
      {hasPlayer ? (
        <label className="flex items-center gap-2 text-sm text-copy-secondary">
          Velocidade
          <select
            className="min-h-10 rounded-md border border-stroke-subtle bg-background px-2 text-sm outline-none"
            onChange={(event) => changeRate(Number(event.target.value))}
            value={rate}
          >
            {RATES.map((item) => (
              <option key={item} value={item}>
                {item}x
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <button
        aria-pressed={focus}
        className="inline-flex min-h-10 items-center justify-center rounded-md border border-stroke-subtle px-4 text-sm font-medium text-copy-secondary transition hover:bg-surface-hover hover:text-copy-primary"
        onClick={onToggleFocus}
        type="button"
      >
        {focus ? "Sair do modo foco" : "Modo foco"}
      </button>
      <Pomodoro />
    </div>
  );
}
