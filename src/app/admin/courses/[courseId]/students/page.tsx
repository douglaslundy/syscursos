import Link from "next/link";

import { Pagination } from "@/components/admin/pagination";
import { getStudentsByCourse } from "@/server/services/admin-service";
import { getPagination } from "@/server/validators/pagination";

type CourseStudentsPageProps = {
  params: { courseId: string };
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function CourseStudentsPage({
  params,
  searchParams,
}: CourseStudentsPageProps) {
  const pagination = getPagination(searchParams);
  const { course, enrollments } = await getStudentsByCourse(params.courseId, pagination);

  return (
    <section>
      <Link className="text-sm text-muted-foreground" href="/admin/courses">
        Voltar para cursos
      </Link>
      <div className="mb-6 mt-2">
        <h2 className="text-2xl font-semibold tracking-normal">Alunos em {course.title}</h2>
        <p className="text-sm text-muted-foreground">Matriculas vinculadas ao curso.</p>
      </div>
      <div className="space-y-3">
        {enrollments.items.map((enrollment) => (
          <article className="rounded-md border bg-background p-4" key={enrollment.id}>
            <div className="font-medium">{enrollment.student.user.name}</div>
            <div className="text-sm text-muted-foreground">
              {enrollment.student.user.email} - {enrollment.status}
            </div>
          </article>
        ))}
      </div>
      <Pagination
        basePath={`/admin/courses/${course.id}/students`}
        page={enrollments.page}
        pageCount={enrollments.pageCount}
      />
    </section>
  );
}
