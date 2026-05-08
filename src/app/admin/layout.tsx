import { AdminShell } from "@/components/admin/admin-shell";
import { requireAnyRole } from "@/server/auth/guards";

type AdminLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const user = await requireAnyRole(["ADMIN", "PRODUCER"]);

  return <AdminShell user={user}>{children}</AdminShell>;
}
