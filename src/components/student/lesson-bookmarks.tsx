"use client";

import { useEffect, useState, useTransition } from "react";

import { buttonClass, primaryClass } from "@/components/student/study-modal";
import { PLAYER_READY_EVENT, getPlayer, parseClock, seekTo } from "@/lib/study/player-bridge";
import { clock } from "@/lib/transcription/format";
import { addBookmarkAction, removeBookmarkAction } from "@/server/actions/study-actions";
import type { BookmarkItem } from "@/server/services/bookmark-service";

type LessonBookmarksProps = { courseId: string; lessonId: string; initial: BookmarkItem[] };

export function LessonBookmarks({ courseId, lessonId, initial }: LessonBookmarksProps) {
  const [items, setItems] = useState(initial);
  const [label, setLabel] = useState("");
  const [manual, setManual] = useState("");
  const [canRead, setCanRead] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const update = () => setCanRead(getPlayer() !== null);

    update();
    window.addEventListener(PLAYER_READY_EVENT, update);
    return () => window.removeEventListener(PLAYER_READY_EVENT, update);
  }, []);

  function add() {
    const seconds = canRead ? Math.floor(getPlayer()?.getTime() ?? 0) : parseClock(manual);

    if (seconds === null) {
      setError("Informe o minuto no formato mm:ss.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await addBookmarkAction({ courseId, lessonId, seconds, label });

      if (!result.ok) {
        setError(result.error === "limit" ? "Limite de marcadores desta aula atingido." : "Escreva um texto para o marcador.");
        return;
      }

      setItems((current) => [...current, result.bookmark].sort((a, b) => a.seconds - b.seconds));
      setLabel("");
      setManual("");
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      if (await removeBookmarkAction(id)) setItems((current) => current.filter((item) => item.id !== id));
    });
  }

  return (
    <section className="mt-6 rounded-md border border-stroke-subtle bg-surface p-4" id="marcadores">
      <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-copy-muted">Marcadores</h2>
      <div className="mt-3 flex flex-wrap items-end gap-2">
        <label className="grid min-w-48 flex-1 gap-1 text-sm">
          <span className="text-copy-secondary">{canRead ? "Marcar o minuto atual do video" : "Texto do marcador"}</span>
          <input
            className="min-h-10 rounded-md border border-stroke-subtle bg-background px-3 text-sm outline-none"
            maxLength={200}
            onChange={(event) => setLabel(event.target.value)}
            placeholder="Ex.: formula importante"
            value={label}
          />
        </label>
        {canRead ? null : (
          <label className="grid w-28 gap-1 text-sm">
            <span className="text-copy-secondary">Minuto</span>
            <input
              className="min-h-10 rounded-md border border-stroke-subtle bg-background px-3 text-sm outline-none"
              onChange={(event) => setManual(event.target.value)}
              placeholder="mm:ss"
              value={manual}
            />
          </label>
        )}
        <button className={primaryClass} disabled={pending || !label.trim()} onClick={add} type="button">
          Adicionar
        </button>
      </div>
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-copy-secondary">Nenhum marcador nesta aula.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((item) => (
            <li className="flex items-center gap-2 text-sm text-copy-secondary" key={item.id}>
              {canRead ? (
                <button className={`${buttonClass} min-h-8 px-2 text-xs`} onClick={() => seekTo(item.seconds)} type="button">
                  {clock(item.seconds)}
                </button>
              ) : (
                <span className="text-xs font-medium text-copy-muted">{clock(item.seconds)}</span>
              )}
              <span className="flex-1">{item.label}</span>
              <button aria-label={`Apagar marcador ${item.label}`} className="text-xs text-destructive underline" disabled={pending} onClick={() => remove(item.id)} type="button">
                Apagar
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
