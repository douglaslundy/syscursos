import Link from "next/link";

import { Feedback } from "@/components/admin/feedback";
import { Pagination } from "@/components/admin/pagination";
import { SearchForm } from "@/components/admin/search-form";
import { SubmitButton } from "@/components/admin/submit-button";
import { deleteCourseAction, saveCourseAction } from "@/server/actions/admin-actions";
import { getCourses } from "@/server/services/admin-service";
import { getPagination } from "@/server/validators/pagination";

type CoursesPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function CoursesPage({ searchParams }: CoursesPageProps) {
  const pagination = getPagination(searchParams);
  const courses = await getCourses(pagination);
  const status = typeof searchParams?.status === "string" ? searchParams.status : undefined;

  return (
    <section>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-normal">Cursos</h2>
        <p className="text-sm text-muted-foreground">Crie, edite, inative e remova cursos.</p>
      </div>
      <Feedback status={status} />
      <div className="mb-6 rounded-md border bg-background p-4">
        <h3 className="mb-4 font-medium">Novo curso</h3>
        <CourseForm />
      </div>
      <SearchForm query={pagination.query} />
      <div className="space-y-3">
        {courses.items.map((course) => (
          <article className="rounded-md border bg-background p-4" key={course.id}>
            <CourseForm
              course={{
                id: course.id,
                title: course.title,
                slug: course.slug,
                description: course.description ?? "",
                status: course.status,
              }}
            />
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <Link
                className="rounded-md border border-stroke-subtle bg-transparent px-3 py-2 text-copy-secondary transition hover:bg-surface-hover hover:text-copy-primary"
                href={`/admin/courses/${course.id}/modules`}
              >
                Modulos ({course._count.modules})
              </Link>
              <Link
                className="rounded-md border border-stroke-subtle bg-transparent px-3 py-2 text-copy-secondary transition hover:bg-surface-hover hover:text-copy-primary"
                href={`/admin/courses/${course.id}/students`}
              >
                Alunos ({course._count.enrollments})
              </Link>
              <form action={deleteCourseAction}>
                <input name="id" type="hidden" value={course.id} />
                <SubmitButton
                  destructive
                  confirmMessage="Remover este curso e seus dados relacionados?"
                >
                  Remover
                </SubmitButton>
              </form>
            </div>
          </article>
        ))}
      </div>
      <Pagination
        basePath="/admin/courses"
        page={courses.page}
        pageCount={courses.pageCount}
        query={pagination.query}
      />
    </section>
  );
}

type CourseFormProps = {
  course?: {
    id: string;
    title: string;
    slug: string;
    description: string;
    status: string;
  };
};

function CourseForm({ course }: CourseFormProps) {
  return (
    <form action={saveCourseAction} className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
      {course ? <input name="id" type="hidden" value={course.id} /> : null}
      <input
        className="rounded-md border px-3 py-2 text-sm outline-none"
        defaultValue={course?.title}
        name="title"
        placeholder="Titulo"
      />
      <input
        className="rounded-md border px-3 py-2 text-sm outline-none"
        defaultValue={course?.slug}
        name="slug"
        placeholder="slug-do-curso"
      />
      <select
        className="rounded-md border px-3 py-2 text-sm outline-none"
        defaultValue={course?.status ?? "ACTIVE"}
        name="status"
      >
        <option value="ACTIVE">Ativo</option>
        <option value="INACTIVE">Inativo</option>
      </select>
      <textarea
        className="rounded-md border px-3 py-2 text-sm outline-none md:col-span-2"
        defaultValue={course?.description}
        name="description"
        placeholder="Descricao"
      />
      <SubmitButton>{course ? "Salvar" : "Criar"}</SubmitButton>
    </form>
  );
}
