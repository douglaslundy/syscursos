import Link from "next/link";

import { EmptyState } from "@/components/student/empty-state";
import { createPlaylistAction } from "@/server/actions/playlist-actions";
import { listPlaylists } from "@/server/services/playlist-service";

type PlaylistsPageProps = { searchParams?: Record<string, string | string[] | undefined> };

const statusText: Record<string, string> = {
  invalid: "Informe um nome para a playlist.",
  limit: "Voce atingiu o limite de 30 playlists.",
};

export default async function PlaylistsPage(props: { searchParams: Promise<PlaylistsPageProps["searchParams"]> }) {
  const searchParams = await props.searchParams;
  const playlists = await listPlaylists();
  const status = typeof searchParams?.status === "string" ? statusText[searchParams.status] : undefined;

  return (
    <section>
      <div className="mb-8">
        <p className="text-sm font-medium text-primary">Trilhas</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal md:text-4xl">Minhas playlists</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Junte aulas de cursos diferentes em uma ordem sua. Para adicionar, abra uma aula e escolha a playlist.
        </p>
      </div>
      <form action={createPlaylistAction} className="mb-6 flex gap-3">
        <input aria-label="Nome da playlist" className="min-h-11 flex-1 rounded-md border px-3 text-sm outline-none" maxLength={120} name="name" placeholder="Nome da nova playlist" required />
        <button className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground" type="submit">
          Criar
        </button>
      </form>
      {status ? <p className="mb-4 text-sm text-destructive">{status}</p> : null}
      {playlists.length === 0 ? (
        <EmptyState description="Crie a primeira playlist para organizar suas aulas." title="Nenhuma playlist ainda" />
      ) : (
        <ul className="grid gap-3">
          {playlists.map((playlist) => (
            <li key={playlist.id}>
              <Link className="block rounded-md border border-stroke-subtle bg-surface p-4 transition hover:bg-surface-hover" href={`/app/playlists/${playlist.id}`}>
                <p className="text-sm font-semibold text-copy-primary">{playlist.name}</p>
                <p className="text-xs text-copy-secondary">{playlist.items} aulas</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
