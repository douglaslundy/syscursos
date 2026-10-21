"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { addToPlaylistAction } from "@/server/actions/playlist-actions";

type AddToPlaylistProps = { courseId: string; lessonId: string; playlists: Array<{ id: string; name: string }> };

const messages = { ok: "Aula adicionada.", forbidden: "Nao foi possivel adicionar.", limit: "A playlist atingiu o limite de aulas." } as const;

export function AddToPlaylist({ courseId, lessonId, playlists }: AddToPlaylistProps) {
  const [playlistId, setPlaylistId] = useState(playlists[0]?.id ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (playlists.length === 0) {
    return (
      <Link className="text-sm font-medium text-copy-secondary hover:text-brand-primary" href="/app/playlists">
        Criar uma playlist
      </Link>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select aria-label="Playlist" className="min-h-10 rounded-md border border-stroke-subtle bg-background px-2 text-sm outline-none" onChange={(event) => setPlaylistId(event.target.value)} value={playlistId}>
        {playlists.map((playlist) => (
          <option key={playlist.id} value={playlist.id}>
            {playlist.name}
          </option>
        ))}
      </select>
      <button
        className="inline-flex min-h-10 items-center rounded-md border border-stroke-subtle px-4 text-sm font-medium text-copy-secondary transition hover:bg-surface-hover hover:text-copy-primary disabled:opacity-50"
        disabled={pending}
        onClick={() => startTransition(async () => setMessage(messages[await addToPlaylistAction({ playlistId, courseId, lessonId })]))}
        type="button"
      >
        Adicionar a playlist
      </button>
      {message ? <span aria-live="polite" className="text-sm text-copy-secondary">{message}</span> : null}
    </div>
  );
}
