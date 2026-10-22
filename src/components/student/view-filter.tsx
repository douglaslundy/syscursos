import Link from "next/link";

import type { ReviewView } from "@/lib/study/review-view";
import { cn } from "@/lib/utils";

const viewLink = "inline-flex min-h-10 items-center justify-center rounded-md border border-stroke-subtle px-4 text-sm font-medium text-copy-secondary transition hover:bg-surface-hover hover:text-copy-primary";
const activeLink = "border-brand-primary bg-brand-primary text-copy-primary hover:bg-brand-primaryHover";

// Filtro "Por cursos" (padrao) / "Aleatoriamente" (cursos misturados) das paginas de revisao e de quiz.
export function ViewFilter({ basePath, view }: { basePath: string; view: ReviewView }) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-2">
      <span className="text-sm text-copy-secondary">Listar:</span>
      <Link aria-current={view === "courses" ? "page" : undefined} className={cn(viewLink, view === "courses" && activeLink)} href={basePath}>
        Por cursos
      </Link>
      <Link aria-current={view === "random" ? "page" : undefined} className={cn(viewLink, view === "random" && activeLink)} href={`${basePath}?view=random`}>
        Aleatoriamente
      </Link>
    </div>
  );
}
