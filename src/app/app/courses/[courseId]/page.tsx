import Link from "next/link";
import { CheckCircle2, Circle, PlayCircle } from "lucide-react";

import { CourseBlocked } from "@/components/student/course-blocked";
import { EmptyState } from "@/components/student/empty-state";
import { ProgressBar } from "@/components/student/progress-bar";
import { getStudentCourse } from "@/server/services/student-service";
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

      <div className="mt-8 space-y-4">
        {data.modules.length === 0 ? (
          <EmptyState
            description="Assim que novos modulos ativos forem liberados, eles aparecerao neste curso."
            title="Nenhum modulo ativo"
          />
        ) : (
          data.modules.map((module) => (
            <section className="rounded-md border border-stroke-subtle bg-surface p-5 shadow-sm" key={module.id}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-copy-muted">
                    Modulo {module.position}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold tracking-normal text-copy-primary">
                    {module.title}
                  </h2>
                </div>
                <span className="rounded-md border border-stroke-subtle bg-surface-elevated px-2.5 py-1 text-xs font-medium text-copy-secondary">
                  {module.lessons.length} aulas
                </span>
              </div>
              <div className="mt-4 divide-y divide-stroke-subtle">
                {module.lessons.length === 0 ? (
                  <div className="py-3 text-sm text-copy-muted">
                    Nenhuma aula ativa neste modulo.
                  </div>
                ) : (
                  module.lessons.map((lesson) => {
                    const completed = data.completedLessonIds.has(lesson.id);

                    return (
                      <Link
                        className="flex min-h-14 items-center justify-between gap-4 rounded-md px-2 py-3 text-sm text-copy-secondary transition hover:bg-surface-hover hover:text-brand-primary"
                        href={`/app/courses/${data.course.id}/lessons/${lesson.id}`}
                        key={lesson.id}
                      >
                        <span className="flex items-center gap-3">
                          {completed ? (
                            <CheckCircle2 aria-hidden="true" className="h-4 w-4 text-brand-primary" />
                          ) : (
                            <PlayCircle
                              aria-hidden="true"
                              className="h-4 w-4 text-copy-muted"
                            />
                          )}
                          <span>
                            {lesson.position}. {lesson.title}
                          </span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-md border border-stroke-subtle bg-surface-elevated px-2 py-1 text-xs text-copy-secondary">
                          {!completed ? (
                            <Circle aria-hidden="true" className="h-2 w-2 fill-current" />
                          ) : null}
                          {completed ? "Concluida" : "Pendente"}
                        </span>
                      </Link>
                    );
                  })
                )}
              </div>
            </section>
          ))
        )}
      </div>
    </section>
  );
}
