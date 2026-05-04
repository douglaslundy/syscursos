import Link from "next/link";

import { Feedback } from "@/components/admin/feedback";
import { Pagination } from "@/components/admin/pagination";
import { SearchForm } from "@/components/admin/search-form";
import { SubmitButton } from "@/components/admin/submit-button";
import { deleteModuleAction, saveModuleAction } from "@/server/actions/admin-actions";
import { getModules } from "@/server/services/admin-service";
import { getPagination } from "@/server/validators/pagination";

type ModulesPageProps = {
  params: { courseId: string };
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function ModulesPage({ params, searchParams }: ModulesPageProps) {
  const pagination = getPagination(searchParams);
  const { course, modules } = await getModules(params.courseId, pagination);
  const status = typeof searchParams?.status === "string" ? searchParams.status : undefined;

  return (
    <section>
      <Link className="text-sm text-muted-foreground" href="/admin/courses">
        Voltar para cursos
      </Link>
      <div className="mb-6 mt-2">
        <h2 className="text-2xl font-semibold tracking-normal">Modulos de {course.title}</h2>
        <p className="text-sm text-muted-foreground">Ordene, edite, inative e remova modulos.</p>
      </div>
      <Feedback status={status} />
      <div className="mb-6 rounded-md border bg-background p-4">
        <h3 className="mb-4 font-medium">Novo modulo</h3>
        <ModuleForm courseId={course.id} />
      </div>
      <SearchForm query={pagination.query} />
      <div className="space-y-3">
        {modules.items.map((module) => (
          <article className="rounded-md border bg-background p-4" key={module.id}>
            <ModuleForm
              courseId={course.id}
              module={{
                id: module.id,
                title: module.title,
                description: module.description ?? "",
                position: module.position,
                status: module.status,
              }}
            />
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <Link
                className="rounded-md border border-stroke-subtle bg-transparent px-3 py-2 text-copy-secondary transition hover:bg-surface-hover hover:text-copy-primary"
                href={`/admin/modules/${module.id}/lessons`}
              >
                Aulas ({module._count.lessons})
              </Link>
              <form action={deleteModuleAction}>
                <input name="id" type="hidden" value={module.id} />
                <input name="courseId" type="hidden" value={course.id} />
                <SubmitButton destructive confirmMessage="Remover este modulo e suas aulas?">
                  Remover
                </SubmitButton>
              </form>
            </div>
          </article>
        ))}
      </div>
      <Pagination
        basePath={`/admin/courses/${course.id}/modules`}
        page={modules.page}
        pageCount={modules.pageCount}
        query={pagination.query}
      />
    </section>
  );
}

type ModuleFormProps = {
  courseId: string;
  module?: {
    id: string;
    title: string;
    description: string;
    position: number;
    status: string;
  };
};

function ModuleForm({ courseId, module }: ModuleFormProps) {
  return (
    <form action={saveModuleAction} className="grid gap-3 md:grid-cols-[1fr_100px_140px_auto]">
      <input name="courseId" type="hidden" value={courseId} />
      {module ? <input name="id" type="hidden" value={module.id} /> : null}
      <input
        className="rounded-md border px-3 py-2 text-sm outline-none"
        defaultValue={module?.title}
        name="title"
        placeholder="Titulo"
      />
      <input
        className="rounded-md border px-3 py-2 text-sm outline-none"
        defaultValue={module?.position ?? 1}
        min={1}
        name="position"
        type="number"
      />
      <select
        className="rounded-md border px-3 py-2 text-sm outline-none"
        defaultValue={module?.status ?? "ACTIVE"}
        name="status"
      >
        <option value="ACTIVE">Ativo</option>
        <option value="INACTIVE">Inativo</option>
      </select>
      <SubmitButton>{module ? "Salvar" : "Criar"}</SubmitButton>
      <textarea
        className="rounded-md border px-3 py-2 text-sm outline-none md:col-span-3"
        defaultValue={module?.description}
        name="description"
        placeholder="Descricao"
      />
    </form>
  );
}
