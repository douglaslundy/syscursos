import { Feedback } from "@/components/admin/feedback";
import { SubmitButton } from "@/components/admin/submit-button";
import {
  approveEnrollmentRequestAction,
  rejectEnrollmentRequestAction,
} from "@/server/actions/admin-actions";
import { getPendingEnrollmentRequests } from "@/server/services/admin-service";

type RequestsPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function EnrollmentRequestsPage({ searchParams }: RequestsPageProps) {
  const requests = await getPendingEnrollmentRequests();
  const status = typeof searchParams?.status === "string" ? searchParams.status : undefined;
  const defaultExpiresAt = defaultExpiration();

  return (
    <section>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-normal">Solicitacoes de matricula</h2>
        <p className="text-sm text-muted-foreground">
          Alunos que pediram acesso aos seus cursos publicos. Aprove definindo a validade.
        </p>
      </div>
      <Feedback status={status} />
      {requests.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma solicitacao pendente.</p>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <article className="rounded-md border bg-background p-4" key={request.id}>
              <div className="grid gap-2 md:grid-cols-4">
                <Field label="Aluno" value={request.student.user.name} />
                <Field label="E-mail" value={request.student.user.email} />
                <Field label="Telefone" value={request.student.phone ?? "-"} />
                <Field label="Curso" value={request.course.title} />
              </div>
              <div className="mt-4 flex flex-wrap items-end gap-3">
                <form action={approveEnrollmentRequestAction} className="flex flex-wrap items-end gap-2">
                  <input name="id" type="hidden" value={request.id} />
                  <label className="text-xs text-muted-foreground">
                    Validade ate
                    <input
                      className="mt-1 block rounded-md border px-3 py-2 text-sm outline-none"
                      defaultValue={defaultExpiresAt}
                      name="expiresAt"
                      required
                      type="date"
                    />
                  </label>
                  <SubmitButton>Aprovar</SubmitButton>
                </form>
                <form action={rejectEnrollmentRequestAction}>
                  <input name="id" type="hidden" value={request.id} />
                  <SubmitButton destructive confirmMessage="Recusar esta solicitacao?">
                    Recusar
                  </SubmitButton>
                </form>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="break-words font-medium">{value}</div>
    </div>
  );
}

// Prazo padrao de 12 meses; o produtor pode alterar antes de aprovar.
function defaultExpiration() {
  const date = new Date();
  date.setUTCMonth(date.getUTCMonth() + 12);
  return date.toISOString().slice(0, 10);
}
