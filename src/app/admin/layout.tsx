import { AdminShell } from "@/components/admin/admin-shell";
import { requireAnyRole } from "@/server/auth/guards";
import { countPendingQuestions } from "@/server/services/question-service";

type AdminLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const user = await requireAnyRole(["ADMIN", "PRODUCER"]);

  const pendingQuestions = user.role === "PRODUCER" ? await countPendingQuestions().catch(() => 0) : 0;

  return (
    <AdminShell pendingQuestions={pendingQuestions} user={user}>
      {children}
    </AdminShell>
  );
}
