import Link from "next/link";
import { Search } from "lucide-react";

import { EmptyState } from "@/components/student/empty-state";
import { MarkdownContent } from "@/components/student/markdown-content";
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
  const selectedCourseId = notebook.selectedCourseId;

  return (
    <section>
      <div className="mb-8">
        <p className="text-sm font-medium text-primary">Anotacoes</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal md:text-4xl">Meus cadernos</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Consulte suas anotacoes agrupadas por curso, modulo e aula.
        </p>
      </div>

      <form className="mb-6 grid gap-3 rounded-md border bg-card p-4 shadow-sm md:grid-cols-[1fr_1fr_auto]">
        <label className="grid gap-2 text-sm font-medium">
          Curso
          <select
            className="min-h-11 rounded-md border px-3 text-sm outline-none"
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

      {notebook.groups.length === 0 || !selectedCourseId ? (
        <EmptyState
          description="Crie anotacoes nas aulas deste curso para montar seu caderno automaticamente."
          title="Nenhuma anotacao encontrada"
        />
      ) : (
        <section className="rounded-md border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-normal">Caderno do curso</h2>
            <Link
              className="text-sm text-muted-foreground transition hover:text-foreground"
              href={`/app/courses/${selectedCourseId}`}
            >
              Ver aulas
            </Link>
          </div>
          <div className="rounded-md border bg-background p-5">
            <MarkdownContent content={buildNotebookMarkdown(notebook.groups)} />
          </div>
        </section>
      )}
    </section>
  );
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

type NotebookGroup = Awaited<ReturnType<typeof getStudentNotebook>>["groups"][number];

function buildNotebookMarkdown(groups: NotebookGroup[]) {
  return groups
    .flatMap((group) => {
      const moduleHeader = `## Modulo ${group.modulePosition}: ${group.moduleTitle}`;
      const notes = group.notes.map(
        (note) =>
          `### ${note.lessonPosition}. ${note.lessonTitle}\n\n${note.content}\n\nAtualizado em ${new Intl.DateTimeFormat(
            "pt-BR",
          ).format(note.updatedAt)}`,
      );

      return [moduleHeader, ...notes];
    })
    .join("\n\n");
}
