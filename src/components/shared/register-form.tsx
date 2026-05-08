import Link from "next/link";

import { registerAction } from "@/server/actions/auth-actions";

type RegisterAudience = "admin" | "client";

type RegisterFormProps = {
  audience: RegisterAudience;
  title: string;
  description: string;
  loginHref: string;
  loginLabel: string;
  showDocumentField: boolean;
  error?: string;
};

const errorMessages: Record<string, string> = {
  invalid_input: "Revise os campos e tente novamente.",
  conflict: "Ja existe usuario com este e-mail.",
  server: "Nao foi possivel concluir o cadastro agora. Tente novamente em instantes.",
};

export function RegisterForm({
  audience,
  title,
  description,
  loginHref,
  loginLabel,
  showDocumentField,
  error,
}: RegisterFormProps) {
  const feedback = error ? errorMessages[error] : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <form action={registerAction} className="w-full max-w-sm space-y-5">
        <input name="audience" type="hidden" value={audience} />
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-normal">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-medium">Nome</span>
          <input
            className="h-10 w-full rounded-md border px-3 text-sm outline-none ring-offset-background focus-visible:ring-2"
            name="name"
            required
            type="text"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium">E-mail</span>
          <input
            autoComplete="email"
            className="h-10 w-full rounded-md border px-3 text-sm outline-none ring-offset-background focus-visible:ring-2"
            name="email"
            required
            type="email"
          />
        </label>

        {showDocumentField ? (
          <label className="block space-y-2">
            <span className="text-sm font-medium">CPF</span>
            <input
              className="h-10 w-full rounded-md border px-3 text-sm outline-none ring-offset-background focus-visible:ring-2"
              name="document"
              placeholder="Somente numeros"
              type="text"
            />
          </label>
        ) : null}

        <label className="block space-y-2">
          <span className="text-sm font-medium">Senha</span>
          <input
            autoComplete="new-password"
            className="h-10 w-full rounded-md border px-3 text-sm outline-none ring-offset-background focus-visible:ring-2"
            minLength={8}
            name="password"
            required
            type="password"
          />
        </label>

        {feedback ? <p className="text-sm text-destructive">{feedback}</p> : null}

        <button
          className="h-10 w-full rounded-md bg-brand-primary px-4 text-sm font-medium text-copy-primary transition hover:bg-brand-primaryHover"
          type="submit"
        >
          Cadastrar e entrar
        </button>

        <Link
          className="block text-center text-sm text-muted-foreground transition hover:text-foreground"
          href={loginHref}
        >
          {loginLabel}
        </Link>
      </form>
    </main>
  );
}
