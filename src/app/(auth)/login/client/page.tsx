import { LoginForm } from "@/components/shared/login-form";

type ClientLoginPageProps = {
  searchParams?: {
    error?: string;
  };
};

export default function ClientLoginPage({ searchParams }: ClientLoginPageProps) {
  return (
    <LoginForm
      alternateHref="/login/admin"
      alternateLabel="Entrar como administrador"
      audience="client"
      description="Acesse seus cursos, aulas e cadernos."
      error={searchParams?.error}
      title="Login do cliente"
    />
  );
}
