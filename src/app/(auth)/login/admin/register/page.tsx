import { redirect } from "next/navigation";

type AdminRegisterPageProps = {
  searchParams?: {
    error?: string;
  };
};

export default async function AdminRegisterPage(props: { searchParams: Promise<AdminRegisterPageProps["searchParams"]> }) {
  const searchParams = await props.searchParams;
  void searchParams;
  redirect("/login/admin?error=forbidden");
}
