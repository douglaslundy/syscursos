import { EmptyState } from "@/components/student/empty-state";
import { FavoritesTabs } from "@/components/student/favorites-tabs";
import { LessonThumbLink } from "@/components/student/lesson-thumb-card";
import { getFavoriteLessonGroups } from "@/server/services/favorite-service";

export default async function FavoriteLessonsPage() {
  const groups = await getFavoriteLessonGroups();

  return (
    <section>
      <h1 className="mb-6 text-3xl font-semibold tracking-normal md:text-4xl">Favoritos</h1>
      <FavoritesTabs active="lessons" />
      {groups.length === 0 ? (
        <EmptyState
          description="Use o botao de favorito dentro de uma aula para ve-la aqui."
          title="Nenhuma aula favorita"
        />
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <section key={group.courseId}>
              <h2 className="mb-3 text-xl font-semibold text-copy-primary">{group.courseTitle}</h2>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {group.lessons.map((lesson) => (
                  <LessonThumbLink card={lesson} key={lesson.lessonId} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}
