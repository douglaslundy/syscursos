import Link from "next/link";

import { Feedback } from "@/components/admin/feedback";
import { LessonForm } from "@/components/admin/lesson-form";
import { Pagination } from "@/components/admin/pagination";
import { SubmitButton } from "@/components/admin/submit-button";
import { deleteLessonAction } from "@/server/actions/admin-actions";
import { getCourseOptions, getLessons, getModuleOptions } from "@/server/services/admin-service";
import { getPagination } from "@/server/validators/pagination";

type AdminLessonsPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function AdminLessonsPage({ searchParams }: AdminLessonsPageProps) {
  const pagination = getPagination(searchParams);
  const status = getStringParam(searchParams, "status");
  const formReset = getStringParam(searchParams, "formReset") ?? "idle";
  const editId = getStringParam(searchParams, "editId");
  const courses = await getCourseOptions();
  const selectedCourseId = getStringParam(searchParams, "courseId") ?? courses[0]?.id ?? null;
  const modules = selectedCourseId ? await getModuleOptions(selectedCourseId) : [];
  const selectedModuleId = getStringParam(searchParams, "moduleId") ?? modules[0]?.id ?? null;
  const lessonData = selectedModuleId ? await getLessons(selectedModuleId, pagination) : null;
  const editingLesson = lessonData?.lessons.items.find((lesson) => lesson.id === editId) ?? null;
  const currentPath = selectedCourseId && selectedModuleId
    ? `/admin/lessons?courseId=${encodeURIComponent(selectedCourseId)}&moduleId=${encodeURIComponent(selectedModuleId)}`
    : "/admin/lessons";

  return (
    <section>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-normal">Cadastrar aulas</h2>
        <p className="text-sm text-muted-foreground">
          Cadastre ou atualize aulas selecionando o curso e o modulo de destino.
        </p>
      </div>
      <Feedback status={status} />

      <div className="mb-6 rounded-md border bg-background p-4">
        <CourseModuleSelector
          courses={courses}
          modules={modules}
          selectedCourseId={selectedCourseId}
          selectedModuleId={selectedModuleId}
        />
      </div>

      {lessonData && selectedCourseId && selectedModuleId ? (
        <>
          <div className="mb-6 rounded-md border bg-background p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-medium">{editingLesson ? "Editar aula" : "Nova aula"}</h3>
                <p className="text-xs text-muted-foreground">
                  {lessonData.module.course.title} / {lessonData.module.title}
                </p>
              </div>
              {editingLesson ? (
                <Link className="text-sm text-muted-foreground hover:text-foreground" href={currentPath}>
                  Cancelar edicao
                </Link>
              ) : null}
            </div>
            <LessonForm
              formResetToken={formReset}
              key={`${selectedModuleId}-${editingLesson?.id ?? "new"}-${formReset}`}
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
              moduleId={selectedModuleId}
              redirectTo={currentPath}
              suggestedPosition={lessonData.lessons.total + 1}
            />
          </div>

          <LessonSearchForm
            courseId={selectedCourseId}
            moduleId={selectedModuleId}
            query={pagination.query}
          />

          <div className="space-y-3">
            {lessonData.lessons.items.length === 0 ? (
              <div className="rounded-md border bg-background p-4 text-sm text-muted-foreground">
                Nenhuma aula cadastrada neste modulo.
              </div>
            ) : (
              lessonData.lessons.items.map((lesson) => (
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
                  <p className="mt-3 break-all text-sm text-muted-foreground">{lesson.youtubeUrl}</p>
                  {lesson.description ? (
                    <p className="mt-2 text-sm text-muted-foreground">{lesson.description}</p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                    <Link
                      className="rounded-md border border-stroke-subtle bg-transparent px-3 py-2 text-copy-secondary transition hover:bg-surface-hover hover:text-copy-primary"
                      href={`${currentPath}&editId=${encodeURIComponent(lesson.id)}`}
                    >
                      Editar
                    </Link>
                    <form action={deleteLessonAction}>
                      <input name="id" type="hidden" value={lesson.id} />
                      <input name="moduleId" type="hidden" value={selectedModuleId} />
                      <input name="redirectTo" type="hidden" value={currentPath} />
                      <SubmitButton destructive confirmMessage="Remover esta aula?">
                        Remover
                      </SubmitButton>
                    </form>
                  </div>
                </article>
              ))
            )}
          </div>

          <Pagination
            basePath="/admin/lessons"
            page={lessonData.lessons.page}
            pageCount={lessonData.lessons.pageCount}
            params={{ courseId: selectedCourseId, moduleId: selectedModuleId }}
            query={pagination.query}
          />
        </>
      ) : (
        <div className="rounded-md border bg-background p-4 text-sm text-muted-foreground">
          Selecione um curso com modulos cadastrados para criar aulas.
        </div>
      )}
    </section>
  );
}

type CourseModuleSelectorProps = {
  courses: Array<{ id: string; title: string }>;
  modules: Array<{ id: string; title: string; position: number }>;
  selectedCourseId: string | null;
  selectedModuleId: string | null;
};

function CourseModuleSelector({
  courses,
  modules,
  selectedCourseId,
  selectedModuleId,
}: CourseModuleSelectorProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <form className="grid gap-2">
        <label className="text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground" htmlFor="courseId">
          Curso
        </label>
        <select
          className="rounded-md border px-3 py-2 text-sm outline-none"
          defaultValue={selectedCourseId ?? ""}
          id="courseId"
          name="courseId"
        >
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.title}
            </option>
          ))}
        </select>
        <button className="w-fit rounded-md bg-brand-primary px-4 py-2 text-sm text-copy-primary" type="submit">
          Selecionar curso
        </button>
      </form>

      <form className="grid gap-2">
        {selectedCourseId ? <input name="courseId" type="hidden" value={selectedCourseId} /> : null}
        <label className="text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground" htmlFor="moduleId">
          Modulo
        </label>
        <select
          className="rounded-md border px-3 py-2 text-sm outline-none"
          defaultValue={selectedModuleId ?? ""}
          disabled={modules.length === 0}
          id="moduleId"
          name="moduleId"
        >
          {modules.map((module) => (
            <option key={module.id} value={module.id}>
              {module.position}. {module.title}
            </option>
          ))}
        </select>
        <button
          className="w-fit rounded-md bg-brand-primary px-4 py-2 text-sm text-copy-primary disabled:cursor-not-allowed disabled:opacity-60"
          disabled={modules.length === 0}
          type="submit"
        >
          Selecionar modulo
        </button>
      </form>
    </div>
  );
}

type LessonSearchFormProps = {
  courseId: string;
  moduleId: string;
  query?: string;
};

function LessonSearchForm({ courseId, moduleId, query }: LessonSearchFormProps) {
  return (
    <form className="mb-4 flex max-w-md gap-2">
      <input name="courseId" type="hidden" value={courseId} />
      <input name="moduleId" type="hidden" value={moduleId} />
      <input
        className="h-10 flex-1 rounded-md border px-3 text-sm outline-none"
        defaultValue={query}
        name="query"
        placeholder="Buscar"
      />
      <button
        className="rounded-md bg-brand-primary px-4 text-sm text-copy-primary transition hover:bg-brand-primaryHover"
        type="submit"
      >
        Buscar
      </button>
    </form>
  );
}

function getStringParam(
  searchParams: AdminLessonsPageProps["searchParams"],
  key: string,
): string | undefined {
  const value = searchParams?.[key];
  return typeof value === "string" ? value : undefined;
}

