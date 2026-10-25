import Link from "next/link";

import { CourseBlocked } from "@/components/student/course-blocked";
import { FavoriteButton } from "@/components/student/favorite-button";
import { AddToPlaylist } from "@/components/student/add-to-playlist";
import { LessonBookmarks } from "@/components/student/lesson-bookmarks";
import { LessonCompletionPanel } from "@/components/student/lesson-completion-panel";
import { LessonChat } from "@/components/student/lesson-chat";
import { LessonQuestions } from "@/components/student/lesson-questions";
import { LessonStudyTools } from "@/components/student/lesson-study-tools";
import { LessonNoteEditor } from "@/components/student/lesson-note-editor";
import { LessonTranscript } from "@/components/student/lesson-transcript";
import { listBookmarks } from "@/server/services/bookmark-service";
import { getAiAvailability, listLessonAiItems } from "@/server/services/ai/ai-content-service";
import { getLessonFavoriteState } from "@/server/services/favorite-service";
import { listPlaylists } from "@/server/services/playlist-service";
import { listLessonQuestions } from "@/server/services/question-service";
import { listQuizAttempts } from "@/server/services/quiz-service";
import { getPlaybackRate } from "@/server/services/study-stats-service";
import { getGeminiApiKey, getPlayerMode, getTranscriptionMethod } from "@/server/services/settings-service";
import { canResetTranscript } from "@/server/services/transcript-service";
import { getStudentLesson, requireStudentProfileId } from "@/server/services/student-service";
import { extractYouTubeVideoId } from "@/server/services/video-platform-service";
import { studentLessonParamsSchema } from "@/server/validators/student";

export const maxDuration = 60;

// Recursos extras (quiz, marcadores, playlists) nao podem derrubar a aula se a tabela ainda nao existir ou o banco falhar.
function optional<T>(fallback: T) {
  return (error: unknown) => {
    console.error("Optional lesson data failed to load.", error);
    return fallback;
  };
}

type StudentLessonPageProps = {
  params: { courseId: string; lessonId: string };
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function StudentLessonPage(props: { params: Promise<StudentLessonPageProps["params"]>; searchParams: Promise<StudentLessonPageProps["searchParams"]> }) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const { courseId, lessonId } = studentLessonParamsSchema.parse(params);
  const [data, isFavorite, transcriptionMethod, studentId, ai, aiItems, geminiKey, quizAttempts, bookmarks, playlists, questions, playbackRate, playerMode] = await Promise.all([
    getStudentLesson(courseId, lessonId),
    getLessonFavoriteState(lessonId),
    getTranscriptionMethod(),
    requireStudentProfileId(),
    getAiAvailability(),
    listLessonAiItems(lessonId),
    getGeminiApiKey(),
    requireStudentProfileId().then((id) => listQuizAttempts(id, lessonId)).catch(optional([])),
    requireStudentProfileId().then((id) => listBookmarks(id, lessonId)).catch(optional([])),
    listPlaylists().catch(optional([])),
    listLessonQuestions(lessonId).catch(optional([])),
    getPlaybackRate().catch(optional(1)),
    getPlayerMode().catch(optional("embed" as const)),
  ]);

  if (data.status !== "AVAILABLE") {
    return <CourseBlocked status={data.status} />;
  }

  if (!data.lesson) {
    return null;
  }

  // Aula do Drive com o player proprio ligado no admin: o video vem de /app/video, com controle de tempo e velocidade.
  const videoEmbed =
    playerMode === "own" && data.videoEmbed?.provider === "GOOGLE_DRIVE"
      ? { ...data.videoEmbed, supportsCompletionTracking: true, ownSrc: `/app/video/${lessonId}?courseId=${courseId}` }
      : data.videoEmbed;

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
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <FavoriteButton courseId={courseId} isFavorite={isFavorite} lessonId={lessonId} />
            <AddToPlaylist courseId={courseId} lessonId={lessonId} playlists={playlists} />
          </div>
        </div>
      </div>

      {data.lesson.description ? (
        <p className="mt-4 text-sm text-copy-secondary">{data.lesson.description}</p>
      ) : null}

      <LessonCompletionPanel
        completedLessonIds={Array.from(data.navigation?.completedLessonIds ?? new Set<string>()).filter(
          (id) => id !== lessonId,
        )}
        courseId={courseId}
        currentModuleId={data.lesson.module.id}
        initialIsCompleted={data.isCompleted}
        lessonId={lessonId}
        modules={data.navigation?.modules ?? []}
        nextLessonId={data.navigation?.nextLesson?.id ?? null}
        nextLessonTitle={data.navigation?.nextLesson?.title ?? null}
        previousLessonId={data.navigation?.previousLesson?.id ?? null}
        initialRate={playbackRate}
        progress={data.progress}
        startSeconds={data.positionSeconds}
        title={data.lesson.title}
        videoEmbed={videoEmbed}
      >
        {data.lesson.materials.length > 0 ? (
          <section className="mt-6 rounded-md border border-stroke-subtle bg-surface p-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-copy-muted">
              Materiais da aula
            </h2>
            <div className="mt-3 space-y-2">
              {data.lesson.materials.map((material) => (
                <a
                  className="block rounded-md border border-stroke-subtle bg-background px-3 py-2 transition hover:bg-surface-hover"
                  href={material.url}
                  key={material.id}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <p className="text-sm font-medium text-copy-primary">{material.title}</p>
                  <p className="text-xs text-copy-muted">
                    {material.type === "PDF" ? "PDF" : "Link externo"} - material {material.position}
                  </p>
                </a>
              ))}
            </div>
          </section>
        ) : null}

        <LessonTranscript
          courseId={courseId}
          canReset={canResetTranscript(data.lesson, studentId)}
          durationSeconds={data.lesson.durationSeconds}
          isYouTube={extractYouTubeVideoId(data.lesson.youtubeUrl) !== null}
          method={transcriptionMethod}
          youtubeGemini={Boolean(geminiKey) && extractYouTubeVideoId(data.lesson.youtubeUrl) !== null}
          lessonId={lessonId}
          status={typeof searchParams?.transcript === "string" ? searchParams.transcript : undefined}
          transcript={data.lesson.transcript}
        />
      </LessonCompletionPanel>

      <LessonBookmarks courseId={courseId} initial={bookmarks} lessonId={lessonId} />

      <LessonNoteEditor
        courseId={courseId}
        initialContent={data.note?.content ?? ""}
        lessonId={lessonId}
      />

      {data.lesson.transcript ? <LessonChat courseId={courseId} enabled={ai.enabled} lessonId={lessonId} /> : null}

      <LessonQuestions courseId={courseId} initial={questions} lessonId={lessonId} />

      {data.lesson.transcript && !data.isCompleted ? (
        <p className="mt-6 rounded-md border border-stroke-subtle bg-surface p-4 text-sm text-copy-secondary">
          Quiz, resumo, mapa mental e baralho desta aula ficam disponiveis depois que voce concluir a aula.
        </p>
      ) : null}

      {data.lesson.transcript && data.isCompleted ? (
        <LessonStudyTools
          aiEnabled={ai.enabled}
          courseId={courseId}
          initialItems={aiItems}
          lessonId={lessonId}
          quizAttempts={quizAttempts}
          techniques={ai.techniques}
        />
      ) : null}
    </section>
  );
}
