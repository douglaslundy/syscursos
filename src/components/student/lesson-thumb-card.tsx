import Link from "next/link";

import type { LessonThumbCard } from "@/server/services/favorite-service";

// Thumbnail da aula; curso em destaque no topo e nome da aula abaixo.
export function LessonThumbLink({ card }: { card: LessonThumbCard }) {
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
