import Link from "next/link";
import { UserStatus } from "@prisma/client";

import { Feedback } from "@/components/admin/feedback";
import { Pagination } from "@/components/admin/pagination";
import { SearchForm } from "@/components/admin/search-form";
import { SubmitButton } from "@/components/admin/submit-button";
import {
  deleteStudentAction,
  linkStudentToProducerAction,
  saveStudentAction,
  verifyStudentEmailAction,
} from "@/server/actions/admin-actions";
import { getStudentForEdit, getStudents, lookupStudentByEmail } from "@/server/services/admin-service";
import { getPagination } from "@/server/validators/pagination";

type StudentsPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function StudentsPage({ searchParams }: StudentsPageProps) {
  const pagination = getPagination(searchParams);
  const students = await getStudents(pagination);
  const status = typeof searchParams?.status === "string" ? searchParams.status : undefined;
  const editId = getStringParam(searchParams, "editId");
  const lookupEmail = getStringParam(searchParams, "lookupEmail");
  const shouldLookup = Boolean(lookupEmail && !editId);
  const editingStudent = editId ? await getStudentForEdit(editId) : null;
  const lookupResult = shouldLookup ? await lookupStudentByEmail({ email: lookupEmail as string }) : null;
  const lookupFoundStudent = lookupResult ?? null;
  const lookupNotFound = Boolean(lookupEmail && !lookupResult);

  return (
    <section>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-normal">Alunos</h2>
        <p className="text-sm text-muted-foreground">Verifique por e-mail para cadastrar ou vincular alunos.</p>
      </div>
      <Feedback status={status} />
      <div className="mb-6 rounded-md border bg-background p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-medium">
            {editingStudent ? "Editar aluno" : "Cadastro e vinculo por e-mail"}
          </h3>
          {editingStudent ? (
            <Link className="text-sm text-muted-foreground hover:text-foreground" href="/admin/students">
              Cancelar edicao
            </Link>
          ) : null}
        </div>
        {editingStudent ? (
          <StudentEditForm
            key={editingStudent.user.id}
            student={{
              id: editingStudent.user.id,
              studentProfileId: editingStudent.id,
              name: editingStudent.user.name,
              email: editingStudent.user.email,
              document: editingStudent.document ?? "",
              phone: editingStudent.phone ?? "",
              status: editingStudent.user.status,
            }}
          />
        ) : (
          <>
            <EmailLookupForm initialEmail={lookupEmail} />
            {lookupNotFound && lookupEmail ? (
              <div className="mt-4 rounded-md border border-stroke-subtle p-4">
                <p className="mb-3 text-sm text-muted-foreground">
                  E-mail nao encontrado na plataforma. Complete o cadastro do aluno.
                </p>
                <StudentCreateForm initialEmail={lookupEmail} />
              </div>
            ) : null}
            {lookupFoundStudent ? (
              <div className="mt-4 rounded-md border border-stroke-subtle p-4">
                <p className="mb-3 text-sm text-muted-foreground">
                  Aluno encontrado. Os dados estao bloqueados para edicao; voce pode apenas vincular.
                </p>
                <StudentReadonlyView student={lookupFoundStudent} />
                <form action={linkStudentToProducerAction} className="mt-4 flex flex-wrap items-center gap-2">
                  <input name="studentProfileId" type="hidden" value={lookupFoundStudent.studentProfileId} />
                  {lookupFoundStudent.alreadyLinked ? (
                    <button
                      className="rounded-md border border-stroke-subtle bg-transparent px-3 py-2 text-sm text-copy-secondary opacity-70"
                      disabled
                      type="button"
                    >
                      Aluno ja vinculado
                    </button>
                  ) : (
                    <SubmitButton>Vincular aluno ao produtor</SubmitButton>
                  )}
                  <Link className="text-sm text-muted-foreground hover:text-foreground" href="/admin/students">
                    Consultar outro e-mail
                  </Link>
                </form>
              </div>
            ) : null}
          </>
        )}
      </div>
      <SearchForm query={pagination.query} />
      <div className="space-y-3">
        {students.items.map((student) => (
          <article className="rounded-md border bg-background p-4" key={student.id}>
            <div className="grid gap-2 md:grid-cols-[1.2fr_1.4fr_120px]">
              <div>
                <div className="text-xs text-muted-foreground">Nome</div>
                <div className="font-medium">{student.user.name}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">E-mail</div>
                <div className="text-sm text-muted-foreground">{student.user.email}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Status</div>
                <div className="text-sm">{student.user.status}</div>
              </div>
            </div>
            <div className="mt-3 grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
              <div>Documento: {student.document ?? "Nao informado"}</div>
              <div>Telefone: {student.phone ?? "Nao informado"}</div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <Link
                className="rounded-md border border-stroke-subtle bg-transparent px-3 py-2 text-copy-secondary transition hover:bg-surface-hover hover:text-copy-primary"
                href={adminEditHref("/admin/students", searchParams, student.user.id)}
              >
                Editar
              </Link>
              <Link
                className="rounded-md border border-stroke-subtle bg-transparent px-3 py-2 text-copy-secondary transition hover:bg-surface-hover hover:text-copy-primary"
                href={`/admin/students/${student.id}/courses`}
              >
                Cursos ({student._count.enrollments})
              </Link>
              <form action={deleteStudentAction}>
                <input name="id" type="hidden" value={student.user.id} />
                <SubmitButton destructive confirmMessage="Remover somente o vinculo deste aluno com voce?">
                  Remover vinculo
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

function getStringParam(
  searchParams: StudentsPageProps["searchParams"],
  key: string,
): string | undefined {
  const value = searchParams?.[key];
  return typeof value === "string" ? value : undefined;
}

function adminEditHref(
  basePath: string,
  searchParams: StudentsPageProps["searchParams"],
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

function EmailLookupForm({ initialEmail }: { initialEmail?: string }) {
  return (
    <form action={verifyStudentEmailAction} className="grid gap-3 md:grid-cols-[1fr_auto]">
      <input
        autoComplete="off"
        className="rounded-md border px-3 py-2 text-sm outline-none"
        defaultValue={initialEmail ?? ""}
        name="email"
        placeholder="email@exemplo.com"
        type="email"
      />
      <SubmitButton>Verificar e-mail</SubmitButton>
    </form>
  );
}

function StudentEditForm({ student }: { student: NonNullable<StudentFormProps["student"]> }) {
  return (
    <form
      action={saveStudentAction}
      autoComplete="off"
      className="grid gap-3 md:grid-cols-[1fr_1fr_160px_140px_auto]"
    >
      <input name="studentUserId" type="hidden" value={student.id} />
      <input name="studentProfileId" type="hidden" value={student.studentProfileId} />
      <input
        autoComplete="off"
        className="rounded-md border px-3 py-2 text-sm outline-none"
        defaultValue={student.name}
        key={`${student.id}-name`}
        name="studentName"
        placeholder="Nome"
      />
      <input
        autoComplete="off"
        className="rounded-md border px-3 py-2 text-sm outline-none"
        defaultValue={student.email}
        key={`${student.id}-email`}
        name="studentEmail"
        placeholder="email@exemplo.com"
      />
      <input
        autoComplete="new-password"
        className="rounded-md border px-3 py-2 text-sm outline-none"
        key={`${student.id}-password`}
        minLength={8}
        name="studentPassword"
        placeholder="Nova senha opcional"
        type="password"
      />
      <select
        className="rounded-md border px-3 py-2 text-sm outline-none"
        defaultValue={student.status}
        key={`${student.id}-status`}
        name="studentStatus"
      >
        <option value="ACTIVE">Ativo</option>
        <option value="INACTIVE">Inativo</option>
      </select>
      <SubmitButton>Salvar</SubmitButton>
      <input
        autoComplete="off"
        className="rounded-md border px-3 py-2 text-sm outline-none"
        defaultValue={student.document}
        key={`${student.id}-document`}
        name="studentDocument"
        placeholder="Documento"
      />
      <input
        autoComplete="off"
        className="rounded-md border px-3 py-2 text-sm outline-none"
        defaultValue={student.phone}
        key={`${student.id}-phone`}
        name="studentPhone"
        placeholder="Telefone"
      />
      <p className="text-xs text-muted-foreground md:col-span-5">
        A senha inicial cria o acesso do aluno no Supabase Auth. Em edicoes, preencha somente para
        trocar a senha.
      </p>
    </form>
  );
}

function StudentCreateForm({ initialEmail }: { initialEmail: string }) {
  return (
    <form
      action={saveStudentAction}
      autoComplete="off"
      className="grid gap-3 md:grid-cols-[1fr_1fr_160px_140px_auto]"
    >
      <input
        autoComplete="off"
        className="rounded-md border px-3 py-2 text-sm outline-none"
        name="studentName"
        placeholder="Nome"
      />
      <input
        autoComplete="off"
        className="rounded-md border px-3 py-2 text-sm outline-none"
        defaultValue={initialEmail}
        name="studentEmail"
        placeholder="email@exemplo.com"
      />
      <input
        autoComplete="new-password"
        className="rounded-md border px-3 py-2 text-sm outline-none"
        minLength={8}
        name="studentPassword"
        placeholder="Senha inicial (opcional)"
        type="password"
      />
      <select className="rounded-md border px-3 py-2 text-sm outline-none" defaultValue="ACTIVE" name="studentStatus">
        <option value="ACTIVE">Ativo</option>
        <option value="INACTIVE">Inativo</option>
      </select>
      <SubmitButton>Criar e vincular</SubmitButton>
      <input
        autoComplete="off"
        className="rounded-md border px-3 py-2 text-sm outline-none"
        name="studentDocument"
        placeholder="Documento"
      />
      <input
        autoComplete="off"
        className="rounded-md border px-3 py-2 text-sm outline-none"
        name="studentPhone"
        placeholder="Telefone"
      />
      <p className="text-xs text-muted-foreground md:col-span-5">
        A senha inicial e opcional. Se nao for informada, o sistema cria o aluno e mantem apenas o vinculo para gestao.
      </p>
    </form>
  );
}

function StudentReadonlyView({
  student,
}: {
  student: {
    email: string;
    name: string;
    document: string | null;
    phone: string | null;
    status: UserStatus;
  };
}) {
  return (
    <div className="grid gap-3 md:grid-cols-[1fr_1fr_160px_140px_auto]">
      <input className="rounded-md border px-3 py-2 text-sm outline-none" readOnly value={student.name} />
      <input className="rounded-md border px-3 py-2 text-sm outline-none" readOnly value={student.email} />
      <input className="rounded-md border px-3 py-2 text-sm outline-none" readOnly value="********" />
      <input className="rounded-md border px-3 py-2 text-sm outline-none" readOnly value={student.status} />
      <div />
      <input
        className="rounded-md border px-3 py-2 text-sm outline-none"
        readOnly
        value={student.document ?? ""}
      />
      <input className="rounded-md border px-3 py-2 text-sm outline-none" readOnly value={student.phone ?? ""} />
    </div>
  );
}
