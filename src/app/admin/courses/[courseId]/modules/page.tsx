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
  const editId = getStringParam(searchParams, "editId");
  const editingModule = modules.items.find((module) => module.id === editId);

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
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-medium">{editingModule ? "Editar modulo" : "Novo modulo"}</h3>
          {editingModule ? (
            <Link
              className="text-sm text-muted-foreground hover:text-foreground"
              href={`/admin/courses/${course.id}/modules`}
            >
              Cancelar edicao
            </Link>
          ) : null}
        </div>
        <ModuleForm
          courseId={course.id}
          module={
            editingModule
              ? {
                  id: editingModule.id,
                  title: editingModule.title,
                  description: editingModule.description ?? "",
                  coverImageUrl: editingModule.coverImageUrl ?? "",
                  position: editingModule.position,
                  status: editingModule.status,
                }
              : undefined
          }
        />
      </div>
      <SearchForm query={pagination.query} />
      <div className="space-y-3">
        {modules.items.map((module) => (
          <article className="rounded-md border bg-background p-4" key={module.id}>
            <div className="grid gap-2 md:grid-cols-[1.4fr_120px_120px]">
              <div>
                <div className="text-xs text-muted-foreground">Titulo</div>
                <div className="font-medium">{module.title}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Posicao</div>
                <div className="text-sm">{module.position}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Status</div>
                <div className="text-sm">{module.status}</div>
              </div>
            </div>
            {module.description ? (
              <p className="mt-3 text-sm text-muted-foreground">{module.description}</p>
            ) : null}
            {module.coverImageUrl ? (
              <p className="mt-2 break-all text-xs text-muted-foreground">Capa: {module.coverImageUrl}</p>
            ) : null}
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <Link
                className="rounded-md border border-stroke-subtle bg-transparent px-3 py-2 text-copy-secondary transition hover:bg-surface-hover hover:text-copy-primary"
                href={adminEditHref(`/admin/courses/${course.id}/modules`, searchParams, module.id)}
              >
                Editar
              </Link>
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

function getStringParam(
  searchParams: ModulesPageProps["searchParams"],
  key: string,
): string | undefined {
  const value = searchParams?.[key];
  return typeof value === "string" ? value : undefined;
}

function adminEditHref(
  basePath: string,
  searchParams: ModulesPageProps["searchParams"],
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

type ModuleFormProps = {
  courseId: string;
  module?: {
    id: string;
    title: string;
    description: string;
    coverImageUrl: string;
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
      <input
        className="rounded-md border px-3 py-2 text-sm outline-none md:col-span-3"
        defaultValue={module?.coverImageUrl}
        name="coverImageUrl"
        placeholder="URL HTTPS da capa do modulo (opcional)"
        type="url"
      />
    </form>
  );
}
