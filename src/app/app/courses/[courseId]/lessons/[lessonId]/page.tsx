import Link from "next/link";
import { CheckCircle2, Circle, PlayCircle } from "lucide-react";

import { CourseBlocked } from "@/components/student/course-blocked";
import { LessonNoteEditor } from "@/components/student/lesson-note-editor";
import { ProgressBar } from "@/components/student/progress-bar";
import { completeLessonAction } from "@/server/actions/student-actions";
import { getStudentLesson } from "@/server/services/student-service";
import { studentLessonParamsSchema } from "@/server/validators/student";

type StudentLessonPageProps = {
  params: { courseId: string; lessonId: string };
  searchParams?: {
    status?: string;
  };
};

export default async function StudentLessonPage({ params, searchParams }: StudentLessonPageProps) {
  const { courseId, lessonId } = studentLessonParamsSchema.parse(params);
  const data = await getStudentLesson(courseId, lessonId);

  if (data.status !== "AVAILABLE") {
    return <CourseBlocked status={data.status} />;
  }

  if (!data.lesson) {
    return null;
  }

  return (
    <section>
      <div className="flex flex-wrap items-center gap-3">
        <Link
          className="text-sm font-medium text-copy-secondary hover:text-brand-primary"
          href="/app"
        >
          Voltar para cursos
        </Link>
        <Link
          className="text-sm font-medium text-copy-secondary hover:text-brand-primary"
          href={`/app/courses/${courseId}`}
        >
          Voltar para o curso
        </Link>
      </div>
      <div className="mt-3 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          <p className="text-sm font-medium text-brand-primary">
            {data.lesson.module.course.title} / {data.lesson.module.title}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-copy-primary md:text-4xl">
            {data.lesson.title}
          </h1>
        </div>
      </div>

      {searchParams?.status === "completed" ? (
        <div className="mt-5 flex items-center gap-2 rounded-md border border-stroke-subtle bg-surface px-4 py-3 text-sm text-copy-primary">
          <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
          Aula marcada como concluida.
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div className="overflow-hidden rounded-md border border-stroke-subtle bg-black shadow-sm shadow-black/20">
          {data.embedUrl ? (
            <iframe
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="aspect-video w-full"
              referrerPolicy="strict-origin-when-cross-origin"
              src={data.embedUrl}
              title={data.lesson.title}
            />
          ) : (
            <div className="flex aspect-video items-center justify-center bg-surface px-4 text-center text-sm text-copy-muted">
              Link do YouTube invalido.
            </div>
          )}
        </div>
        <details className="rounded-md border border-stroke-subtle bg-surface p-5 shadow-sm" open>
          <summary className="mb-4 flex cursor-pointer list-none items-center justify-between text-xs font-medium uppercase tracking-[0.12em] text-copy-muted">
            Trilha de aulas
            <span className="rounded-md border border-stroke-subtle bg-surface-elevated px-2 py-1 text-[11px] normal-case tracking-normal text-copy-secondary">
              Abrir/fechar
            </span>
          </summary>
          <div className="mb-5">
            <div className="max-h-[460px] space-y-3 overflow-y-auto pr-1">
              {data.navigation?.modules.map((module) => (
                <details
                  className="rounded-md border border-stroke-subtle bg-background p-3"
                  key={module.id}
                  open={module.id === data.lesson.module.id}
                >
                  <summary className="cursor-pointer list-none text-sm font-medium text-copy-primary">
                    Modulo {module.position}: {module.title}
                  </summary>
                  <div className="mt-3 space-y-1">
                    {module.lessons.map((lesson) => {
                      const isCurrent = lesson.id === lessonId;
                      const completed = data.navigation?.completedLessonIds.has(lesson.id) ?? false;

                      return (
                        <Link
                          aria-current={isCurrent ? "page" : undefined}
                          className={
                            isCurrent
                              ? "flex items-center gap-2 rounded-md bg-surface-hover px-2 py-2 text-sm text-brand-primary"
                              : "flex items-center gap-2 rounded-md px-2 py-2 text-sm text-copy-secondary transition hover:bg-surface-hover hover:text-brand-primary"
                          }
                          href={`/app/courses/${courseId}/lessons/${lesson.id}`}
                          key={lesson.id}
                        >
                          {completed ? (
                            <CheckCircle2 aria-hidden="true" className="h-4 w-4 shrink-0" />
                          ) : isCurrent ? (
                            <PlayCircle aria-hidden="true" className="h-4 w-4 shrink-0" />
                          ) : (
                            <Circle aria-hidden="true" className="h-3 w-3 shrink-0" />
                          )}
                          <span>
                            {lesson.position}. {lesson.title}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </details>
              ))}
            </div>
          </div>
          <ProgressBar
            label={`${data.progress.completedLessons}/${data.progress.totalLessons} aulas concluidas`}
            percentage={data.progress.percentage}
          />
        </details>
      </div>

      {data.lesson.description ? (
        <p className="mt-4 text-sm text-copy-secondary">{data.lesson.description}</p>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-2">
        {data.navigation?.previousLesson ? (
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-stroke-subtle bg-transparent px-4 text-sm font-medium text-copy-secondary transition hover:bg-surface-hover hover:text-copy-primary"
            href={`/app/courses/${courseId}/lessons/${data.navigation.previousLesson.id}`}
          >
            Aula anterior
          </Link>
        ) : (
          <span className="inline-flex min-h-11 items-center justify-center rounded-md border border-stroke-subtle bg-surface-elevated px-4 text-sm font-medium text-copy-muted">
            Aula anterior
          </span>
        )}
        {data.navigation?.nextLesson ? (
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-stroke-subtle bg-transparent px-4 text-sm font-medium text-copy-secondary transition hover:bg-surface-hover hover:text-copy-primary"
            href={`/app/courses/${courseId}/lessons/${data.navigation.nextLesson.id}`}
          >
            Proxima aula
          </Link>
        ) : (
          <span className="inline-flex min-h-11 items-center justify-center rounded-md border border-stroke-subtle bg-surface-elevated px-4 text-sm font-medium text-copy-muted">
            Proxima aula
          </span>
        )}
      </div>

      <form action={completeLessonAction} className="mt-3">
        <input name="courseId" type="hidden" value={courseId} />
        <input name="lessonId" type="hidden" value={lessonId} />
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-brand-primary px-4 text-sm font-medium text-copy-primary transition hover:bg-brand-primaryHover disabled:cursor-not-allowed disabled:opacity-60"
          disabled={data.isCompleted}
          type="submit"
        >
          {data.isCompleted ? "Aula concluida" : "Marcar como concluida"}
        </button>
      </form>

      <LessonNoteEditor
        courseId={courseId}
        initialContent={data.note?.content ?? ""}
        lessonId={lessonId}
      />
    </section>
  );
}
