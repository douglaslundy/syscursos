import { CourseCard } from "@/components/student/course-card";
import { EmptyState } from "@/components/student/empty-state";
import { FavoritesTabs } from "@/components/student/favorites-tabs";
import { getFavoriteCourses } from "@/server/services/favorite-service";

export default async function FavoriteCoursesPage() {
  const courses = await getFavoriteCourses();

  return (
    <section>
      <h1 className="mb-6 text-3xl font-semibold tracking-normal md:text-4xl">Favoritos</h1>
      <FavoritesTabs active="courses" />
      {courses.length === 0 ? (
        <EmptyState
          description="Use o botao de favorito na pagina de um curso para ve-lo aqui."
          title="Nenhum curso favorito"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => (
            <CourseCard
              coverImageUrl={course.coverImageUrl}
              description={course.description}
              enrollmentStatus={course.enrollmentStatus}
              expiresAt={course.expiresAt}
              id={course.id}
              key={course.id}
              progress={course.progress}
              title={course.title}
            />
          ))}
        </div>
      )}
    </section>
  );
}
