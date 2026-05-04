import Link from "next/link";

export default async function StudentHomePage() {
  const { getStudentDashboard } = await import("@/server/services/student-service");
  const { courses } = await getStudentDashboard();

  return (
    <section>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-normal">Meus cursos</h1>
        <p className="text-sm text-muted-foreground">
          Acesse seus cursos liberados e acompanhe seu progresso.
        </p>
      </div>

      {courses.length === 0 ? (
        <div className="rounded-md border p-6 text-sm text-muted-foreground">
          Nenhum curso vinculado ao seu usuario.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {courses.map((course) => (
            <Link
              className="rounded-md border bg-background p-4 hover:bg-muted/60"
              href={`/app/courses/${course.id}`}
              key={course.id}
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-semibold tracking-normal">{course.title}</h2>
                <span className="rounded-md border px-2 py-1 text-xs">
                  {labelForStatus(course.enrollmentStatus)}
                </span>
              </div>
              <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                {course.description ?? "Curso disponivel para estudo."}
              </p>
              <div className="mt-4">
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-muted-foreground">Progresso</span>
                  <span>{course.progress.percentage}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${course.progress.percentage}%` }}
                  />
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Expira em{" "}
                {course.expiresAt
                  ? new Intl.DateTimeFormat("pt-BR").format(course.expiresAt)
                  : "sem data"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function labelForStatus(status: string) {
  if (status === "AVAILABLE") {
    return "Liberado";
  }

  if (status === "EXPIRED") {
    return "Expirado";
  }

  return "Bloqueado";
}
