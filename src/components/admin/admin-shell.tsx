import Link from "next/link";

import { logoutAction } from "@/server/actions/auth-actions";
import type { AuthenticatedUser } from "@/server/auth/types";

const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/courses", label: "Cursos" },
  { href: "/admin/students", label: "Alunos" },
  { href: "/admin/enrollments", label: "Matriculas" },
];

type AdminShellProps = Readonly<{
  user: AuthenticatedUser;
  children: React.ReactNode;
}>;

export function AdminShell({ user, children }: AdminShellProps) {
  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">Admin</p>
            <h1 className="text-xl font-semibold tracking-normal">SysCursos</h1>
          </div>
          <nav className="flex flex-wrap gap-2">
            {navItems.map((item) => (
              <Link
                className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <form action={logoutAction}>
            <button className="rounded-md border px-3 py-2 text-sm" type="submit">
              Sair
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-6 text-sm text-muted-foreground">{user.email}</div>
        {children}
      </main>
    </div>
  );
}
