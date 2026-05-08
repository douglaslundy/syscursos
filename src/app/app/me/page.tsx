import { Feedback } from "@/components/admin/feedback";
import { saveOwnStudentProfileAction } from "@/server/actions/student-actions";
import { getOwnStudentProfile } from "@/server/services/student-service";

type StudentMePageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function StudentMePage({ searchParams }: StudentMePageProps) {
  const profile = await getOwnStudentProfile();
  const status = typeof searchParams?.status === "string" ? searchParams.status : undefined;

  return (
    <section>
      <div className="mb-8">
        <p className="text-sm font-medium text-primary">Area do aluno</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal md:text-4xl">Meus dados</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Atualize suas informacoes pessoais. O CPF nao pode ser alterado por esta tela.
        </p>
      </div>
      <Feedback status={status} />
      <form action={saveOwnStudentProfileAction} className="grid max-w-2xl gap-3 rounded-md border bg-background p-4">
        <input className="rounded-md border px-3 py-2 text-sm outline-none" defaultValue={profile.user.email} disabled type="email" />
        <input className="rounded-md border px-3 py-2 text-sm outline-none" defaultValue={profile.user.name} name="name" required />
        <input className="rounded-md border px-3 py-2 text-sm outline-none" defaultValue={profile.phone ?? ""} name="phone" placeholder="Telefone" />
        <input className="rounded-md border px-3 py-2 text-sm outline-none" defaultValue={profile.document ?? ""} disabled placeholder="CPF" />
        <input
          className="rounded-md border px-3 py-2 text-sm outline-none"
          minLength={8}
          name="password"
          placeholder="Nova senha (opcional)"
          type="password"
        />
        <input
          className="rounded-md border px-3 py-2 text-sm outline-none"
          minLength={8}
          name="confirmPassword"
          placeholder="Repita a nova senha"
          type="password"
        />
        <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" type="submit">
          Salvar
        </button>
      </form>
    </section>
  );
}
