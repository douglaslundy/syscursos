"use client";

type StudentErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function StudentError({ error, reset }: StudentErrorProps) {
  return (
    <section className="rounded-md border bg-card p-8 shadow-sm">
      <p className="text-sm font-medium text-destructive">Erro</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-normal">Nao foi possivel carregar</h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
        Tente novamente. Se o erro persistir, confirme se sua sessao e sua conexao com o banco estao
        ativas.
      </p>
      <p className="sr-only">{error.message}</p>
      <button
        className="mt-5 inline-flex min-h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
        onClick={reset}
        type="button"
      >
        Tentar novamente
      </button>
    </section>
  );
}
