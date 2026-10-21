import { StudentShell } from "@/components/student/student-shell";
import { requireAnyRole } from "@/server/auth/guards";
import { countUnreadNotifications } from "@/server/services/notification-service";

type StudentLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default async function StudentLayout({ children }: StudentLayoutProps) {
  const user = await requireAnyRole(["STUDENT"]);

  const unread = await countUnreadNotifications(user.id).catch(() => 0);

  return (
    <StudentShell unread={unread} user={user}>
      {children}
    </StudentShell>
  );
}
