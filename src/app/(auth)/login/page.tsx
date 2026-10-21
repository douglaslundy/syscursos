import { redirect } from "next/navigation";

type LoginPageProps = {
  searchParams?: {
    error?: string;
  };
};

export default async function LoginPage(props: { searchParams: Promise<LoginPageProps["searchParams"]> }) {
  const searchParams = await props.searchParams;
  const query = searchParams?.error ? `?error=${searchParams.error}` : "";
  redirect(`/login/client${query}`);
}
