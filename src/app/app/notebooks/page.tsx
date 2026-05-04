import Link from "next/link";

import { getStudentNotebook } from "@/server/services/student-service";
import { notebookQuerySchema } from "@/server/validators/student";

type NotebooksPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function NotebooksPage({ searchParams }: NotebooksPageProps) {
  const parsed = notebookQuerySchema.parse({
    courseId: first(searchParams?.courseId),
    query: first(searchParams?.query),
  });
  const notebook = await getStudentNotebook(parsed);

  return (
    <section>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-normal">Meus cadernos</h1>
        <p className="text-sm text-muted-foreground">
          Consulte suas anotacoes agrupadas por modulo e aula.
        </p>
      </div>

      <form className="mb-6 grid gap-3 rounded-md border bg-background p-4 md:grid-cols-[1fr_1fr_auto]">
        <select
          className="rounded-md border px-3 py-2 text-sm"
          defaultValue={notebook.selectedCourseId ?? ""}
          name="courseId"
        >
          {notebook.courseOptions.length === 0 ? <option value="">Nenhum curso</option> : null}
          {notebook.courseOptions.map((course) => (
            <option key={course.id} value={course.id}>
              {course.title}
            </option>
          ))}
        </select>
        <input
          className="rounded-md border px-3 py-2 text-sm"
          defaultValue={notebook.query}
          name="query"
          placeholder="Buscar nas anotacoes"
        />
        <button
          className="rounded-md bg-primary px-4 text-sm text-primary-foreground"
          type="submit"
        >
          Buscar
        </button>
      </form>

      {notebook.groups.length === 0 ? (
        <div className="rounded-md border p-6 text-sm text-muted-foreground">
          Nenhuma anotacao encontrada para este curso.
        </div>
      ) : (
        <div className="space-y-5">
          {notebook.groups.map((group) => (
            <section className="rounded-md border bg-background p-4" key={group.moduleId}>
              <h2 className="font-semibold tracking-normal">
                {group.modulePosition}. {group.moduleTitle}
              </h2>
              <div className="mt-4 space-y-3">
                {group.notes.map((note) => (
                  <article className="rounded-md border p-3" key={note.id}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Link
                        className="font-medium hover:text-primary"
                        href={`/app/courses/${notebook.selectedCourseId}/lessons/${note.lessonId}`}
                      >
                        {note.lessonPosition}. {note.lessonTitle}
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        {new Intl.DateTimeFormat("pt-BR").format(note.updatedAt)}
                      </span>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
                      {note.content}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
