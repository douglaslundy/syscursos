import { RegisterForm } from "@/components/shared/register-form";

type AdminRegisterPageProps = {
  searchParams?: {
    error?: string;
  };
};

export default function AdminRegisterPage({ searchParams }: AdminRegisterPageProps) {
  return (
    <RegisterForm
      audience="admin"
      title="Cadastro de produtor"
      description="Solicite seu acesso de produtor para criar e gerenciar cursos."
      loginHref="/login/admin"
      loginLabel="Ja tenho conta de produtor"
      showDocumentField={false}
      error={searchParams?.error}
    />
  );
}
