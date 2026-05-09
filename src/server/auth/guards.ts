import type { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/server/auth/session";
import { getDefaultPathForRole } from "@/server/permissions/rbac";

export async function requireRole(role: UserRole) {
  return requireAnyRole([role]);
}

export async function requireAnyRole(roles: UserRole[]) {
  const result = await getCurrentUser();
  const loginPath = resolveLoginPath(roles);

  if (!result.ok) {
    if (result.reason === "SERVER_ERROR") {
      redirect(`${loginPath}?error=server`);
    }

    redirect(loginPath);
  }

  if (!roles.includes(result.user.role)) {
    redirect(getDefaultPathForRole(result.user.role));
  }

  return result.user;
}

function resolveLoginPath(roles: UserRole[]) {
  const adminOnly = roles.every((role) => role === "ADMIN" || role === "PRODUCER");
  return adminOnly ? "/login/admin" : "/login/client";
}
