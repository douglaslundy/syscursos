import Link from "next/link";

import { logoutAction } from "@/server/actions/auth-actions";
import type { AuthenticatedUser } from "@/server/auth/types";

type StudentShellProps = Readonly<{
  user: AuthenticatedUser;
  children: React.ReactNode;
}>;

export function StudentShell({ user, children }: StudentShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Link className="text-lg font-semibold tracking-normal" href="/app">
              SysCursos
            </Link>
            <nav className="hidden gap-2 md:flex">
              <Link className="rounded-md px-3 py-2 text-sm hover:bg-muted" href="/app">
                Meus cursos
              </Link>
              <Link className="rounded-md px-3 py-2 text-sm hover:bg-muted" href="/app/notebooks">
                Meus cadernos
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground md:inline">{user.email}</span>
            <form action={logoutAction}>
              <button className="rounded-md border px-3 py-2 text-sm" type="submit">
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
