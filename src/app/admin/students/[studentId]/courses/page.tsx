import Link from "next/link";

import { Pagination } from "@/components/admin/pagination";
import { getCoursesByStudent } from "@/server/services/admin-service";
import { getPagination } from "@/server/validators/pagination";

type StudentCoursesPageProps = {
  params: { studentId: string };
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function StudentCoursesPage({
  params,
  searchParams,
}: StudentCoursesPageProps) {
  const pagination = getPagination(searchParams);
  const { student, enrollments } = await getCoursesByStudent(params.studentId, pagination);

  return (
    <section>
      <Link className="text-sm text-muted-foreground" href="/admin/students">
        Voltar para alunos
      </Link>
      <div className="mb-6 mt-2">
        <h2 className="text-2xl font-semibold tracking-normal">Cursos de {student.user.name}</h2>
        <p className="text-sm text-muted-foreground">{student.user.email}</p>
      </div>
      <div className="space-y-3">
        {enrollments.items.map((enrollment) => (
          <article className="rounded-md border bg-background p-4" key={enrollment.id}>
            <div className="font-medium">{enrollment.course.title}</div>
            <div className="text-sm text-muted-foreground">
              {enrollment.status} - expira em{" "}
              {enrollment.expiresAt
                ? new Intl.DateTimeFormat("pt-BR").format(enrollment.expiresAt)
                : "sem data"}
            </div>
          </article>
        ))}
      </div>
      <Pagination
        basePath={`/admin/students/${student.id}/courses`}
        page={enrollments.page}
        pageCount={enrollments.pageCount}
      />
    </section>
  );
}
