import Link from "next/link";

import { loginAction } from "@/server/actions/auth-actions";

type LoginAudience = "admin" | "client";

type LoginFormProps = {
  audience: LoginAudience;
  title: string;
  description: string;
  alternateHref?: string;
  alternateLabel?: string;
  registerHref?: string;
  registerLabel?: string;
  error?: string;
};

const errorMessages: Record<string, string> = {
  invalid_input: "Informe e-mail e senha validos.",
  invalid_credentials: "Credenciais invalidas.",
  forbidden: "Usuario sem permissao para esta area.",
  inactive: "Usuario inativo.",
  server: "Nao foi possivel concluir o login agora. Tente novamente em instantes.",
};

export function LoginForm({
  audience,
  title,
  description,
  alternateHref,
  alternateLabel,
  registerHref,
  registerLabel,
  error,
}: LoginFormProps) {
  const feedback = error ? errorMessages[error] : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <form action={loginAction} className="w-full max-w-sm space-y-5">
        <input name="audience" type="hidden" value={audience} />
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-normal">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

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

        <label className="block space-y-2">
          <span className="text-sm font-medium">Senha</span>
          <input
            autoComplete="current-password"
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
          Entrar
        </button>

        {alternateHref && alternateLabel ? (
          <Link
            className="block text-center text-sm text-muted-foreground transition hover:text-foreground"
            href={alternateHref}
          >
            {alternateLabel}
          </Link>
        ) : null}
        {registerHref && registerLabel ? (
          <Link
            className="block text-center text-sm text-muted-foreground transition hover:text-foreground"
            href={registerHref}
          >
            {registerLabel}
          </Link>
        ) : null}
      </form>
    </main>
  );
}
