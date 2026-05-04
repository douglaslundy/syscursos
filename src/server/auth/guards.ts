import type { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/server/auth/session";
import { getDefaultPathForRole } from "@/server/permissions/rbac";

export async function requireRole(role: UserRole) {
  const result = await getCurrentUser();

  if (!result.ok) {
    if (result.reason === "SERVER_ERROR") {
      redirect("/login?error=server");
    }

    redirect("/login");
  }

  if (result.user.role !== role) {
    redirect(getDefaultPathForRole(result.user.role));
  }

  return result.user;
}
