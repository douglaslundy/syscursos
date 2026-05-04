import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

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
      <Link
        className="text-sm font-medium text-muted-foreground hover:text-primary"
        href={`/app/courses/${courseId}`}
      >
        Voltar para o curso
      </Link>
      <div className="mt-3 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div>
          <p className="text-sm font-medium text-primary">
            {data.lesson.module.course.title} / {data.lesson.module.title}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal md:text-4xl">
            {data.lesson.title}
          </h1>
        </div>
        <div className="rounded-md border bg-card p-5 shadow-sm">
          <ProgressBar
            label={`${data.progress.completedLessons}/${data.progress.totalLessons} aulas concluidas`}
            percentage={data.progress.percentage}
          />
        </div>
      </div>

      {searchParams?.status === "completed" ? (
        <div className="mt-5 flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
          Aula marcada como concluida.
        </div>
      ) : null}

      <div className="mt-6 overflow-hidden rounded-md border bg-black shadow-sm">
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
          <div className="flex aspect-video items-center justify-center bg-muted px-4 text-center text-sm text-muted-foreground">
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
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
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
