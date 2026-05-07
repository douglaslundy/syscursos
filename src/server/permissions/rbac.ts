import type { UserRole, UserStatus } from "@prisma/client";

export const protectedRoutePrefixes = ["/admin", "/app"] as const;

export type ProtectedRoutePrefix = (typeof protectedRoutePrefixes)[number];

export type RouteAccessDecision =
  | {
      allowed: true;
    }
  | {
      allowed: false;
      redirectTo: string;
      reason: "UNAUTHENTICATED" | "INACTIVE" | "FORBIDDEN";
    };

type UserAccessContext = {
  role: UserRole;
  status: UserStatus;
} | null;

export function getRequiredRoleForPath(pathname: string): UserRole | null {
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return "ADMIN";
  }

  if (pathname === "/app" || pathname.startsWith("/app/")) {
    return "STUDENT";
  }

  return null;
}

export function getDefaultPathForRole(role: UserRole): string {
  return role === "ADMIN" ? "/admin" : "/app";
}

export function decideRouteAccess(pathname: string, user: UserAccessContext): RouteAccessDecision {
  const requiredRole = getRequiredRoleForPath(pathname);

  if (!requiredRole) {
    return { allowed: true };
  }

  if (!user) {
    return {
      allowed: false,
      redirectTo: `/login/client?next=${encodeURIComponent(pathname)}`,
      reason: "UNAUTHENTICATED",
    };
  }

  if (user.status !== "ACTIVE") {
    return {
      allowed: false,
      redirectTo: "/login/client?error=inactive",
      reason: "INACTIVE",
    };
  }

  if (user.role !== requiredRole) {
    return {
      allowed: false,
      redirectTo: getDefaultPathForRole(user.role),
      reason: "FORBIDDEN",
    };
  }

  return { allowed: true };
}
