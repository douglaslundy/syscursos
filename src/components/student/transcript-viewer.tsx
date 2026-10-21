"use client";

import { useEffect, useMemo, useState } from "react";

import { PLAYER_READY_EVENT, getPlayer, seekTo } from "@/lib/study/player-bridge";
import { filterLines, parseTranscriptLines } from "@/lib/study/transcript-lines";

// Aulas longas tem milhares de linhas: mostra aos poucos para nao pesar a pagina.
const PAGE_LINES = 150;

export function TranscriptViewer({ text }: { text: string }) {
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(PAGE_LINES);
  const [canSeek, setCanSeek] = useState(false);
  const lines = useMemo(() => parseTranscriptLines(text), [text]);
  const matches = useMemo(() => filterLines(lines, query), [lines, query]);
  const visible = matches.slice(0, shown);

  // So o YouTube expoe controle de tempo; no Drive a marca fica como texto.
  useEffect(() => {
    const update = () => setCanSeek(getPlayer() !== null);

    update();
    window.addEventListener(PLAYER_READY_EVENT, update);
    return () => window.removeEventListener(PLAYER_READY_EVENT, update);
  }, []);

  return (
    <div className="mt-2">
      <input
        aria-label="Buscar na transcricao"
        className="min-h-10 w-full rounded-md border border-stroke-subtle bg-background px-3 text-sm outline-none"
        onChange={(event) => {
          setQuery(event.target.value);
          setShown(PAGE_LINES);
        }}
        placeholder="Buscar na transcricao"
        type="search"
        value={query}
      />
      {query ? <p className="mt-1 text-xs text-copy-muted">{matches.length} trechos encontrados</p> : null}
      <div className="mt-2 max-h-96 space-y-1 overflow-y-auto text-sm leading-6 text-copy-secondary">
        {visible.map((line) => (
          <p key={line.index}>
            {line.clock && line.seconds !== null ? (
              canSeek ? (
                <button
                  aria-label={`Ir para ${line.clock} no video`}
                  className="mr-2 rounded border border-stroke-subtle px-1.5 text-xs font-medium text-brand-primary hover:bg-surface-hover"
                  onClick={() => seekTo(line.seconds ?? 0)}
                  type="button"
                >
                  {line.clock}
                </button>
              ) : (
                <span className="mr-2 text-xs font-medium text-copy-muted">{line.clock}</span>
              )
            ) : null}
            {line.text}
          </p>
        ))}
        {matches.length > visible.length ? (
          <button className="rounded-md border border-stroke-subtle px-3 py-1.5 text-xs font-medium text-copy-secondary hover:bg-surface-hover" onClick={() => setShown((value) => value + PAGE_LINES)} type="button">
            Mostrar mais ({matches.length - visible.length} restantes)
          </button>
        ) : null}
      </div>
    </div>
  );
}
