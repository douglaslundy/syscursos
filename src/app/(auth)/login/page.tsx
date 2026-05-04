import { loginAction } from "@/server/actions/auth-actions";

type LoginPageProps = {
  searchParams?: {
    error?: string;
  };
};

const errorMessages: Record<string, string> = {
  invalid_input: "Informe e-mail e senha validos.",
  invalid_credentials: "Credenciais invalidas.",
  forbidden: "Usuario sem permissao ativa.",
  inactive: "Usuario inativo.",
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  const error = searchParams?.error ? errorMessages[searchParams.error] : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <form action={loginAction} className="w-full max-w-sm space-y-5">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-normal">Entrar</h1>
          <p className="text-sm text-muted-foreground">Acesse sua area na plataforma.</p>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-medium">E-mail</span>
          <input
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium">Senha</span>
          <input
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            minLength={8}
          />
        </label>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <button
          className="h-10 w-full rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
          type="submit"
        >
          Entrar
        </button>
      </form>
    </main>
  );
}
