import { Star } from "lucide-react";

import { toggleCourseFavoriteAction, toggleLessonFavoriteAction } from "@/server/actions/favorite-actions";
import { cn } from "@/lib/utils";

type FavoriteButtonProps = {
  courseId: string;
  lessonId?: string;
  isFavorite: boolean;
};

export function FavoriteButton({ courseId, lessonId, isFavorite }: FavoriteButtonProps) {
  const label = isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos";

  return (
    <form action={lessonId ? toggleLessonFavoriteAction : toggleCourseFavoriteAction}>
      <input name="courseId" type="hidden" value={courseId} />
      {lessonId ? <input name="lessonId" type="hidden" value={lessonId} /> : null}
      <input name="favorite" type="hidden" value={String(!isFavorite)} />
      <button
        aria-label={label}
        aria-pressed={isFavorite}
        className="inline-flex min-h-10 items-center gap-2 rounded-md border border-stroke-subtle bg-transparent px-3 text-sm font-medium text-copy-secondary transition hover:bg-surface-hover hover:text-copy-primary"
        title={label}
        type="submit"
      >
        <Star
          aria-hidden="true"
          className={cn("h-4 w-4", isFavorite && "fill-brand-primary text-brand-primary")}
        />
        {isFavorite ? "Favorito" : "Favoritar"}
      </button>
    </form>
  );
}
