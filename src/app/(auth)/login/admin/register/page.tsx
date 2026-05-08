import { redirect } from "next/navigation";

type AdminRegisterPageProps = {
  searchParams?: {
    error?: string;
  };
};

export default function AdminRegisterPage({ searchParams }: AdminRegisterPageProps) {
  void searchParams;
  redirect("/login/admin?error=forbidden");
}
