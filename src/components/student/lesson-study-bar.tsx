"use client";

import { type ReactNode, useEffect, useState } from "react";

import { Pomodoro } from "@/components/student/pomodoro";
import { PLAYER_READY_EVENT, getPlayer } from "@/lib/study/player-bridge";
import { PLAYBACK_RATES } from "@/lib/study/playback";
import { RECORDER_EVENT, getRecorder } from "@/lib/study/recorder-bridge";
import { recordStudyTimeAction, savePlaybackRateAction, savePositionAction } from "@/server/actions/study-actions";

const BEAT_MS = 30_000;
const POSITION_MS = 15_000;
type LessonStudyBarProps = {
  courseId: string;
  lessonId: string;
  focus: boolean;
  onToggleFocus: () => void;
  initialRate: number;
  children?: ReactNode;
};

// Barra de estudo da aula: tempo estudado (sequencia e metas), posicao do video, velocidade, modo foco e Pomodoro.
export function LessonStudyBar({ courseId, lessonId, focus, onToggleFocus, initialRate, children }: LessonStudyBarProps) {
  const [hasPlayer, setHasPlayer] = useState(false);
  const [canRecord, setCanRecord] = useState(false);
  const [rate, setRate] = useState(initialRate);

  useEffect(() => {
    const update = () => setHasPlayer(getPlayer() !== null);

    update();
    window.addEventListener(PLAYER_READY_EVENT, update);
    return () => window.removeEventListener(PLAYER_READY_EVENT, update);
  }, []);

  // Aplica a velocidade padrao do aluno assim que o player do YouTube fica pronto.
  useEffect(() => {
    if (hasPlayer) getPlayer()?.setRate(rate);
    // So quando o player aparece; mudancas manuais passam por changeRate.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPlayer]);

  // O gravador da transcricao se registra quando pode comecar.
  useEffect(() => {
    const update = () => setCanRecord(getRecorder() !== null);

    update();
    window.addEventListener(RECORDER_EVENT, update);
    return () => window.removeEventListener(RECORDER_EVENT, update);
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
    // Vira o padrao de todas as aulas; falha de rede nao atrapalha a aula.
    void savePlaybackRateAction(value).catch(() => null);
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
            {PLAYBACK_RATES.map((item) => (
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
      {children}
      {canRecord ? (
        <button
          className="inline-flex min-h-10 items-center justify-center rounded-md border border-stroke-subtle px-4 text-sm font-medium text-copy-secondary transition hover:bg-surface-hover hover:text-copy-primary"
          onClick={() => getRecorder()?.()}
          type="button"
        >
          Transcrever gravando o audio
        </button>
      ) : null}
    </div>
  );
}
