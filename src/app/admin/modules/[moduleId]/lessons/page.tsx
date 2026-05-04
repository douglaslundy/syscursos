import Link from "next/link";

import { Feedback } from "@/components/admin/feedback";
import { Pagination } from "@/components/admin/pagination";
import { SearchForm } from "@/components/admin/search-form";
import { SubmitButton } from "@/components/admin/submit-button";
import { deleteLessonAction, saveLessonAction } from "@/server/actions/admin-actions";
import { getLessons } from "@/server/services/admin-service";
import { getPagination } from "@/server/validators/pagination";

type LessonsPageProps = {
  params: { moduleId: string };
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function LessonsPage({ params, searchParams }: LessonsPageProps) {
  const pagination = getPagination(searchParams);
  const { module, lessons } = await getLessons(params.moduleId, pagination);
  const status = typeof searchParams?.status === "string" ? searchParams.status : undefined;

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
        <p className="text-sm text-muted-foreground">Cadastre aulas usando links do YouTube.</p>
      </div>
      <Feedback status={status} />
      <div className="mb-6 rounded-md border bg-background p-4">
        <h3 className="mb-4 font-medium">Nova aula</h3>
        <LessonForm moduleId={module.id} />
      </div>
      <SearchForm query={pagination.query} />
      <div className="space-y-3">
        {lessons.items.map((lesson) => (
          <article className="rounded-md border bg-background p-4" key={lesson.id}>
            <LessonForm
              lesson={{
                id: lesson.id,
                title: lesson.title,
                description: lesson.description ?? "",
                youtubeUrl: lesson.youtubeUrl,
                youtubeVideoId: lesson.youtubeVideoId ?? "",
                position: lesson.position,
                status: lesson.status,
              }}
              moduleId={module.id}
            />
            <form action={deleteLessonAction} className="mt-3">
              <input name="id" type="hidden" value={lesson.id} />
              <input name="moduleId" type="hidden" value={module.id} />
              <SubmitButton destructive confirmMessage="Remover esta aula?">
                Remover
              </SubmitButton>
            </form>
          </article>
        ))}
      </div>
      <Pagination
        basePath={`/admin/modules/${module.id}/lessons`}
        page={lessons.page}
        pageCount={lessons.pageCount}
        query={pagination.query}
      />
    </section>
  );
}

type LessonFormProps = {
  moduleId: string;
  lesson?: {
    id: string;
    title: string;
    description: string;
    youtubeUrl: string;
    youtubeVideoId: string;
    position: number;
    status: string;
  };
};

function LessonForm({ moduleId, lesson }: LessonFormProps) {
  return (
    <form action={saveLessonAction} className="grid gap-3 md:grid-cols-[1fr_100px_140px_auto]">
      <input name="moduleId" type="hidden" value={moduleId} />
      {lesson ? <input name="id" type="hidden" value={lesson.id} /> : null}
      <input
        className="rounded-md border px-3 py-2 text-sm"
        defaultValue={lesson?.title}
        name="title"
        placeholder="Titulo"
      />
      <input
        className="rounded-md border px-3 py-2 text-sm"
        defaultValue={lesson?.position ?? 1}
        min={1}
        name="position"
        type="number"
      />
      <select
        className="rounded-md border px-3 py-2 text-sm"
        defaultValue={lesson?.status ?? "ACTIVE"}
        name="status"
      >
        <option value="ACTIVE">Ativo</option>
        <option value="INACTIVE">Inativo</option>
      </select>
      <SubmitButton>{lesson ? "Salvar" : "Criar"}</SubmitButton>
      <input
        className="rounded-md border px-3 py-2 text-sm md:col-span-2"
        defaultValue={lesson?.youtubeUrl}
        name="youtubeUrl"
        placeholder="https://www.youtube.com/watch?v=..."
      />
      <input
        className="rounded-md border px-3 py-2 text-sm"
        defaultValue={lesson?.youtubeVideoId}
        name="youtubeVideoId"
        placeholder="Video ID"
      />
      <textarea
        className="rounded-md border px-3 py-2 text-sm md:col-span-3"
        defaultValue={lesson?.description}
        name="description"
        placeholder="Descricao"
      />
    </form>
  );
}
