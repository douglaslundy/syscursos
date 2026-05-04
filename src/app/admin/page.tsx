import { logoutAction } from "@/server/actions/auth-actions";
import { requireRole } from "@/server/auth/guards";

export default async function AdminPage() {
  const user = await requireRole("ADMIN");

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Admin</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
        <form action={logoutAction}>
          <button className="rounded-md border px-3 py-2 text-sm" type="submit">
            Sair
          </button>
        </form>
      </header>
    </main>
  );
}
