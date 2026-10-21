import Link from "next/link";
import { CalendarDays, CheckCircle2, Circle, PlayCircle } from "lucide-react";

import { ContinueLessonBlock } from "@/components/student/continue-lesson-block";
import { CourseCertificate } from "@/components/student/course-certificate";
import { CourseBlocked } from "@/components/student/course-blocked";
import { CourseScheduleMode } from "@/components/student/course-schedule-mode";
import { FavoriteButton } from "@/components/student/favorite-button";
import { EmptyState } from "@/components/student/empty-state";
import { ProgressBar } from "@/components/student/progress-bar";
import { getCertificateState } from "@/server/services/certificate-service";
import { getCourseFavoriteState } from "@/server/services/favorite-service";
import { getCourseScheduleMode } from "@/server/services/study-plan-service";
import { getStudentCourse } from "@/server/services/student-service";
import { getLessonThumbnailUrl, getLessonVideoEmbed } from "@/server/services/youtube-service";
import { studentCourseParamsSchema } from "@/server/validators/student";

type StudentCoursePageProps = {
  params: { courseId: string };
};

export default async function StudentCoursePage(props: { params: Promise<StudentCoursePageProps["params"]> }) {
  const params = await props.params;
  const { courseId } = studentCourseParamsSchema.parse(params);
  const [data, isFavorite, scheduleMode, certificate] = await Promise.all([
    getStudentCourse(courseId),
    getCourseFavoriteState(courseId),
    getCourseScheduleMode(courseId),
    // Recurso extra: se a tabela ainda nao existir ou o banco falhar, a pagina do curso continua funcionando.
    getCertificateState(courseId).catch((error: unknown) => {
      console.error("Certificate state failed to load.", error);
      return null;
    }),
  ]);

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
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <FavoriteButton courseId={courseId} isFavorite={isFavorite} />
            <Link
              className="inline-flex min-h-10 items-center gap-2 rounded-md border border-stroke-subtle px-4 text-sm font-medium text-copy-secondary transition hover:bg-surface-hover hover:text-copy-primary"
              href="/app/schedule"
            >
              <CalendarDays aria-hidden className="h-4 w-4" />
              Cronograma
            </Link>
            <a
              className="inline-flex min-h-10 items-center gap-2 rounded-md border border-stroke-subtle px-4 text-sm font-medium text-copy-secondary transition hover:bg-surface-hover hover:text-copy-primary"
              href={`/app/export/${courseId}?format=md`}
            >
              Exportar anotacoes e resumos
            </a>
            <a
              className="inline-flex min-h-10 items-center gap-2 rounded-md border border-stroke-subtle px-4 text-sm font-medium text-copy-secondary transition hover:bg-surface-hover hover:text-copy-primary"
              href={`/app/export/${courseId}?format=anki`}
            >
              Flashcards para Anki
            </a>
          </div>
          {scheduleMode && data.modules.length > 1 ? <CourseScheduleMode courseId={courseId} mode={scheduleMode} /> : null}
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

      {certificate ? <CourseCertificate courseId={courseId} state={certificate} /> : null}

      <div className="mt-8 space-y-5">
        {data.continueLesson ? (
          <ContinueLessonBlock card={data.continueLesson} context="course" />
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
                        getLessonThumbnailUrl(lesson.youtubeUrl, lesson.youtubeVideoId);
                      const videoEmbed = imageUrl
                        ? null
                        : getLessonVideoEmbed(lesson.youtubeUrl, lesson.youtubeVideoId);
                      const fallbackProvider = videoEmbed?.provider === "ONEDRIVE"
                        ? "OneDrive"
                        : videoEmbed?.provider === "GOOGLE_DRIVE"
                          ? "Google Drive"
                          : "Video";

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
                            {!imageUrl ? (
                              <div className="absolute inset-0 flex items-center justify-center bg-surface-hover px-3 text-center">
                                <span className="rounded-sm border border-white/15 bg-black/35 px-3 py-2 text-xs font-semibold text-white/85">
                                  {fallbackProvider}
                                </span>
                              </div>
                            ) : null}
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
