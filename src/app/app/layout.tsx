import { StudentShell } from "@/components/student/student-shell";
import { requireAnyRole } from "@/server/auth/guards";

type StudentLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default async function StudentLayout({ children }: StudentLayoutProps) {
  const user = await requireAnyRole(["STUDENT", "ADMIN"]);

  return <StudentShell user={user}>{children}</StudentShell>;
}
