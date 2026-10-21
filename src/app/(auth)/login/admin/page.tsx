import { LoginForm } from "@/components/shared/login-form";

type AdminLoginPageProps = {
  searchParams?: {
    error?: string;
  };
};

export default async function AdminLoginPage(props: { searchParams: Promise<AdminLoginPageProps["searchParams"]> }) {
  const searchParams = await props.searchParams;
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
