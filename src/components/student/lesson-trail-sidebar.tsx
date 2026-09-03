"use client";

import { useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, Circle, PlayCircle } from "lucide-react";
import Link from "next/link";

import { ProgressBar } from "@/components/student/progress-bar";

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

type LessonTrailSidebarProps = {
  courseId: string;
  currentLessonId: string;
  currentModuleId: string;
  modules: TrailModule[];
  completedLessonIds: string[];
  progress: {
    completedLessons: number;
    totalLessons: number;
    percentage: number;
  };
};

export function LessonTrailSidebar({
  courseId,
  currentLessonId,
  currentModuleId,
  modules,
  completedLessonIds,
  progress,
}: LessonTrailSidebarProps) {
  const [open, setOpen] = useState(true);
  const [expandedModuleIds, setExpandedModuleIds] = useState<Set<string>>(
    () => new Set([currentModuleId]),
  );
  const completedSet = new Set(completedLessonIds);

  const toggleModule = (moduleId: string) => {
    setExpandedModuleIds((current) => {
      const next = new Set(current);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  return (
    <aside
      className={
        open
          ? "w-[360px] rounded-md border border-stroke-subtle bg-surface p-5 shadow-sm"
          : "w-11 rounded-md border border-stroke-subtle bg-surface p-2 shadow-sm"
      }
    >
      <button
        aria-label={open ? "Fechar trilha de aulas" : "Abrir trilha de aulas"}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-stroke-subtle bg-surface-elevated text-copy-secondary transition hover:border-stroke-strong hover:bg-surface-hover hover:text-copy-primary"
        onClick={() => setOpen((state) => !state)}
        type="button"
      >
        {open ? (
          <ChevronRight aria-hidden="true" className="h-4 w-4" />
        ) : (
          <ChevronLeft aria-hidden="true" className="h-4 w-4" />
        )}
      </button>

      {open ? (
        <div className="mt-4">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.12em] text-copy-muted">
            Trilha de aulas
          </p>
          <div className="mb-5 max-h-[460px] space-y-3 overflow-y-auto pr-1">
            {modules.map((module) => {
              const isExpanded = expandedModuleIds.has(module.id);

              return (
              <div
                className="rounded-md border border-stroke-subtle bg-background p-3"
                key={module.id}
              >
                <button
                  aria-expanded={isExpanded}
                  className="flex w-full cursor-pointer items-center justify-between gap-2 text-left text-sm font-medium text-copy-primary"
                  onClick={() => toggleModule(module.id)}
                  type="button"
                >
                  <span>
                    Modulo {module.position}: {module.title}
                  </span>
                  {isExpanded ? (
                    <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0 rotate-90" />
                  ) : (
                    <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0" />
                  )}
                </button>
                <div className={isExpanded ? "mt-3 space-y-1" : "hidden"}>
                  {isExpanded
                    ? module.lessons.map((lesson) => {
                    const isCurrent = lesson.id === currentLessonId;
                    const completed = completedSet.has(lesson.id);

                    return (
                      <Link
                        aria-current={isCurrent ? "page" : undefined}
                        className={
                          isCurrent
                            ? "flex items-center gap-2 rounded-md bg-surface-hover px-2 py-2 text-sm text-brand-primary"
                            : "flex items-center gap-2 rounded-md px-2 py-2 text-sm text-copy-secondary transition hover:bg-surface-hover hover:text-brand-primary"
                        }
                        href={`/app/courses/${courseId}/lessons/${lesson.id}`}
                        key={lesson.id}
                      >
                        {completed ? (
                          <CheckCircle2 aria-hidden="true" className="h-4 w-4 shrink-0" />
                        ) : isCurrent ? (
                          <PlayCircle aria-hidden="true" className="h-4 w-4 shrink-0" />
                        ) : (
                          <Circle aria-hidden="true" className="h-3 w-3 shrink-0" />
                        )}
                        <span>
                          {lesson.position}. {lesson.title}
                        </span>
                      </Link>
                    );
                      })
                    : null}
                </div>
              </div>
              );
            })}
          </div>
          <ProgressBar
            label={`${progress.completedLessons}/${progress.totalLessons} aulas concluidas`}
            percentage={progress.percentage}
          />
        </div>
      ) : null}
    </aside>
  );
}
