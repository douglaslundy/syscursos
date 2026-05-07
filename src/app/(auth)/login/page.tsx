import { redirect } from "next/navigation";

type LoginPageProps = {
  searchParams?: {
    error?: string;
  };
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  const query = searchParams?.error ? `?error=${searchParams.error}` : "";
  redirect(`/login/client${query}`);
}
