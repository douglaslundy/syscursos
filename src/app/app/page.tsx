import Link from "next/link";

import { CourseCard } from "@/components/student/course-card";
import { EmptyState } from "@/components/student/empty-state";

export default async function StudentHomePage() {
  const { getStudentDashboard } = await import("@/server/services/student-service");
  const { courses, continueLesson } = await getStudentDashboard();

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
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-stroke-subtle bg-transparent px-4 text-sm font-medium text-copy-secondary transition hover:bg-surface-hover hover:text-copy-primary"
            href="/app/notebooks"
          >
            Abrir cadernos
          </Link>
        </div>
      </div>

      {continueLesson ? (
        <section className="mb-6 rounded-md border border-stroke-subtle bg-surface p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-copy-muted">
            {continueLesson.mode === "NEXT_LESSON" ? "Proxima aula para assistir" : "Rever ultima aula da trilha"}
          </p>
          <h2 className="mt-2 text-lg font-semibold text-copy-primary">{continueLesson.lessonTitle}</h2>
          <p className="mt-1 text-sm text-copy-secondary">
            {continueLesson.courseTitle} • Modulo {continueLesson.modulePosition}: {continueLesson.moduleTitle} • Aula{" "}
            {continueLesson.lessonPosition}
          </p>
          <Link
            className="mt-3 inline-flex min-h-10 items-center justify-center rounded-md bg-brand-primary px-4 text-sm font-medium text-copy-primary transition hover:bg-brand-primaryHover"
            href={continueLesson.href}
          >
            {continueLesson.mode === "NEXT_LESSON" ? "Continuar agora" : "Abrir aula"}
          </Link>
        </section>
      ) : null}

      {courses.length === 0 ? (
        <EmptyState
          description="Quando uma matricula ativa estiver vinculada ao seu usuario, o curso aparecera aqui."
          title="Nenhum curso vinculado"
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
