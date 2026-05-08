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
      title="Cadastro de administrador"
      description="Solicite seu acesso administrativo para criar e gerenciar seu ambiente."
      loginHref="/login/admin"
      loginLabel="Ja tenho conta de administrador"
      showDocumentField={false}
      error={searchParams?.error}
    />
  );
}
