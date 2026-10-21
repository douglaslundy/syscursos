import Link from "next/link";

import { requestEnrollmentAction } from "@/server/actions/enrollment-request-actions";
import { getCurrentUser } from "@/server/auth/session";
import { listPublicCourses } from "@/server/repositories/enrollment-request-repository";

export const dynamic = "force-dynamic";

const statusMessages: Record<string, string> = {
  requested: "Solicitacao enviada. O produtor vai analisar e liberar seu acesso.",
  already_enrolled: "Voce ja possui acesso a este curso.",
  course_unavailable: "Este curso nao esta mais disponivel.",
  invalid: "Nao foi possivel identificar o curso.",
  error: "Nao foi possivel enviar a solicitacao. Tente novamente.",
};

type PublicCoursesPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function PublicCoursesPage(props: { searchParams: Promise<PublicCoursesPageProps["searchParams"]> }) {
  const searchParams = await props.searchParams;
  const auth = await getCurrentUser("client");
  const studentId = auth.ok && auth.user.role === "STUDENT" ? auth.user.studentProfileId : null;
  const courses = await listPublicCourses(studentId);
  const status = typeof searchParams?.status === "string" ? searchParams.status : undefined;
  const message = status ? statusMessages[status] : undefined;

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-copy-primary">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">SysCursos</p>
        <h1 className="mt-3 text-3xl font-semibold md:text-4xl">Cursos disponiveis</h1>
        <p className="mt-3 max-w-2xl text-sm text-copy-secondary">
          Escolha um curso e solicite sua matricula. O produtor analisa o pedido e libera o acesso.
        </p>
        {message ? (
          <p className="mt-6 rounded-md border border-stroke-subtle bg-surface p-3 text-sm" role="status">
            {message}
          </p>
        ) : null}
        {courses.length === 0 ? (
          <p className="mt-8 text-sm text-copy-secondary">Nenhum curso publico disponivel no momento.</p>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {courses.map((course) => (
              <article
                className="flex flex-col overflow-hidden rounded-md border border-stroke-subtle bg-surface"
                key={course.id}
              >
                {course.coverImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt="" className="aspect-video w-full object-cover" src={course.coverImageUrl} />
                ) : null}
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <h2 className="font-semibold">{course.title}</h2>
                  <p className="text-xs text-copy-muted">Por {course.producer.name}</p>
                  {course.description ? (
                    <p className="line-clamp-3 text-sm text-copy-secondary">{course.description}</p>
                  ) : null}
                  <div className="mt-auto pt-3">
                    <CourseAction courseId={course.id} state={course.state} />
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
        <div className="mt-10 text-sm">
          <Link className="text-copy-secondary hover:text-copy-primary" href={studentId ? "/app" : "/login/client"}>
            {studentId ? "Ir para meus cursos" : "Entrar na minha conta"}
          </Link>
        </div>
      </div>
    </main>
  );
}

function CourseAction({ courseId, state }: { courseId: string; state: "AVAILABLE" | "PENDING" | "ENROLLED" }) {
  if (state === "ENROLLED") {
    return <span className="text-sm text-copy-secondary">Voce ja esta matriculado</span>;
  }

  if (state === "PENDING") {
    return <span className="text-sm text-copy-secondary">Solicitacao pendente de aprovacao</span>;
  }

  return (
    <form action={requestEnrollmentAction}>
      <input name="courseId" type="hidden" value={courseId} />
      <button
        className="inline-flex min-h-10 items-center justify-center rounded-md bg-brand-primary px-4 text-sm font-bold text-copy-primary transition hover:bg-brand-primaryHover"
        type="submit"
      >
        Solicitar matricula
      </button>
    </form>
  );
}
