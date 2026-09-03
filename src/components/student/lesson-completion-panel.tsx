"use client";

import { type ReactNode, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

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
  nextLessonId?: string | null;
  nextLessonTitle?: string | null;
  children?: ReactNode;
};

const AUTO_ADVANCE_SECONDS = 5;

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
  nextLessonId,
  nextLessonTitle,
  children,
}: LessonCompletionPanelProps) {
  const router = useRouter();
  const pushRef = useRef(router.push);
  pushRef.current = router.push;
  const [isCompleted, setIsCompleted] = useState(initialIsCompleted);
  const [progress, setProgress] = useState(initialProgress);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(AUTO_ADVANCE_SECONDS);
  const [isPending, startTransition] = useTransition();

  const nextLessonHref = nextLessonId
    ? `/app/courses/${courseId}/lessons/${nextLessonId}`
    : null;

  useEffect(() => {
    if (!isCountingDown || !nextLessonHref) {
      return;
    }

    let canceled = false;
    setSecondsLeft(AUTO_ADVANCE_SECONDS);
    const navTimer = setTimeout(() => {
      if (!canceled) {
        pushRef.current(nextLessonHref);
      }
    }, AUTO_ADVANCE_SECONDS * 1000);
    const tickTimer = setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);

    return () => {
      canceled = true;
      clearTimeout(navTimer);
      clearInterval(tickTimer);
    };
  }, [isCountingDown, nextLessonHref]);

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

      if (result.isCompleted && nextLessonHref) {
        setSecondsLeft(AUTO_ADVANCE_SECONDS);
        setIsCountingDown(true);
      } else {
        setIsCountingDown(false);
      }
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

      {isCountingDown && nextLessonHref ? (
        <div
          aria-live="polite"
          className="mt-4 flex flex-wrap items-center gap-3 rounded-md border border-brand-primary/40 bg-surface p-4"
        >
          <p className="text-sm text-copy-primary">
            Proxima aula{nextLessonTitle ? `: ${nextLessonTitle}` : ""} em {secondsLeft}s
          </p>
          <button
            className="inline-flex min-h-9 items-center justify-center rounded-md bg-brand-primary px-3 text-sm font-medium text-copy-primary transition hover:bg-brand-primaryHover"
            onClick={() => router.push(nextLessonHref)}
            type="button"
          >
            Ir agora
          </button>
          <button
            className="inline-flex min-h-9 items-center justify-center rounded-md border border-stroke-subtle bg-transparent px-3 text-sm font-medium text-copy-secondary transition hover:bg-surface-hover hover:text-copy-primary"
            onClick={() => setIsCountingDown(false)}
            type="button"
          >
            Cancelar
          </button>
        </div>
      ) : null}

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
