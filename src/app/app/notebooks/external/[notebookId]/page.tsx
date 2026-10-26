import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";

import { EmptyState } from "@/components/student/empty-state";
import { NotebookActions } from "@/components/student/external-notebook-forms";
import { formatDateTimeBr } from "@/lib/format-date";
import { getExternalNotebook } from "@/server/services/external-notebook-service";

export default async function ExternalNotebookPage(props: { params: Promise<{ notebookId: string }> }) {
  const { notebookId } = await props.params;

  if (!z.string().uuid().safeParse(notebookId).success) notFound();

  const notebook = await getExternalNotebook(notebookId);

  if (!notebook) notFound();

  return (
    <section>
      <div className="mb-8">
        <Link className="text-sm text-muted-foreground transition hover:text-foreground" href="/app/notebooks/external">
          Voltar aos cursos externos
        </Link>
        <h1 className="mt-2 break-words text-3xl font-semibold tracking-normal md:text-4xl">{notebook.title}</h1>
        <NotebookActions id={notebook.id} title={notebook.title} />
      </div>
      <Link className="mb-6 inline-flex min-h-11 items-center rounded-md bg-brand-primary px-4 text-sm font-medium text-copy-primary transition hover:bg-brand-primaryHover" href={`/app/notebooks/external/${notebook.id}/lessons/new`}>
        Nova aula
      </Link>
      {notebook.lessons.length === 0 ? (
        <EmptyState description="Grave a primeira aula com titulo e transcricao ou resumo." title="Nenhuma aula neste caderno" />
      ) : (
        <ol className="grid gap-3">
          {notebook.lessons.map((lesson, index) => (
            <li key={lesson.id}>
              <Link className="block rounded-md border bg-card p-4 shadow-sm transition hover:bg-background" href={`/app/notebooks/external/${notebook.id}/lessons/${lesson.id}`}>
                <span className="block break-words font-medium">
                  {index + 1}. {lesson.title}
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">Atualizada em {formatDateTimeBr(lesson.updatedAt)}</span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
