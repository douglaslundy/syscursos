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
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-card focus:px-4 focus:py-2 focus:text-sm focus:shadow"
        href="#conteudo"
      >
        Pular para o conteudo
      </a>

      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r bg-card px-5 py-6 md:flex md:flex-col">
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

        <div className="mt-auto rounded-md bg-secondary p-4">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Conta conectada
          </p>
          <p className="mt-2 truncate text-sm font-medium">{user.email}</p>
          <form action={logoutAction} className="mt-4">
            <button
              className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md border bg-card px-3 text-sm font-medium transition hover:bg-muted"
              type="submit"
            >
              <LogOut aria-hidden="true" className="h-4 w-4" />
              Sair
            </button>
          </form>
        </div>
      </aside>

      <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur md:hidden">
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
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border bg-card text-muted-foreground transition hover:bg-muted"
              type="submit"
            >
              <LogOut aria-hidden="true" className="h-4 w-4" />
            </button>
          </form>
        </div>
      </header>

      <div className="md:pl-72">
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
