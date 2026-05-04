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
    <section className="rounded-md border bg-background p-6">
      <h2 className="text-xl font-semibold tracking-normal">Acesso bloqueado</h2>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      <Link className="mt-4 inline-flex rounded-md border px-3 py-2 text-sm" href="/app">
        Voltar para meus cursos
      </Link>
    </section>
  );
}
