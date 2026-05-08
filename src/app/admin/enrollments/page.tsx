import Link from "next/link";

import { Feedback } from "@/components/admin/feedback";
import { Pagination } from "@/components/admin/pagination";
import { SearchForm } from "@/components/admin/search-form";
import { SubmitButton } from "@/components/admin/submit-button";
import { cancelEnrollmentAction, saveEnrollmentAction } from "@/server/actions/admin-actions";
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
  let enrollments;
  let students;
  let courses;

  try {
    // Load sequentially to reduce concurrent DB connections on constrained pools.
    enrollments = await getEnrollments(pagination);
    students = await getStudentOptions();
    courses = await getCourseOptions();
  } catch (error) {
    console.error("Failed to load enrollments admin page.", error);
    return (
      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-semibold tracking-normal">Matriculas</h2>
          <p className="text-sm text-muted-foreground">
            Vincule alunos a cursos e gerencie validade de acesso.
          </p>
        </div>
        <Feedback status="error" />
      </section>
    );
  }
  const status = typeof searchParams?.status === "string" ? searchParams.status : undefined;
  const editId = getStringParam(searchParams, "editId");
  const editingEnrollment = enrollments.items.find((enrollment) => enrollment.id === editId);

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
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-medium">
            {editingEnrollment ? "Editar matricula" : "Nova matricula"}
          </h3>
          {editingEnrollment ? (
            <Link
              className="text-sm text-muted-foreground hover:text-foreground"
              href="/admin/enrollments"
            >
              Cancelar edicao
            </Link>
          ) : null}
        </div>
        <EnrollmentForm
          courses={courses}
          enrollment={
            editingEnrollment
              ? {
                  id: editingEnrollment.id,
                  studentId: editingEnrollment.studentId,
                  courseId: editingEnrollment.courseId,
                  startsAt: editingEnrollment.startsAt,
                  expiresAt: editingEnrollment.expiresAt,
                  status: editingEnrollment.status,
                }
              : undefined
          }
          students={students}
        />
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
              <Link
                className="rounded-md border border-stroke-subtle bg-transparent px-3 py-2 text-sm text-copy-secondary transition hover:bg-surface-hover hover:text-copy-primary"
                href={adminEditHref("/admin/enrollments", searchParams, enrollment.id)}
              >
                Editar
              </Link>
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
  enrollment?: {
    id: string;
    studentId: string;
    courseId: string;
    startsAt: Date;
    expiresAt: Date | null;
    status: string;
  };
};

function EnrollmentForm({ students, courses, enrollment }: EnrollmentFormProps) {
  return (
    <form
      action={saveEnrollmentAction}
      className="grid gap-3 md:grid-cols-[1fr_1fr_150px_150px_140px_auto]"
    >
      {enrollment ? <input name="id" type="hidden" value={enrollment.id} /> : null}
      <select
        className="rounded-md border px-3 py-2 text-sm outline-none"
        defaultValue={enrollment?.studentId ?? ""}
        name="studentId"
        required
      >
        <option value="">Aluno</option>
        {students.map((student) => (
          <option key={student.id} value={student.id}>
            {student.user.name} ({student.user.email})
          </option>
        ))}
      </select>
      <select
        className="rounded-md border px-3 py-2 text-sm outline-none"
        defaultValue={enrollment?.courseId ?? ""}
        name="courseId"
        required
      >
        <option value="">Curso</option>
        {courses.map((course) => (
          <option key={course.id} value={course.id}>
            {course.title}
          </option>
        ))}
      </select>
      <input
        className="rounded-md border px-3 py-2 text-sm outline-none"
        defaultValue={formatDateInput(enrollment?.startsAt)}
        name="startsAt"
        required
        type="date"
      />
      <input
        className="rounded-md border px-3 py-2 text-sm outline-none"
        defaultValue={formatDateInput(enrollment?.expiresAt)}
        name="expiresAt"
        type="date"
      />
      <select
        className="rounded-md border px-3 py-2 text-sm outline-none"
        defaultValue={enrollment?.status ?? "ACTIVE"}
        name="status"
      >
        <option value="ACTIVE">Ativa</option>
        <option value="EXPIRED">Expirada</option>
        <option value="CANCELED">Cancelada</option>
      </select>
      <SubmitButton>{enrollment ? "Salvar" : "Matricular"}</SubmitButton>
    </form>
  );
}

function formatDate(date: Date | null) {
  return date ? new Intl.DateTimeFormat("pt-BR").format(date) : "Sem expiracao";
}

function formatDateInput(date: Date | null | undefined) {
  return date ? date.toISOString().slice(0, 10) : "";
}

function getStringParam(
  searchParams: EnrollmentsPageProps["searchParams"],
  key: string,
): string | undefined {
  const value = searchParams?.[key];
  return typeof value === "string" ? value : undefined;
}

function adminEditHref(
  basePath: string,
  searchParams: EnrollmentsPageProps["searchParams"],
  editId: string,
) {
  const params = new URLSearchParams();
  const page = getStringParam(searchParams, "page");
  const pageSize = getStringParam(searchParams, "pageSize");
  const query = getStringParam(searchParams, "query");

  if (page) params.set("page", page);
  if (pageSize) params.set("pageSize", pageSize);
  if (query) params.set("query", query);
  params.set("editId", editId);

  return `${basePath}?${params.toString()}`;
}
