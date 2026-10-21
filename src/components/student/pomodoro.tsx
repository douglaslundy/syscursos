"use client";

import { useEffect, useState } from "react";

import { buttonClass } from "@/components/student/study-modal";
import { clock } from "@/lib/transcription/format";

const FOCUS_SECONDS = 25 * 60;
const BREAK_SECONDS = 5 * 60;

type Phase = "idle" | "focus" | "break";

// Pomodoro simples (25 min de foco, 5 de pausa). Roda so no navegador; nada e salvo.
export function Pomodoro() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [left, setLeft] = useState(FOCUS_SECONDS);
  const [rounds, setRounds] = useState(0);

  useEffect(() => {
    if (phase === "idle") return undefined;

    const timer = setInterval(() => setLeft((value) => Math.max(0, value - 1)), 1000);

    return () => clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (phase === "idle" || left > 0) return;

    if (phase === "focus") {
      setRounds((value) => value + 1);
      setPhase("break");
      setLeft(BREAK_SECONDS);
    } else {
      setPhase("focus");
      setLeft(FOCUS_SECONDS);
    }
  }, [left, phase]);

  if (phase === "idle") {
    return (
      <button
        className={buttonClass}
        onClick={() => {
          setPhase("focus");
          setLeft(FOCUS_SECONDS);
        }}
        type="button"
      >
        Pomodoro
      </button>
    );
  }

  return (
    <div aria-live="polite" className="flex items-center gap-2 rounded-md border border-stroke-subtle px-3 py-1.5 text-sm text-copy-primary">
      <span>
        {phase === "focus" ? "Foco" : "Pausa: levante e respire"} {clock(left)}
      </span>
      {rounds > 0 ? <span className="text-xs text-copy-muted">({rounds} ciclos)</span> : null}
      <button className="text-xs text-copy-secondary underline" onClick={() => setPhase("idle")} type="button">
        Parar
      </button>
    </div>
  );
}
