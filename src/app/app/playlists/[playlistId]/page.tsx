import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";

import { SubmitButton } from "@/components/admin/submit-button";
import { EmptyState } from "@/components/student/empty-state";
import { deletePlaylistAction, moveInPlaylistAction, removeFromPlaylistAction } from "@/server/actions/playlist-actions";
import { getPlaylist } from "@/server/services/playlist-service";

const small = "inline-flex min-h-8 items-center rounded-md border border-stroke-subtle px-2 text-xs text-copy-secondary hover:bg-surface-hover";

export default async function PlaylistPage(props: { params: Promise<{ playlistId: string }> }) {
  const { playlistId } = await props.params;
  const id = z.string().uuid().safeParse(playlistId);

  if (!id.success) notFound();

  const playlist = await getPlaylist(id.data);

  if (!playlist) notFound();

  const first = playlist.items[0];

  return (
    <section>
      <Link className="text-sm font-medium text-copy-secondary hover:text-brand-primary" href="/app/playlists">
        Voltar para playlists
      </Link>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold tracking-normal md:text-4xl">{playlist.name}</h1>
        <div className="flex gap-2">
          {first ? (
            <Link className="inline-flex min-h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground" href={`/app/courses/${first.courseId}/lessons/${first.lessonId}`}>
              Comecar
            </Link>
          ) : null}
          <form action={deletePlaylistAction}>
            <input name="id" type="hidden" value={playlist.id} />
            <SubmitButton destructive confirmMessage="Apagar esta playlist? As aulas continuam nos cursos.">
              Apagar playlist
            </SubmitButton>
          </form>
        </div>
      </div>
      {playlist.items.length === 0 ? (
        <div className="mt-6">
          <EmptyState description="Abra uma aula e use 'Adicionar a playlist'." title="Playlist vazia" />
        </div>
      ) : (
        <ol className="mt-6 space-y-2">
          {playlist.items.map((item, index) => (
            <li className="flex items-center gap-3 rounded-md border border-stroke-subtle bg-surface p-3" key={item.id}>
              <span className="w-6 text-center text-xs text-copy-muted">{index + 1}</span>
              <Link className="min-w-0 flex-1" href={`/app/courses/${item.courseId}/lessons/${item.lessonId}`}>
                <p className="truncate text-sm font-medium text-copy-primary">{item.title}</p>
                <p className="truncate text-xs text-copy-secondary">{item.courseTitle}</p>
              </Link>
              <form action={moveInPlaylistAction} className="flex gap-1">
                <input name="itemId" type="hidden" value={item.id} />
                <input name="playlistId" type="hidden" value={playlist.id} />
                <button aria-label="Mover para cima" className={small} disabled={index === 0} name="direction" type="submit" value="up">
                  Subir
                </button>
                <button aria-label="Mover para baixo" className={small} disabled={index === playlist.items.length - 1} name="direction" type="submit" value="down">
                  Descer
                </button>
              </form>
              <form action={removeFromPlaylistAction}>
                <input name="itemId" type="hidden" value={item.id} />
                <input name="playlistId" type="hidden" value={playlist.id} />
                <button aria-label={`Remover ${item.title}`} className={`${small} text-destructive`} type="submit">
                  Remover
                </button>
              </form>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
