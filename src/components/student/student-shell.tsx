import { LogOut } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import {
  StudentBottomNavigation,
  StudentDesktopNavigation,
} from "@/components/student/student-navigation";
import { logoutAction } from "@/server/actions/auth-actions";
import type { AuthenticatedUser } from "@/server/auth/types";

type StudentShellProps = Readonly<{
  user: AuthenticatedUser;
  children: React.ReactNode;
}>;

export function StudentShell({ user, children }: StudentShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <input className="peer/sidebar sr-only" defaultChecked id="student-sidebar-toggle" type="checkbox" />

      <a
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:text-copy-primary focus:shadow"
        href="#conteudo"
      >
        Pular para o conteudo
      </a>

      <label
        className="fixed left-4 top-4 z-40 hidden cursor-pointer rounded-md border border-stroke-subtle bg-surface-elevated px-3 py-2 text-xs font-medium text-copy-secondary transition hover:border-stroke-strong hover:bg-surface-hover hover:text-copy-primary peer-checked/sidebar:md:hidden md:block"
        htmlFor="student-sidebar-toggle"
      >
        Abrir menu
      </label>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 -translate-x-full border-r border-stroke-subtle bg-surface-elevated px-5 py-6 transition-transform duration-200 peer-checked/sidebar:translate-x-0 md:flex md:flex-col">
        <div className="mb-4 flex justify-end">
          <label
            className="cursor-pointer rounded-md border border-stroke-subtle bg-transparent px-3 py-2 text-xs font-medium text-copy-secondary transition hover:border-stroke-strong hover:bg-surface-hover hover:text-copy-primary"
            htmlFor="student-sidebar-toggle"
          >
            Fechar menu
          </label>
        </div>
        <Link aria-label="Ir para meus cursos" className="inline-flex" href="/app">
          <Image
            alt="Sysdoc"
            className="h-auto w-36"
            height={75}
            priority
            src="https://sysdoc.vercel.app/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Flogo.f378552e.png&w=384&q=75"
            width={192}
          />
        </Link>

        <StudentDesktopNavigation />

        <div className="mt-auto rounded-md border border-stroke-subtle bg-surface p-4">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-copy-muted">
            Conta conectada
          </p>
          <p className="mt-2 truncate text-sm font-medium text-copy-primary">{user.email}</p>
          <form action={logoutAction} className="mt-4">
            <button
              className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-stroke-subtle bg-transparent px-3 text-sm font-medium text-copy-secondary transition hover:border-stroke-strong hover:bg-surface-hover hover:text-copy-primary"
              type="submit"
            >
              <LogOut aria-hidden="true" className="h-4 w-4" />
              Sair
            </button>
          </form>
        </div>
      </aside>

      <header className="sticky top-0 z-30 border-b border-stroke-subtle bg-surface-elevated/95 backdrop-blur md:hidden">
        <div className="flex min-h-16 items-center justify-between px-4">
          <Link aria-label="Ir para meus cursos" className="inline-flex" href="/app">
            <Image
              alt="Sysdoc"
              className="h-auto w-32"
              height={75}
              priority
              src="https://sysdoc.vercel.app/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Flogo.f378552e.png&w=384&q=75"
              width={192}
            />
          </Link>
          <form action={logoutAction}>
            <button
              aria-label="Sair"
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-stroke-subtle bg-transparent text-copy-secondary transition hover:border-stroke-strong hover:bg-surface-hover hover:text-copy-primary"
              type="submit"
            >
              <LogOut aria-hidden="true" className="h-4 w-4" />
            </button>
          </form>
        </div>
      </header>

      <div className="transition-[padding] duration-200 peer-checked/sidebar:md:pl-72 md:pl-0">
        <main
          className="mx-auto min-h-screen max-w-7xl px-4 pb-24 pt-6 sm:px-6 md:pb-10 md:pt-8"
          id="conteudo"
        >
          {children}
        </main>
      </div>

      <StudentBottomNavigation />
    </div>
  );
}
