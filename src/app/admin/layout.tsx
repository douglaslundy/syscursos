import { AdminShell } from "@/components/admin/admin-shell";
import { requireRole } from "@/server/auth/guards";

type AdminLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const user = await requireRole("ADMIN");

  return <AdminShell user={user}>{children}</AdminShell>;
}
