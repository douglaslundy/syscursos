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
  const editId = getStringParam(searchParams, "editId");
  const editingCourse = courses.items.find((course) => course.id === editId);

  return (
    <section>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-normal">Cursos</h2>
        <p className="text-sm text-muted-foreground">Crie, edite, inative e remova cursos.</p>
      </div>
      <Feedback status={status} />
      <div className="mb-6 rounded-md border bg-background p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-medium">{editingCourse ? "Editar curso" : "Novo curso"}</h3>
          {editingCourse ? (
            <Link className="text-sm text-muted-foreground hover:text-foreground" href="/admin/courses">
              Cancelar edicao
            </Link>
          ) : null}
        </div>
        <CourseForm
          course={
            editingCourse
              ? {
                  id: editingCourse.id,
                  title: editingCourse.title,
                  slug: editingCourse.slug,
                  description: editingCourse.description ?? "",
                  coverImageUrl: editingCourse.coverImageUrl ?? "",
                  status: editingCourse.status,
                }
              : undefined
          }
        />
      </div>
      <SearchForm query={pagination.query} />
      <div className="space-y-3">
        {courses.items.map((course) => (
          <article className="rounded-md border bg-background p-4" key={course.id}>
            <div className="grid gap-2 md:grid-cols-[1.4fr_1fr_120px]">
              <div>
                <div className="text-xs text-muted-foreground">Titulo</div>
                <div className="font-medium">{course.title}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Slug</div>
                <div className="text-sm text-muted-foreground">{course.slug}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Status</div>
                <div className="text-sm">{course.status}</div>
              </div>
            </div>
            {course.description ? (
              <p className="mt-3 text-sm text-muted-foreground">{course.description}</p>
            ) : null}
            {course.coverImageUrl ? (
              <p className="mt-2 break-all text-xs text-muted-foreground">{course.coverImageUrl}</p>
            ) : null}
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <Link
                className="rounded-md border border-stroke-subtle bg-transparent px-3 py-2 text-copy-secondary transition hover:bg-surface-hover hover:text-copy-primary"
                href={adminEditHref("/admin/courses", searchParams, course.id)}
              >
                Editar
              </Link>
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

function getStringParam(
  searchParams: CoursesPageProps["searchParams"],
  key: string,
): string | undefined {
  const value = searchParams?.[key];
  return typeof value === "string" ? value : undefined;
}

function adminEditHref(
  basePath: string,
  searchParams: CoursesPageProps["searchParams"],
  editId: string,
) {
  const params = new URLSearchParams();
  const page = getStringParam(searchParams, "page");
  const pageSize = getStringParam(searchParams, "pageSize");
  const query = getStringParam(searchParams, "query");

  if (page) params.set("page", page);
  if (pageSize) params.set("pageSize", pageSize);
  if (query) params.set("query", query);
  params.set("editId", editId);

  return `${basePath}?${params.toString()}`;
}

type CourseFormProps = {
  course?: {
    id: string;
    title: string;
    slug: string;
    description: string;
    coverImageUrl: string;
    status: string;
  };
};

function CourseForm({ course }: CourseFormProps) {
  return (
    <form
      action={saveCourseAction}
      className="grid gap-3 md:grid-cols-[1fr_1fr_auto]"
      encType="multipart/form-data"
    >
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
        className="rounded-md border px-3 py-2 text-sm outline-none md:col-span-3"
        defaultValue={course?.description}
        name="description"
        placeholder="Descricao"
      />
      <input
        className="rounded-md border px-3 py-2 text-sm outline-none md:col-span-2"
        defaultValue={course?.coverImageUrl}
        name="coverImageUrl"
        placeholder="URL da capa atual (opcional)"
      />
      <input
        accept="image/png,image/jpeg,image/webp"
        className="rounded-md border px-3 py-2 text-sm outline-none md:col-span-2"
        name="coverImageFile"
        type="file"
      />
      <SubmitButton>{course ? "Salvar" : "Criar"}</SubmitButton>
    </form>
  );
}
