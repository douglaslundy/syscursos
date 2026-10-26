import Link from "next/link";
import { Search } from "lucide-react";

import { EmptyState } from "@/components/student/empty-state";
import { MarkdownContent } from "@/components/student/markdown-content";
import { getStudentNotebook } from "@/server/services/student-service";
import { notebookQuerySchema } from "@/server/validators/student";
import { formatDateTimeBr } from "@/lib/format-date";

type NotebooksPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function NotebooksPage(props: { searchParams: Promise<NotebooksPageProps["searchParams"]> }) {
  const searchParams = await props.searchParams;
  const parsed = notebookQuerySchema.parse({
    courseId: first(searchParams?.courseId),
    query: first(searchParams?.query),
  });
  const notebook = await getStudentNotebook(parsed);

  return (
    <section>
      <div className="mb-8">
        <p className="text-sm font-medium text-primary">Anotacoes</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal md:text-4xl">Meus cadernos</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Consulte suas anotacoes agrupadas por curso, modulo e aula.
        </p>
      </div>

      <Link className="mb-6 inline-flex min-h-11 items-center rounded-md border px-4 text-sm font-medium transition hover:bg-card" href="/app/notebooks/external">
        Cadernos de cursos externos
      </Link>

      <form className="mb-6 grid gap-3 rounded-md border bg-card p-4 shadow-sm md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
        <label className="grid gap-2 text-sm font-medium">
          Curso
          <select
            className="min-h-11 rounded-md border px-3 text-sm outline-none"
            defaultValue={notebook.selectedCourseId ?? ""}
            name="courseId"
          >
            <option value="">Todos os cursos</option>
            {notebook.courseOptions.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Buscar
          <span className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
            <input
              className="min-h-11 w-full rounded-md border pl-9 pr-3 text-sm outline-none"
              defaultValue={notebook.query}
              name="query"
              placeholder="Buscar nas anotacoes"
            />
          </span>
        </label>
        <button
          className="min-h-11 self-end rounded-md bg-brand-primary px-4 text-sm font-medium text-copy-primary transition hover:bg-brand-primaryHover"
          type="submit"
        >
          Buscar
        </button>
      </form>

      {notebook.courses.length === 0 ? (
        <EmptyState
          description={
            notebook.query
              ? "Nenhuma anotacao contem esse termo. Tente outra palavra ou escolha Todos os cursos."
              : "Crie anotacoes nas aulas para montar seu caderno automaticamente."
          }
          title="Nenhuma anotacao encontrada"
        />
      ) : (
        <div className="grid gap-5">
          {notebook.courses.map((course) => (
            <section className="rounded-md border bg-card p-5 shadow-sm" key={course.courseId}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold tracking-normal">{course.courseTitle}</h2>
                <Link
                  className="text-sm text-muted-foreground transition hover:text-foreground"
                  href={`/app/courses/${course.courseId}`}
                >
                  Ver aulas
                </Link>
              </div>
              <div className="rounded-md border bg-background p-5">
                <MarkdownContent content={buildNotebookMarkdown(course.groups)} />
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

type NotebookGroup = Awaited<ReturnType<typeof getStudentNotebook>>["courses"][number]["groups"][number];

function buildNotebookMarkdown(groups: NotebookGroup[]) {
  return groups
    .flatMap((group) => {
      const moduleHeader = `## Modulo ${group.modulePosition}: ${group.moduleTitle}`;
      const notes = group.notes.map(
        (note) =>
          `### ${note.lessonPosition}. ${note.lessonTitle}\n\n${note.content}\n\nAtualizado em ${formatDateTimeBr(note.updatedAt).slice(0, 10)}`,
      );

      return [moduleHeader, ...notes];
    })
    .join("\n\n");
}
