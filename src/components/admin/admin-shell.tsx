import Link from "next/link";

import { logoutAction } from "@/server/actions/auth-actions";
import type { AuthenticatedUser } from "@/server/auth/types";

const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/users", label: "Novo usuario" },
  { href: "/admin/me", label: "Meus dados" },
  { href: "/admin/courses", label: "Cursos" },
  { href: "/admin/lessons", label: "Cadastrar aulas" },
  { href: "/admin/students", label: "Alunos" },
  { href: "/admin/enrollments", label: "Matriculas" },
];

type AdminShellProps = Readonly<{
  user: AuthenticatedUser;
  children: React.ReactNode;
}>;

export function AdminShell({ user, children }: AdminShellProps) {
  const visibleNavItems = navItems.filter((item) => {
    if (user.role === "ADMIN") {
      return item.href === "/admin" || item.href === "/admin/users" || item.href === "/admin/me";
    }

    if (user.role === "PRODUCER") {
      return item.href !== "/admin/users";
    }

    return false;
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-stroke-subtle bg-surface-elevated">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-medium uppercase text-copy-muted">Admin</p>
            <h1 className="text-xl font-semibold tracking-normal text-copy-primary">SysCursos</h1>
          </div>
          <nav className="flex flex-wrap gap-2">
            {visibleNavItems.map((item) => (
              <Link
                className="rounded-md border border-transparent px-3 py-2 text-sm text-copy-secondary transition duration-200 hover:border-stroke-subtle hover:bg-surface-hover hover:text-copy-primary"
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <form action={logoutAction}>
            <input name="audience" type="hidden" value="admin" />
            <button
              className="rounded-md border border-stroke-subtle bg-transparent px-3 py-2 text-sm text-copy-secondary transition duration-200 hover:border-stroke-strong hover:bg-surface-hover hover:text-copy-primary"
              type="submit"
            >
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
