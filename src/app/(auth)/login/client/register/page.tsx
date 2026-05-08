import { RegisterForm } from "@/components/shared/register-form";

type ClientRegisterPageProps = {
  searchParams?: {
    error?: string;
  };
};

export default function ClientRegisterPage({ searchParams }: ClientRegisterPageProps) {
  return (
    <RegisterForm
      audience="client"
      title="Cadastro de cliente"
      description="Crie seu acesso para entrar na area de cursos."
      loginHref="/login/client"
      loginLabel="Ja tenho conta de cliente"
      showDocumentField
      error={searchParams?.error}
    />
  );
}
