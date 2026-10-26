import Link from "next/link";

import { EmptyState } from "@/components/student/empty-state";
import { NewNotebookForm } from "@/components/student/external-notebook-forms";
import { formatDateTimeBr } from "@/lib/format-date";
import { listExternalNotebooks } from "@/server/services/external-notebook-service";

export default async function ExternalNotebooksPage() {
  const notebooks = await listExternalNotebooks();

  return (
    <section>
      <div className="mb-8">
        <Link className="text-sm text-muted-foreground transition hover:text-foreground" href="/app/notebooks">
          Voltar aos cadernos
        </Link>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal md:text-4xl">Cursos externos</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Estuda um curso que nao esta na plataforma? Crie um caderno com o nome do curso, grave a transcricao ou o resumo de cada
          aula e use quiz, resumo, flashcards, mapa mental e revisao. Estes cursos nao entram no cronograma.
        </p>
      </div>
      <NewNotebookForm />
      <Link className="mb-6 inline-flex min-h-11 items-center rounded-md border px-4 text-sm font-medium transition hover:bg-card" href="/app/notebooks/external/review">
        Revisao dos cadernos externos
      </Link>
      {notebooks.length === 0 ? (
        <EmptyState description="Crie o primeiro caderno informando o nome do curso." title="Nenhum caderno externo ainda" />
      ) : (
        <ul className="grid gap-3">
          {notebooks.map((notebook) => (
            <li key={notebook.id}>
              <Link className="block rounded-md border bg-card p-4 shadow-sm transition hover:bg-background" href={`/app/notebooks/external/${notebook.id}`}>
                <span className="block break-words font-semibold">{notebook.title}</span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {notebook.lessonCount} {notebook.lessonCount === 1 ? "aula" : "aulas"} | atualizado em {formatDateTimeBr(notebook.updatedAt)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
