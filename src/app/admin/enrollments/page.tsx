import Link from "next/link";

import { Feedback } from "@/components/admin/feedback";
import { Pagination } from "@/components/admin/pagination";
import { SearchForm } from "@/components/admin/search-form";
import { SubmitButton } from "@/components/admin/submit-button";
import {
  cancelEnrollmentAction,
  renewEnrollmentAction,
  saveEnrollmentAction,
} from "@/server/actions/admin-actions";
import {
  getCourseOptions,
  getEnrollments,
  getStudentOptions,
} from "@/server/services/admin-service";
import { getPagination } from "@/server/validators/pagination";

type EnrollmentsPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function EnrollmentsPage({ searchParams }: EnrollmentsPageProps) {
  const pagination = getPagination(searchParams);
  const [enrollments, students, courses] = await Promise.all([
    getEnrollments(pagination),
    getStudentOptions(),
    getCourseOptions(),
  ]);
  const status = typeof searchParams?.status === "string" ? searchParams.status : undefined;

  return (
    <section>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-normal">Matriculas</h2>
        <p className="text-sm text-muted-foreground">
          Vincule alunos a cursos e gerencie validade de acesso.
        </p>
      </div>
      <Feedback status={status} />
      <div className="mb-6 rounded-md border bg-background p-4">
        <h3 className="mb-4 font-medium">Nova matricula</h3>
        <EnrollmentForm courses={courses} students={students} />
      </div>
      <SearchForm query={pagination.query} />
      <div className="space-y-3">
        {enrollments.items.map((enrollment) => (
          <article className="rounded-md border bg-background p-4" key={enrollment.id}>
            <div className="grid gap-2 md:grid-cols-4">
              <div>
                <div className="text-xs text-muted-foreground">Aluno</div>
                <Link
                  className="font-medium"
                  href={`/admin/students/${enrollment.studentId}/courses`}
                >
                  {enrollment.student.user.name}
                </Link>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Curso</div>
                <Link
                  className="font-medium"
                  href={`/admin/courses/${enrollment.courseId}/students`}
                >
                  {enrollment.course.title}
                </Link>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Status</div>
                {enrollment.status}
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Expira em</div>
                {formatDate(enrollment.expiresAt)}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <form action={renewEnrollmentAction} className="flex gap-2">
                <input name="id" type="hidden" value={enrollment.id} />
                <input
                  className="rounded-md border px-3 py-2 text-sm outline-none"
                  name="expiresAt"
                  required
                  type="date"
                />
                <SubmitButton>Renovar</SubmitButton>
              </form>
              <form action={cancelEnrollmentAction}>
                <input name="id" type="hidden" value={enrollment.id} />
                <SubmitButton destructive confirmMessage="Cancelar esta matricula?">
                  Cancelar
                </SubmitButton>
              </form>
            </div>
          </article>
        ))}
      </div>
      <Pagination
        basePath="/admin/enrollments"
        page={enrollments.page}
        pageCount={enrollments.pageCount}
        query={pagination.query}
      />
    </section>
  );
}

type EnrollmentFormProps = {
  students: Array<{ id: string; user: { name: string; email: string } }>;
  courses: Array<{ id: string; title: string }>;
};

function EnrollmentForm({ students, courses }: EnrollmentFormProps) {
  return (
    <form
      action={saveEnrollmentAction}
      className="grid gap-3 md:grid-cols-[1fr_1fr_150px_150px_140px_auto]"
    >
      <select className="rounded-md border px-3 py-2 text-sm outline-none" name="studentId" required>
        <option value="">Aluno</option>
        {students.map((student) => (
          <option key={student.id} value={student.id}>
            {student.user.name} ({student.user.email})
          </option>
        ))}
      </select>
      <select className="rounded-md border px-3 py-2 text-sm outline-none" name="courseId" required>
        <option value="">Curso</option>
        {courses.map((course) => (
          <option key={course.id} value={course.id}>
            {course.title}
          </option>
        ))}
      </select>
      <input className="rounded-md border px-3 py-2 text-sm outline-none" name="startsAt" required type="date" />
      <input className="rounded-md border px-3 py-2 text-sm outline-none" name="expiresAt" type="date" />
      <select className="rounded-md border px-3 py-2 text-sm outline-none" defaultValue="ACTIVE" name="status">
        <option value="ACTIVE">Ativa</option>
        <option value="EXPIRED">Expirada</option>
        <option value="CANCELED">Cancelada</option>
      </select>
      <SubmitButton>Matricular</SubmitButton>
    </form>
  );
}

function formatDate(date: Date | null) {
  return date ? new Intl.DateTimeFormat("pt-BR").format(date) : "Sem expiracao";
}
