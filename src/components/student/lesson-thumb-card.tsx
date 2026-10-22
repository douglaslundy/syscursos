import Link from "next/link";

import type { LessonThumbCard } from "@/server/services/favorite-service";

// Thumbnail da aula; curso em destaque no topo e nome da aula abaixo.
export function LessonThumbLink({ card, compact = false }: { card: LessonThumbCard; compact?: boolean }) {
  if (compact) {
    return (
      <Link
        className="group flex w-full items-center gap-3 overflow-hidden rounded-md border border-stroke-subtle bg-surface p-2 transition hover:border-brand-primary/60 hover:bg-surface-hover sm:w-72"
        href={card.href}
      >
        <div
          className="aspect-video w-24 shrink-0 rounded border border-stroke-subtle bg-surface-hover bg-cover bg-center"
          style={card.thumbnailUrl ? { backgroundImage: `url("${card.thumbnailUrl}")` } : undefined}
        />
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-copy-primary">{card.courseTitle}</h3>
          <p className="mt-0.5 line-clamp-2 text-xs text-copy-secondary">{card.lessonTitle}</p>
        </div>
      </Link>
    );
  }

  return (
    <Link
      className="group flex flex-col overflow-hidden rounded-md border border-stroke-subtle bg-surface transition hover:border-brand-primary/60 hover:bg-surface-hover"
      href={card.href}
    >
      <div className="px-4 pt-4">
        <h3 className="text-lg font-semibold text-copy-primary">{card.courseTitle}</h3>
        <p className="mt-1 text-sm text-copy-secondary">{card.lessonTitle}</p>
      </div>
      <div
        className="m-4 aspect-video rounded-md border border-stroke-subtle bg-surface-hover bg-cover bg-center"
        style={card.thumbnailUrl ? { backgroundImage: `url("${card.thumbnailUrl}")` } : undefined}
      />
    </Link>
  );
}
