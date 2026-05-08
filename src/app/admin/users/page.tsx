import { UserRole } from "@prisma/client";

import { Feedback } from "@/components/admin/feedback";
import { saveManagedUserAction } from "@/server/actions/admin-actions";

type UsersPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default function AdminUsersPage({ searchParams }: UsersPageProps) {
  const status = typeof searchParams?.status === "string" ? searchParams.status : undefined;

  return (
    <section>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-normal">Novo usuario</h2>
        <p className="text-sm text-muted-foreground">
          Cadastre e gerencie produtores dentro do seu ambiente.
        </p>
      </div>
      <Feedback status={status} />
      <form action={saveManagedUserAction} className="grid gap-3 rounded-md border bg-background p-4 md:grid-cols-2">
        <input name="role" type="hidden" value={UserRole.PRODUCER} />
        <input className="rounded-md border px-3 py-2 text-sm outline-none" disabled value="Produtor" />
        <input className="rounded-md border px-3 py-2 text-sm outline-none" name="name" placeholder="Nome" required />
        <input
          className="rounded-md border px-3 py-2 text-sm outline-none"
          name="email"
          placeholder="email@exemplo.com"
          required
          type="email"
        />
        <input
          className="rounded-md border px-3 py-2 text-sm outline-none"
          minLength={8}
          name="password"
          placeholder="Senha inicial"
          required
          type="password"
        />
        <input className="rounded-md border px-3 py-2 text-sm outline-none" name="accessExpiresAt" type="date" />
        <input className="rounded-md border px-3 py-2 text-sm outline-none" name="document" placeholder="CPF (nao aplicavel)" />
        <input className="rounded-md border px-3 py-2 text-sm outline-none" name="phone" placeholder="Telefone (nao aplicavel)" />
        <select className="rounded-md border px-3 py-2 text-sm outline-none" defaultValue="ACTIVE" name="status">
          <option value="ACTIVE">Ativo</option>
          <option value="INACTIVE">Inativo</option>
        </select>
        <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" type="submit">
          Cadastrar usuario
        </button>
      </form>
    </section>
  );
}
