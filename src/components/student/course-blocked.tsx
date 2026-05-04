import Link from "next/link";

type CourseBlockedProps = {
  status: "EXPIRED" | "INACTIVE";
};

export function CourseBlocked({ status }: CourseBlockedProps) {
  const message =
    status === "EXPIRED"
      ? "Seu acesso a este curso expirou."
      : "Este curso nao esta disponivel no momento.";

  return (
    <section className="rounded-md border bg-card p-8 shadow-sm">
      <p className="text-sm font-medium text-primary">Acesso ao curso</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-normal">Acesso bloqueado</h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">{message}</p>
      <Link
        className="mt-5 inline-flex min-h-10 items-center rounded-md border bg-background px-4 text-sm font-medium transition hover:bg-muted"
        href="/app"
      >
        Voltar para meus cursos
      </Link>
    </section>
  );
}
