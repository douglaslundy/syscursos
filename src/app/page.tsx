import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <section className="w-full max-w-3xl rounded-2xl border border-stroke-subtle bg-surface p-8 shadow-sm md:p-10">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">SysCursos</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-normal text-copy-primary md:text-4xl">
          Plataforma de cursos com acesso separado para clientes e administradores
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-copy-secondary md:text-base">
          Escolha o tipo de acesso para continuar no ambiente correto da plataforma.
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-brand-primary px-4 text-sm font-medium text-copy-primary transition hover:bg-brand-primaryHover"
            href="/login/client"
          >
            Login de clientes
          </Link>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-stroke-subtle bg-transparent px-4 text-sm font-medium text-copy-secondary transition hover:bg-surface-hover hover:text-copy-primary"
            href="/login/admin"
          >
            Login de admin
          </Link>
        </div>
      </section>
    </main>
  );
}
