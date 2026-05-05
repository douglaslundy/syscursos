import { ArrowRight, Clock3 } from "lucide-react";
import Link from "next/link";

import { ProgressBar } from "@/components/student/progress-bar";
import { cn } from "@/lib/utils";

type CourseCardProps = {
  id: string;
  title: string;
  description: string | null;
  expiresAt: Date | null;
  enrollmentStatus: string;
  progress: {
    percentage: number;
    completedLessons: number;
    totalLessons: number;
  };
};

export function CourseCard({
  id,
  title,
  description,
  expiresAt,
  enrollmentStatus,
  progress,
}: CourseCardProps) {
  return (
    <Link
      className="group flex min-h-56 flex-col justify-between rounded-md border border-stroke-subtle bg-surface p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-primary/60 hover:bg-surface-hover hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring"
      href={`/app/courses/${id}`}
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <span
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium",
              enrollmentStatus === "AVAILABLE" && "bg-brand-primary text-copy-primary",
              enrollmentStatus === "EXPIRED" && "bg-surface-elevated text-copy-secondary",
              enrollmentStatus === "CANCELED" && "bg-danger/15 text-danger",
              enrollmentStatus !== "AVAILABLE" &&
                enrollmentStatus !== "EXPIRED" &&
                enrollmentStatus !== "CANCELED" &&
                "bg-surface-elevated text-copy-muted",
            )}
          >
            {labelForStatus(enrollmentStatus)}
          </span>
          <ArrowRight
            aria-hidden="true"
            className="h-4 w-4 text-copy-muted transition group-hover:translate-x-0.5 group-hover:text-brand-primary"
          />
        </div>
        <h2 className="mt-5 line-clamp-2 text-lg font-semibold leading-tight tracking-normal text-copy-primary">
          {title}
        </h2>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-copy-secondary">
          {description ?? "Curso disponivel para estudo."}
        </p>
      </div>

      <div className="mt-6 space-y-4">
        <ProgressBar
          label={`${progress.completedLessons}/${progress.totalLessons} aulas`}
          percentage={progress.percentage}
        />
        <p className="flex items-center gap-2 text-xs text-copy-muted">
          <Clock3 aria-hidden="true" className="h-3.5 w-3.5" />
          Expira em {expiresAt ? new Intl.DateTimeFormat("pt-BR").format(expiresAt) : "sem data"}
        </p>
      </div>
    </Link>
  );
}

function labelForStatus(status: string) {
  if (status === "AVAILABLE") {
    return "Liberado";
  }

  if (status === "EXPIRED") {
    return "Expirado";
  }

  if (status === "CANCELED") {
    return "Cancelado";
  }

  return "Bloqueado";
}
