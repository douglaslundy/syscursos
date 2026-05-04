import Link from "next/link";

import { CourseBlocked } from "@/components/student/course-blocked";
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
      <Link className="text-sm text-muted-foreground" href={`/app/courses/${courseId}`}>
        Voltar para o curso
      </Link>
      <div className="mt-2 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          <p className="text-sm text-muted-foreground">
            {data.lesson.module.course.title} / {data.lesson.module.title}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-normal">{data.lesson.title}</h1>
        </div>
        <div className="rounded-md border p-4">
          <ProgressBar
            label={`${data.progress.completedLessons}/${data.progress.totalLessons} aulas concluidas`}
            percentage={data.progress.percentage}
          />
        </div>
      </div>

      {searchParams?.status === "completed" ? (
        <div className="mt-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Aula marcada como concluida.
        </div>
      ) : null}

      <div className="mt-6 overflow-hidden rounded-md border bg-black">
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
          <div className="flex aspect-video items-center justify-center bg-muted text-sm text-muted-foreground">
            Link do YouTube invalido.
          </div>
        )}
      </div>

      {data.lesson.description ? (
        <p className="mt-4 text-sm text-muted-foreground">{data.lesson.description}</p>
      ) : null}

      <form action={completeLessonAction} className="mt-6">
        <input name="courseId" type="hidden" value={courseId} />
        <input name="lessonId" type="hidden" value={lessonId} />
        <button
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          disabled={data.isCompleted}
          type="submit"
        >
          {data.isCompleted ? "Aula concluida" : "Marcar como concluida"}
        </button>
      </form>
    </section>
  );
}
