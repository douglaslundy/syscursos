import { LoginForm } from "@/components/shared/login-form";

type ClientLoginPageProps = {
  searchParams?: {
    error?: string;
  };
};

export default function ClientLoginPage({ searchParams }: ClientLoginPageProps) {
  return (
    <LoginForm
      registerHref="/login/client/register"
      registerLabel="Solicitar cadastro de cliente"
      audience="client"
      description="Acesse seus cursos, aulas e cadernos."
      error={searchParams?.error}
      title="Login do cliente"
    />
  );
}
