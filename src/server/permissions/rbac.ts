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
    const loginBase = requiredRole === "ADMIN" ? "/login/admin" : "/login/client";
    return {
      allowed: false,
      redirectTo: `${loginBase}?next=${encodeURIComponent(pathname)}`,
      reason: "UNAUTHENTICATED",
    };
  }

  if (user.status !== "ACTIVE") {
    const loginBase = requiredRole === "ADMIN" ? "/login/admin" : "/login/client";
    return {
      allowed: false,
      redirectTo: `${loginBase}?error=inactive`,
      reason: "INACTIVE",
    };
  }

  if (user.role !== requiredRole) {
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

  if (requiredRole === "ADMIN" && user.role === "ADMIN" && isAdminRestrictedPath(pathname)) {
    return {
      allowed: false,
      redirectTo: "/admin",
      reason: "FORBIDDEN",
    };
  }

  return { allowed: true };
}

function isProducerRestrictedPath(pathname: string) {
  return (
    pathname === "/admin/users" ||
    pathname === "/admin/enrollments" ||
    pathname.startsWith("/admin/enrollments/") ||
    (pathname.startsWith("/admin/courses/") && pathname.endsWith("/students"))
  );
}

function isAdminRestrictedPath(pathname: string) {
  return (
    pathname === "/admin/courses" ||
    pathname.startsWith("/admin/courses/") ||
    pathname.startsWith("/admin/modules/")
  );
}
