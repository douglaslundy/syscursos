import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";

import { DeleteLessonButton } from "@/components/student/external-notebook-forms";
import { LessonStudyTools } from "@/components/student/lesson-study-tools";
import { MarkdownContent } from "@/components/student/markdown-content";
import { getAiAvailability } from "@/server/services/ai/ai-content-service";
import { getExternalLesson } from "@/server/services/external-notebook-service";

export default async function ExternalLessonPage(props: { params: Promise<{ notebookId: string; lessonId: string }> }) {
  const { notebookId, lessonId } = await props.params;

  if (!z.string().uuid().safeParse(lessonId).success) notFound();

  const [data, ai] = await Promise.all([getExternalLesson(lessonId), getAiAvailability()]);

  // O caderno da URL precisa ser o da aula: evita abrir a aula por um caderno que nao e dela.
  if (!data || data.lesson.notebook.id !== notebookId) notFound();

  const { lesson, items } = data;
  const base = `/app/notebooks/external/${notebookId}`;

  return (
    <section>
      <Link className="text-sm text-muted-foreground transition hover:text-foreground" href={base}>
        Voltar a {lesson.notebook.title}
      </Link>
      <h1 className="mt-2 break-words text-2xl font-semibold tracking-normal md:text-3xl">{lesson.title}</h1>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link className="inline-flex min-h-10 items-center rounded-md border px-4 text-sm font-medium transition hover:bg-card" href={`${base}/lessons/${lesson.id}/edit`}>
          Editar aula
        </Link>
        <DeleteLessonButton lessonId={lesson.id} notebookId={notebookId} />
      </div>
      <LessonStudyTools aiEnabled={ai.enabled} courseId="" external initialItems={items} lessonId={lesson.id} quizAttempts={[]} techniques={ai.techniques} />
      {lesson.summary ? (
        <div className="mt-6 rounded-md border bg-card p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">Resumo gravado</h2>
          <div className="break-words">
            <MarkdownContent content={lesson.summary} />
          </div>
        </div>
      ) : null}
      {lesson.transcript ? (
        <div className="mt-6 rounded-md border bg-card p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">Transcricao</h2>
          <p className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground">{lesson.transcript}</p>
        </div>
      ) : null}
    </section>
  );
}
