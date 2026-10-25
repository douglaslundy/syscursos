import { StudentShell } from "@/components/student/student-shell";
import { requireAnyRole } from "@/server/auth/guards";
import { getHiddenStudentHrefs } from "@/server/services/feature-service";
import { countUnreadNotifications } from "@/server/services/notification-service";

type StudentLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default async function StudentLayout({ children }: StudentLayoutProps) {
  const user = await requireAnyRole(["STUDENT"]);

  const [unread, hidden] = await Promise.all([countUnreadNotifications(user.id).catch(() => 0), getHiddenStudentHrefs().catch(() => [])]);

  return (
    <StudentShell hidden={hidden} unread={unread} user={user}>
      {children}
    </StudentShell>
  );
}
