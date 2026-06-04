import Link from "next/link";
import { CheckCircle2, Circle, PlayCircle } from "lucide-react";

import { CourseBlocked } from "@/components/student/course-blocked";
import { EmptyState } from "@/components/student/empty-state";
import { ProgressBar } from "@/components/student/progress-bar";
import { getStudentCourse } from "@/server/services/student-service";
import { getYouTubeThumbnailUrl } from "@/server/services/youtube-service";
import { studentCourseParamsSchema } from "@/server/validators/student";

type StudentCoursePageProps = {
  params: { courseId: string };
};

export default async function StudentCoursePage({ params }: StudentCoursePageProps) {
  const { courseId } = studentCourseParamsSchema.parse(params);
  const data = await getStudentCourse(courseId);

  if (data.status !== "AVAILABLE") {
    return <CourseBlocked status={data.status} />;
  }

  return (
    <section>
      <Link className="text-sm font-medium text-copy-secondary hover:text-brand-primary" href="/app">
        Voltar para cursos
      </Link>
      <div className="mt-3 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div>
          <p className="text-sm font-medium text-brand-primary">Curso</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-copy-primary md:text-4xl">
            {data.course.title}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-copy-secondary">
            {data.course.description ?? "Conteudo liberado para seu estudo."}
          </p>
        </div>
        <div className="rounded-md border border-stroke-subtle bg-surface p-5 shadow-sm">
          <ProgressBar
            label={`${data.progress.completedLessons}/${data.progress.totalLessons} aulas concluidas`}
            percentage={data.progress.percentage}
          />
        </div>
      </div>

      <div className="mt-8 space-y-5">
        {data.continueLesson ? (
            <section className="rounded-md border border-stroke-subtle bg-surface p-4 shadow-sm md:p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-copy-muted">
                {data.continueLesson.mode === "NEXT_LESSON"
                  ? "Continuar deste curso"
                  : "Rever ultima aula do curso"}
              </p>
              <h2 className="mt-2 text-base font-semibold tracking-normal text-copy-primary md:text-lg">
                {data.continueLesson.lessonTitle}
              </h2>
              <p className="mt-1 text-sm text-copy-secondary">
                Modulo {data.continueLesson.modulePosition}: {data.continueLesson.moduleTitle} • Aula{" "}
                {data.continueLesson.lessonPosition}
              </p>
              <Link
                className="mt-3 inline-flex min-h-10 items-center justify-center rounded-md bg-brand-primary px-4 text-sm font-medium text-copy-primary transition hover:bg-brand-primaryHover"
                href={data.continueLesson.href}
              >
                {data.continueLesson.mode === "NEXT_LESSON" ? "Continuar agora" : "Abrir aula"}
              </Link>
            </section>
          ) : null}

        {data.modules.length === 0 ? (
          <EmptyState
            description="Assim que novos modulos ativos forem liberados, eles aparecerao neste curso."
            title="Nenhum modulo ativo"
          />
        ) : (
          data.modules.map((module) => (
            <section
              className="rounded-md border border-stroke-subtle bg-surface p-4 shadow-sm md:p-5"
              key={module.id}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-base font-semibold tracking-normal text-copy-primary md:text-lg">
                    {module.title}
                  </h2>
                  {module.description ? (
                    <p className="mt-1 max-w-4xl text-xs leading-5 text-copy-secondary md:text-sm">
                      {module.description}
                    </p>
                  ) : null}
                </div>
                <span className="shrink-0 rounded-md border border-stroke-subtle bg-surface-elevated px-2.5 py-1 text-xs font-medium text-copy-secondary">
                  {module.lessons.length} aulas
                </span>
              </div>

              <div className="mt-4">
                {module.lessons.length === 0 ? (
                  <div className="py-3 text-sm text-copy-muted">
                    Nenhuma aula ativa neste modulo.
                  </div>
                ) : (
                  <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-color:#3A4048_transparent]">
                    {module.lessons.map((lesson) => {
                      const completed = data.completedLessonIds.has(lesson.id);
                      const imageUrl =
                        lesson.coverImageUrl ??
                        getYouTubeThumbnailUrl(lesson.youtubeUrl, lesson.youtubeVideoId);

                      return (
                        <Link
                          className="group w-52 shrink-0 overflow-hidden rounded-md border border-stroke-subtle bg-surface-elevated text-copy-secondary transition hover:border-brand-primary/60 hover:bg-surface-hover hover:text-copy-primary md:w-56"
                          href={`/app/courses/${data.course.id}/lessons/${lesson.id}`}
                          key={lesson.id}
                        >
                          <div
                            className="relative aspect-[9/14] bg-surface-hover bg-cover bg-center"
                            style={
                              imageUrl
                                ? { backgroundImage: `url("${imageUrl}")` }
                                : undefined
                            }
                          >
                            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/15 to-black/75" />
                            <div className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-sm bg-black/65 px-2 py-1 text-[10px] font-semibold uppercase tracking-normal text-white">
                              {completed ? (
                                <CheckCircle2 aria-hidden="true" className="h-3 w-3 text-brand-primary" />
                              ) : (
                                <PlayCircle aria-hidden="true" className="h-3 w-3" />
                              )}
                              Aula {lesson.position}
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 p-3">
                              <h3 className="line-clamp-3 text-sm font-semibold leading-5 text-white">
                                {lesson.title}
                              </h3>
                              <span className="mt-2 inline-flex items-center gap-1.5 rounded-sm border border-white/20 bg-black/45 px-2 py-1 text-[11px] text-white/85">
                                {!completed ? (
                                  <Circle aria-hidden="true" className="h-2 w-2 fill-current" />
                                ) : null}
                                {completed ? "Concluida" : "Pendente"}
                              </span>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          ))
        )}
      </div>
    </section>
  );
}
