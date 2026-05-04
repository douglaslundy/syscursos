import { StudentShell } from "@/components/student/student-shell";
import { requireRole } from "@/server/auth/guards";

type StudentLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default async function StudentLayout({ children }: StudentLayoutProps) {
  const user = await requireRole("STUDENT");

  return <StudentShell user={user}>{children}</StudentShell>;
}
