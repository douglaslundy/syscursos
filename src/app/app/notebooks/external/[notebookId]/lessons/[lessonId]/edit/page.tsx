import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";

import { ExternalLessonForm } from "@/components/student/external-notebook-forms";
import { getExternalLesson } from "@/server/services/external-notebook-service";

export default async function EditExternalLessonPage(props: { params: Promise<{ notebookId: string; lessonId: string }> }) {
  const { notebookId, lessonId } = await props.params;

  if (!z.string().uuid().safeParse(lessonId).success) notFound();

  const data = await getExternalLesson(lessonId);

  if (!data || data.lesson.notebook.id !== notebookId) notFound();

  const { lesson } = data;

  return (
    <section>
      <Link className="text-sm text-muted-foreground transition hover:text-foreground" href={`/app/notebooks/external/${notebookId}/lessons/${lesson.id}`}>
        Voltar a aula
      </Link>
      <h1 className="mb-6 mt-2 text-2xl font-semibold tracking-normal md:text-3xl">Editar aula</h1>
      <ExternalLessonForm lesson={{ id: lesson.id, title: lesson.title, transcript: lesson.transcript, summary: lesson.summary }} notebookId={notebookId} />
    </section>
  );
}
