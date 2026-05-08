import { Feedback } from "@/components/admin/feedback";
import { saveOwnAdminProfileAction } from "@/server/actions/admin-actions";
import { requireAnyRole } from "@/server/auth/guards";

type AdminMePageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function AdminMePage({ searchParams }: AdminMePageProps) {
  const user = await requireAnyRole(["ADMIN", "PRODUCER"]);
  const status = typeof searchParams?.status === "string" ? searchParams.status : undefined;

  return (
    <section>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-normal">Meus dados</h2>
        <p className="text-sm text-muted-foreground">Atualize seus dados de perfil administrativo.</p>
      </div>
      <Feedback status={status} />
      <form action={saveOwnAdminProfileAction} className="grid max-w-2xl gap-3 rounded-md border bg-background p-4">
        <input className="rounded-md border px-3 py-2 text-sm outline-none" defaultValue={user.email} disabled type="email" />
        <input className="rounded-md border px-3 py-2 text-sm outline-none" defaultValue={user.name} name="name" required />
        <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" type="submit">
          Salvar
        </button>
      </form>
    </section>
  );
}
