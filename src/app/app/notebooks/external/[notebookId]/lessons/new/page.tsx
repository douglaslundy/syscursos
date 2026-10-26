import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";

import { ExternalLessonForm } from "@/components/student/external-notebook-forms";
import { getExternalNotebook } from "@/server/services/external-notebook-service";

export default async function NewExternalLessonPage(props: { params: Promise<{ notebookId: string }> }) {
  const { notebookId } = await props.params;

  if (!z.string().uuid().safeParse(notebookId).success) notFound();

  const notebook = await getExternalNotebook(notebookId);

  if (!notebook) notFound();

  return (
    <section>
      <Link className="text-sm text-muted-foreground transition hover:text-foreground" href={`/app/notebooks/external/${notebook.id}`}>
        Voltar a {notebook.title}
      </Link>
      <h1 className="mb-6 mt-2 break-words text-2xl font-semibold tracking-normal md:text-3xl">Nova aula</h1>
      <ExternalLessonForm notebookId={notebook.id} />
    </section>
  );
}
