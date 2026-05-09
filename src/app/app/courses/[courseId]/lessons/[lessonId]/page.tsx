import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { CourseBlocked } from "@/components/student/course-blocked";
import { LessonTrailSidebar } from "@/components/student/lesson-trail-sidebar";
import { LessonVideoPlayer } from "@/components/student/lesson-video-player";
import { LessonNoteEditor } from "@/components/student/lesson-note-editor";
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

      {searchParams?.status === "uncompleted" ? (
        <div className="mt-5 flex items-center gap-2 rounded-md border border-stroke-subtle bg-surface px-4 py-3 text-sm text-copy-primary">
          <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
          Marcacao de conclusao removida.
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div className="overflow-hidden rounded-md border border-stroke-subtle bg-black shadow-sm shadow-black/20">
          <LessonVideoPlayer
            courseId={courseId}
            embedUrl={data.embedUrl}
            lessonId={lessonId}
            title={data.lesson.title}
          />
        </div>
        <LessonTrailSidebar
          completedLessonIds={Array.from(data.navigation?.completedLessonIds ?? new Set<string>())}
          courseId={courseId}
          currentLessonId={lessonId}
          currentModuleId={data.lesson.module.id}
          modules={data.navigation?.modules ?? []}
          progress={data.progress}
        />
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
        <input name="isCompleted" type="hidden" value={data.isCompleted ? "false" : "true"} />
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-brand-primary px-4 text-sm font-medium text-copy-primary transition hover:bg-brand-primaryHover disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
        >
          {data.isCompleted ? "Desmarcar aula concluida" : "Marcar como concluida"}
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
