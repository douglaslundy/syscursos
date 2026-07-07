import Link from "next/link";

import { AdminModal } from "@/components/admin/admin-modal";
import { Feedback } from "@/components/admin/feedback";
import { Pagination } from "@/components/admin/pagination";
import { SearchForm } from "@/components/admin/search-form";
import { LessonForm } from "@/components/admin/lesson-form";
import { SubmitButton } from "@/components/admin/submit-button";
import {
  deleteLessonAction,
  deleteLessonMaterialAction,
  saveLessonMaterialAction,
} from "@/server/actions/admin-actions";
import { getLessonMaterials, getLessons } from "@/server/services/admin-service";
import { getPagination } from "@/server/validators/pagination";

type LessonsPageProps = {
  params: { moduleId: string };
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function LessonsPage({ params, searchParams }: LessonsPageProps) {
  const pagination = getPagination(searchParams);
  const { module, lessons } = await getLessons(params.moduleId, pagination);
  const lessonMaterialsEntries = await Promise.all(
    lessons.items.map(async (lesson) => [lesson.id, await getLessonMaterials(lesson.id)] as const),
  );
  const materialsByLesson = new Map(lessonMaterialsEntries);
  const status = typeof searchParams?.status === "string" ? searchParams.status : undefined;
  const formReset = getStringParam(searchParams, "formReset") ?? "idle";
  const editId = getStringParam(searchParams, "editId");
  const create = getStringParam(searchParams, "create");
  const editingLesson = lessons.items.find((lesson) => lesson.id === editId);
  const currentPath = buildLessonsPath(`/admin/modules/${module.id}/lessons`, searchParams);
  const showLessonModal = create === "1" || Boolean(editingLesson);

  return (
    <section>
      <Link
        className="text-sm text-muted-foreground"
        href={`/admin/courses/${module.courseId}/modules`}
      >
        Voltar para modulos
      </Link>
      <div className="mb-6 mt-2">
        <h2 className="text-2xl font-semibold tracking-normal">Aulas de {module.title}</h2>
        <p className="text-sm text-muted-foreground">Cadastre aulas usando links do YouTube, Google Drive ou OneDrive.</p>
      </div>
      <Feedback status={status} />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-medium">Aulas cadastradas</h3>
          <p className="text-xs text-muted-foreground">Modulo {module.title}</p>
        </div>
        <Link
          className="inline-flex min-h-10 items-center justify-center rounded-md bg-brand-primary px-4 text-sm font-medium text-copy-primary transition hover:bg-brand-primaryHover"
          href={addQueryParam(currentPath, "create", "1")}
          scroll={false}
        >
          Cadastrar aula
        </Link>
      </div>
      {showLessonModal ? (
        <AdminModal
          closeHref={currentPath}
          description={`Modulo ${module.title}`}
          title={editingLesson ? "Editar aula" : "Cadastrar aula"}
        >
          <LessonForm
            key={`${module.id}-${editingLesson?.id ?? "new"}-${formReset}`}
            formResetToken={formReset}
            lesson={
              editingLesson
                ? {
                    id: editingLesson.id,
                    title: editingLesson.title,
                    description: editingLesson.description ?? "",
                    youtubeUrl: editingLesson.youtubeUrl,
                    youtubeVideoId: editingLesson.youtubeVideoId ?? "",
                    coverImageUrl: editingLesson.coverImageUrl ?? "",
                    position: editingLesson.position,
                    status: editingLesson.status,
                  }
                : undefined
            }
            moduleId={module.id}
            redirectTo={currentPath}
            suggestedPosition={lessons.total + 1}
          />
        </AdminModal>
      ) : null}
      <SearchForm query={pagination.query} />
      <div className="space-y-3">
        {lessons.items.map((lesson) => (
          <article className="rounded-md border bg-background p-4" key={lesson.id}>
            <div className="grid gap-2 md:grid-cols-[1.2fr_120px_120px]">
              <div>
                <div className="text-xs text-muted-foreground">Titulo</div>
                <div className="font-medium">{lesson.title}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Posicao</div>
                <div className="text-sm">{lesson.position}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Status</div>
                <div className="text-sm">{lesson.status}</div>
              </div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{lesson.youtubeUrl}</p>
            {lesson.coverImageUrl ? (
              <p className="mt-2 break-all text-xs text-muted-foreground">
                Capa: {lesson.coverImageUrl}
              </p>
            ) : null}
            {lesson.description ? (
              <p className="mt-2 text-sm text-muted-foreground">{lesson.description}</p>
            ) : null}
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <Link
                className="rounded-md border border-stroke-subtle bg-transparent px-3 py-2 text-copy-secondary transition hover:bg-surface-hover hover:text-copy-primary"
                href={adminEditHref(currentPath, searchParams, lesson.id)}
                scroll={false}
              >
                Editar
              </Link>
              <form action={deleteLessonAction}>
                <input name="id" type="hidden" value={lesson.id} />
                <input name="moduleId" type="hidden" value={module.id} />
                <SubmitButton destructive confirmMessage="Remover esta aula?">
                  Remover
                </SubmitButton>
              </form>
            </div>
            <div className="mt-4 rounded-md border border-stroke-subtle bg-surface-elevated p-3">
              <p className="text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">
                Materiais da aula
              </p>
              <LessonMaterialForm
                courseId={module.courseId}
                lessonId={lesson.id}
                moduleId={module.id}
                suggestedPosition={(materialsByLesson.get(lesson.id)?.length ?? 0) + 1}
              />
              <div className="mt-3 space-y-2">
                {(materialsByLesson.get(lesson.id) ?? []).length === 0 ? (
                  <p className="text-xs text-muted-foreground">Nenhum material cadastrado.</p>
                ) : (
                  (materialsByLesson.get(lesson.id) ?? []).map((material) => (
                    <article
                      className="rounded-md border border-stroke-subtle bg-background px-3 py-2"
                      key={material.id}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium">{material.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {material.type} - posicao {material.position} - {material.status}
                          </p>
                        </div>
                        <form action={deleteLessonMaterialAction}>
                          <input name="id" type="hidden" value={material.id} />
                          <input name="moduleId" type="hidden" value={module.id} />
                          <input name="courseId" type="hidden" value={module.courseId} />
                          <SubmitButton destructive confirmMessage="Remover este material?">
                            Remover material
                          </SubmitButton>
                        </form>
                      </div>
                      <a
                        className="mt-1 block break-all text-xs text-muted-foreground hover:text-foreground"
                        href={material.url}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        {material.url}
                      </a>
                    </article>
                  ))
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
      <Pagination
        basePath={currentPath}
        page={lessons.page}
        pageCount={lessons.pageCount}
        query={pagination.query}
      />
    </section>
  );
}

type LessonMaterialFormProps = {
  lessonId: string;
  moduleId: string;
  courseId: string;
  suggestedPosition: number;
};

function LessonMaterialForm({ lessonId, moduleId, courseId, suggestedPosition }: LessonMaterialFormProps) {
  return (
    <form action={saveLessonMaterialAction} className="mt-3 grid gap-2 md:grid-cols-[120px_1fr_1fr_100px_120px_auto]">
      <input name="lessonId" type="hidden" value={lessonId} />
      <input name="moduleId" type="hidden" value={moduleId} />
      <input name="courseId" type="hidden" value={courseId} />
      <select className="rounded-md border px-3 py-2 text-sm outline-none" defaultValue="PDF" name="type">
        <option value="PDF">PDF</option>
        <option value="LINK">Link</option>
      </select>
      <input
        className="rounded-md border px-3 py-2 text-sm outline-none"
        name="title"
        placeholder="Titulo do material"
      />
      <input
        className="rounded-md border px-3 py-2 text-sm outline-none"
        name="url"
        placeholder="https://..."
        type="url"
      />
      <input
        className="rounded-md border px-3 py-2 text-sm outline-none"
        defaultValue={suggestedPosition}
        min={1}
        name="position"
        type="number"
      />
      <select className="rounded-md border px-3 py-2 text-sm outline-none" defaultValue="ACTIVE" name="status">
        <option value="ACTIVE">Ativo</option>
        <option value="INACTIVE">Inativo</option>
      </select>
      <SubmitButton>Adicionar</SubmitButton>
    </form>
  );
}

function getStringParam(
  searchParams: LessonsPageProps["searchParams"],
  key: string,
): string | undefined {
  const value = searchParams?.[key];
  return typeof value === "string" ? value : undefined;
}

function adminEditHref(
  basePath: string,
  searchParams: LessonsPageProps["searchParams"],
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

function addQueryParam(path: string, key: string, value: string) {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
}

function buildLessonsPath(basePath: string, searchParams: LessonsPageProps["searchParams"]) {
  const params = new URLSearchParams();
  const page = getStringParam(searchParams, "page");
  const pageSize = getStringParam(searchParams, "pageSize");
  const query = getStringParam(searchParams, "query");

  if (page) params.set("page", page);
  if (pageSize) params.set("pageSize", pageSize);
  if (query) params.set("query", query);

  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}
