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
  return role === "STUDENT" ? "/app" : "/admin";
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
    if (requiredRole === "STUDENT" && user.role === "ADMIN") {
      return { allowed: true };
    }

    if (requiredRole === "ADMIN" && user.role === "PRODUCER") {
      if (isProducerRestrictedPath(pathname)) {
        return {
          allowed: false,
          redirectTo: "/admin?error=forbidden",
          reason: "FORBIDDEN",
        };
      }

      return { allowed: true };
    }

    return {
      allowed: false,
      redirectTo: getDefaultPathForRole(user.role),
      reason: "FORBIDDEN",
    };
  }

  return { allowed: true };
}

function isProducerRestrictedPath(pathname: string) {
  return (
    pathname === "/admin/users" ||
    pathname === "/admin/students" ||
    pathname.startsWith("/admin/students/") ||
    pathname === "/admin/enrollments" ||
    pathname.startsWith("/admin/enrollments/") ||
    pathname.includes("/students")
  );
}
