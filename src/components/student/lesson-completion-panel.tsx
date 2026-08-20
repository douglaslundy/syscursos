"use client";

import { type ReactNode, useState, useTransition } from "react";

import { LessonTrailSidebar } from "@/components/student/lesson-trail-sidebar";
import { LessonVideoPlayer } from "@/components/student/lesson-video-player";
import { completeLessonAction } from "@/server/actions/student-actions";

type TrailModule = {
  id: string;
  title: string;
  position: number;
  lessons: Array<{
    id: string;
    title: string;
    position: number;
  }>;
};

type LessonProgress = {
  completedLessons: number;
  totalLessons: number;
  percentage: number;
};

type LessonCompletionPanelProps = {
  courseId: string;
  lessonId: string;
  title: string;
  videoEmbed: { url: string; supportsCompletionTracking: boolean } | null;
  initialIsCompleted: boolean;
  completedLessonIds: string[];
  currentModuleId: string;
  modules: TrailModule[];
  progress: LessonProgress;
  children?: ReactNode;
};

function adjustProgress(progress: LessonProgress, delta: -1 | 1): LessonProgress {
  const completedLessons = Math.min(
    progress.totalLessons,
    Math.max(0, progress.completedLessons + delta),
  );
  const percentage =
    progress.totalLessons > 0 ? Math.round((completedLessons / progress.totalLessons) * 100) : 0;

  return { ...progress, completedLessons, percentage };
}

export function LessonCompletionPanel({
  courseId,
  lessonId,
  title,
  videoEmbed,
  initialIsCompleted,
  completedLessonIds,
  currentModuleId,
  modules,
  progress: initialProgress,
  children,
}: LessonCompletionPanelProps) {
  const [isCompleted, setIsCompleted] = useState(initialIsCompleted);
  const [progress, setProgress] = useState(initialProgress);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const setCompletion = (next: boolean) => {
    if (next === isCompleted) {
      return;
    }

    startTransition(async () => {
      const result = await completeLessonAction({ courseId, lessonId, isCompleted: next });

      if (!result.ok) {
        setFeedback(result.message);
        return;
      }

      setIsCompleted(result.isCompleted);
      setProgress((current) => adjustProgress(current, result.isCompleted ? 1 : -1));
      setFeedback(result.isCompleted ? "Aula marcada como concluida." : "Marcacao de conclusao removida.");
    });
  };

  const effectiveCompletedLessonIds = isCompleted
    ? [...completedLessonIds, lessonId]
    : completedLessonIds;

  return (
    <>
      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div className="overflow-hidden rounded-md border border-stroke-subtle bg-black shadow-sm shadow-black/20">
          <LessonVideoPlayer onEnded={() => setCompletion(true)} title={title} videoEmbed={videoEmbed} />
        </div>
        <LessonTrailSidebar
          completedLessonIds={effectiveCompletedLessonIds}
          courseId={courseId}
          currentLessonId={lessonId}
          currentModuleId={currentModuleId}
          modules={modules}
          progress={progress}
        />
      </div>

      {children}

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-brand-primary px-4 text-sm font-medium text-copy-primary transition hover:bg-brand-primaryHover disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isPending}
          onClick={() => setCompletion(!isCompleted)}
          type="button"
        >
          {isCompleted ? "Desmarcar aula concluida" : "Marcar como concluida"}
        </button>
        <span aria-live="polite" className="text-sm text-copy-secondary">
          {isPending ? "Salvando..." : feedback}
        </span>
      </div>
    </>
  );
}
