"use client";

type AdminErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AdminError({ error, reset }: AdminErrorProps) {
  return (
    <section className="rounded-md border bg-card p-8 shadow-sm">
      <p className="text-sm font-medium text-destructive">Erro</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-normal">Nao foi possivel carregar</h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
        Tente novamente. Se o erro persistir, confirme sua conexao e tente novamente em alguns
        instantes. Sua sessao continua ativa.
      </p>
      <p className="sr-only">{error.message}</p>
      <button
        className="mt-5 inline-flex min-h-10 items-center rounded-md bg-brand-primary px-4 text-sm font-medium text-copy-primary transition hover:bg-brand-primaryHover"
        onClick={reset}
        type="button"
      >
        Tentar novamente
      </button>
    </section>
  );
}
