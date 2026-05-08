import { LoginForm } from "@/components/shared/login-form";

type AdminLoginPageProps = {
  searchParams?: {
    error?: string;
  };
};

export default function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  return (
    <LoginForm
      alternateHref="/login/client"
      alternateLabel="Entrar como cliente"
      audience="admin"
      description="Acesse o painel de produtores da plataforma."
      error={searchParams?.error}
      title="Login do produtor"
    />
  );
}
