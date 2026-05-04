import Link from "next/link";

import { Feedback } from "@/components/admin/feedback";
import { Pagination } from "@/components/admin/pagination";
import { SearchForm } from "@/components/admin/search-form";
import { SubmitButton } from "@/components/admin/submit-button";
import { deleteStudentAction, saveStudentAction } from "@/server/actions/admin-actions";
import { getStudents } from "@/server/services/admin-service";
import { getPagination } from "@/server/validators/pagination";

type StudentsPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function StudentsPage({ searchParams }: StudentsPageProps) {
  const pagination = getPagination(searchParams);
  const students = await getStudents(pagination);
  const status = typeof searchParams?.status === "string" ? searchParams.status : undefined;

  return (
    <section>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-normal">Alunos</h2>
        <p className="text-sm text-muted-foreground">Cadastre, edite, ative e inative alunos.</p>
      </div>
      <Feedback status={status} />
      <div className="mb-6 rounded-md border bg-background p-4">
        <h3 className="mb-4 font-medium">Novo aluno</h3>
        <StudentForm />
      </div>
      <SearchForm query={pagination.query} />
      <div className="space-y-3">
        {students.items.map((student) => (
          <article className="rounded-md border bg-background p-4" key={student.id}>
            <StudentForm
              student={{
                id: student.user.id,
                studentProfileId: student.id,
                name: student.user.name,
                email: student.user.email,
                document: student.document ?? "",
                phone: student.phone ?? "",
                status: student.user.status,
              }}
            />
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <Link
                className="rounded-md border border-stroke-subtle bg-transparent px-3 py-2 text-copy-secondary transition hover:bg-surface-hover hover:text-copy-primary"
                href={`/admin/students/${student.id}/courses`}
              >
                Cursos ({student._count.enrollments})
              </Link>
              <form action={deleteStudentAction}>
                <input name="id" type="hidden" value={student.user.id} />
                <SubmitButton
                  destructive
                  confirmMessage="Remover este aluno e seus dados relacionados?"
                >
                  Remover
                </SubmitButton>
              </form>
            </div>
          </article>
        ))}
      </div>
      <Pagination
        basePath="/admin/students"
        page={students.page}
        pageCount={students.pageCount}
        query={pagination.query}
      />
    </section>
  );
}

type StudentFormProps = {
  student?: {
    id: string;
    studentProfileId: string;
    name: string;
    email: string;
    document: string;
    phone: string;
    status: string;
  };
};

function StudentForm({ student }: StudentFormProps) {
  return (
    <form action={saveStudentAction} className="grid gap-3 md:grid-cols-[1fr_1fr_140px_auto]">
      {student ? (
        <>
          <input name="id" type="hidden" value={student.id} />
          <input name="studentProfileId" type="hidden" value={student.studentProfileId} />
        </>
      ) : null}
      <input
        className="rounded-md border px-3 py-2 text-sm outline-none"
        defaultValue={student?.name}
        name="name"
        placeholder="Nome"
      />
      <input
        className="rounded-md border px-3 py-2 text-sm outline-none"
        defaultValue={student?.email}
        name="email"
        placeholder="email@exemplo.com"
      />
      <select
        className="rounded-md border px-3 py-2 text-sm outline-none"
        defaultValue={student?.status ?? "ACTIVE"}
        name="status"
      >
        <option value="ACTIVE">Ativo</option>
        <option value="INACTIVE">Inativo</option>
      </select>
      <SubmitButton>{student ? "Salvar" : "Criar"}</SubmitButton>
      <input
        className="rounded-md border px-3 py-2 text-sm outline-none"
        defaultValue={student?.document}
        name="document"
        placeholder="Documento"
      />
      <input
        className="rounded-md border px-3 py-2 text-sm outline-none"
        defaultValue={student?.phone}
        name="phone"
        placeholder="Telefone"
      />
    </form>
  );
}
