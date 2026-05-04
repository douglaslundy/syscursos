import Link from "next/link";

import { CourseBlocked } from "@/components/student/course-blocked";
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
      <Link className="text-sm text-muted-foreground" href="/app">
        Voltar para cursos
      </Link>
      <div className="mt-2 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">{data.course.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {data.course.description ?? "Conteudo liberado para seu estudo."}
          </p>
        </div>
        <div className="rounded-md border p-4">
          <ProgressBar
            label={`${data.progress.completedLessons}/${data.progress.totalLessons} aulas concluidas`}
            percentage={data.progress.percentage}
          />
        </div>
      </div>

      <div className="mt-8 space-y-4">
        {data.modules.length === 0 ? (
          <div className="rounded-md border p-6 text-sm text-muted-foreground">
            Nenhum modulo ativo disponivel.
          </div>
        ) : (
          data.modules.map((module) => (
            <section className="rounded-md border bg-background p-4" key={module.id}>
              <h2 className="font-semibold tracking-normal">
                {module.position}. {module.title}
              </h2>
              <div className="mt-4 divide-y">
                {module.lessons.length === 0 ? (
                  <div className="py-3 text-sm text-muted-foreground">
                    Nenhuma aula ativa neste modulo.
                  </div>
                ) : (
                  module.lessons.map((lesson) => {
                    const completed = data.completedLessonIds.has(lesson.id);

                    return (
                      <Link
                        className="flex items-center justify-between gap-4 py-3 text-sm hover:text-primary"
                        href={`/app/courses/${data.course.id}/lessons/${lesson.id}`}
                        key={lesson.id}
                      >
                        <span>
                          {lesson.position}. {lesson.title}
                        </span>
                        <span className="rounded-md border px-2 py-1 text-xs">
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
