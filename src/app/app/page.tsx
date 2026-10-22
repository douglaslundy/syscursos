import Link from "next/link";

import { ContinueLessonBlock } from "@/components/student/continue-lesson-block";
import { CourseCard } from "@/components/student/course-card";
import { EmptyState } from "@/components/student/empty-state";
import { LessonThumbLink } from "@/components/student/lesson-thumb-card";

type StudentHomePageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function StudentHomePage(props: { searchParams: Promise<StudentHomePageProps["searchParams"]> }) {
  const searchParams = await props.searchParams;
  const search = typeof searchParams?.q === "string" ? searchParams.q.trim() : "";
  const { getStudentDashboard } = await import("@/server/services/student-service");
  const { getRecentCourseLessons } = await import("@/server/services/favorite-service");
  const [{ courses: allCourses, continueLesson }, recentLessons] = await Promise.all([
    getStudentDashboard(),
    getRecentCourseLessons(),
  ]);
  const needle = search.toLocaleLowerCase("pt-BR");
  const courses = needle
    ? allCourses.filter((course) => course.title.toLocaleLowerCase("pt-BR").includes(needle))
    : allCourses;

  return (
    <section>
      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Area do aluno</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal md:text-4xl">Meus cursos</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Acesse seus cursos liberados, acompanhe progresso e continue estudando de onde parou.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-md bg-brand-primary px-4 text-sm font-medium text-copy-primary transition hover:bg-brand-primaryHover"
            href="/app/schedule"
          >
            Cronograma de estudos
          </Link>
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-stroke-subtle bg-transparent px-4 text-sm font-medium text-copy-secondary transition hover:bg-surface-hover hover:text-copy-primary"
            href="/app/notebooks"
          >
            Abrir cadernos
          </Link>
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-stroke-subtle bg-transparent px-4 text-sm font-medium text-copy-secondary transition hover:bg-surface-hover hover:text-copy-primary"
            href="/cursos"
          >
            Ver cursos disponiveis
          </Link>
        </div>
      </div>

      {recentLessons.length > 0 ? (
        <div className="mb-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-copy-muted">
            Continue de onde parou
          </p>
          <div className="flex flex-wrap gap-3">
            {recentLessons.map((card) => (
              <LessonThumbLink card={card} compact key={card.courseId} />
            ))}
          </div>
        </div>
      ) : continueLesson ? (
        <div className="mb-6">
          <ContinueLessonBlock card={continueLesson} context="home" />
        </div>
      ) : null}

      {allCourses.length > 1 ? (
        <form action="/app" className="mb-6 flex gap-2" role="search">
          <input
            aria-label="Pesquisar curso pelo nome"
            className="min-h-10 w-full max-w-md rounded-md border border-stroke-subtle bg-surface px-3 text-sm outline-none"
            defaultValue={search}
            name="q"
            placeholder="Pesquisar curso pelo nome"
            type="search"
          />
          <button
            className="inline-flex min-h-10 items-center rounded-md border border-stroke-subtle px-4 text-sm font-medium text-copy-secondary hover:bg-surface-hover hover:text-copy-primary"
            type="submit"
          >
            Buscar
          </button>
        </form>
      ) : null}

      {courses.length === 0 ? (
        <EmptyState
          description={
            search
              ? "Nenhum dos seus cursos tem esse nome. Tente outro termo."
              : "Quando uma matricula ativa estiver vinculada ao seu usuario, o curso aparecera aqui."
          }
          title={search ? "Nenhum curso encontrado" : "Nenhum curso vinculado"}
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
