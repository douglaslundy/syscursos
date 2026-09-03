import Link from "next/link";

import type { ContinueLessonCard } from "@/server/services/student-service";

type ContinueLessonBlockProps = {
  context: "home" | "course";
  card: NonNullable<ContinueLessonCard>;
};

const primaryButtonClass =
  "inline-flex min-h-10 items-center justify-center rounded-md bg-brand-primary px-4 text-sm font-medium text-copy-primary transition hover:bg-brand-primaryHover";
const secondaryButtonClass =
  "inline-flex min-h-10 items-center justify-center rounded-md border border-stroke-subtle bg-transparent px-4 text-sm font-medium text-copy-secondary transition hover:bg-surface-hover hover:text-copy-primary";

export function ContinueLessonBlock({ context, card }: ContinueLessonBlockProps) {
  const eyebrow =
    context === "home"
      ? card.mode === "NEXT_LESSON"
        ? "Proxima aula para assistir"
        : "Rever ultima aula da trilha"
      : card.mode === "NEXT_LESSON"
        ? "Continuar deste curso"
        : "Rever ultima aula do curso";

  const location = `Modulo ${card.modulePosition}: ${card.moduleTitle} • Aula ${card.lessonPosition}`;
  const subtitle = context === "home" ? `${card.courseTitle} • ${location}` : location;
  const hasNextLesson = Boolean(card.nextLessonHref);

  return (
    <section className="rounded-md border border-stroke-subtle bg-surface p-4 shadow-sm md:p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-copy-muted">{eyebrow}</p>
      <h2 className="mt-2 text-lg font-semibold text-copy-primary">{card.lessonTitle}</h2>
      <p className="mt-1 text-sm text-copy-secondary">{subtitle}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        {hasNextLesson ? (
          <>
            <Link className={secondaryButtonClass} href={card.watchAgainHref}>
              Assistir novamente
            </Link>
            <Link className={primaryButtonClass} href={card.nextLessonHref as string}>
              Assistir a proxima aula
            </Link>
          </>
        ) : (
          <Link className={primaryButtonClass} href={card.href}>
            {card.mode === "NEXT_LESSON" ? "Continuar agora" : "Abrir aula"}
          </Link>
        )}
      </div>
    </section>
  );
}
