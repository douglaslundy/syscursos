import { describe, expect, it } from "vitest";

import {
  decideRouteAccess,
  getDefaultPathForRole,
  getRequiredRoleForPath,
} from "@/server/permissions/rbac";

describe("rbac route decisions", () => {
  it("requires ADMIN for admin routes", () => {
    expect(getRequiredRoleForPath("/admin")).toBe("ADMIN");
    expect(getRequiredRoleForPath("/admin/courses")).toBe("ADMIN");
  });

  it("requires STUDENT for app routes", () => {
    expect(getRequiredRoleForPath("/app")).toBe("STUDENT");
    expect(getRequiredRoleForPath("/app/courses")).toBe("STUDENT");
  });

  it("redirects unauthenticated users to login with next path", () => {
    expect(decideRouteAccess("/admin", null)).toEqual({
      allowed: false,
      redirectTo: "/login?next=%2Fadmin",
      reason: "UNAUTHENTICATED",
    });
  });

  it("allows admin users only on admin routes", () => {
    expect(decideRouteAccess("/admin", { role: "ADMIN", status: "ACTIVE" })).toEqual({
      allowed: true,
    });
    expect(decideRouteAccess("/app", { role: "ADMIN", status: "ACTIVE" })).toEqual({
      allowed: false,
      redirectTo: "/admin",
      reason: "FORBIDDEN",
    });
  });

  it("allows student users only on app routes", () => {
    expect(decideRouteAccess("/app", { role: "STUDENT", status: "ACTIVE" })).toEqual({
      allowed: true,
    });
    expect(decideRouteAccess("/admin", { role: "STUDENT", status: "ACTIVE" })).toEqual({
      allowed: false,
      redirectTo: "/app",
      reason: "FORBIDDEN",
    });
  });

  it("blocks inactive users", () => {
    expect(decideRouteAccess("/app", { role: "STUDENT", status: "INACTIVE" })).toEqual({
      allowed: false,
      redirectTo: "/login?error=inactive",
      reason: "INACTIVE",
    });
  });

  it("maps default route by role", () => {
    expect(getDefaultPathForRole("ADMIN")).toBe("/admin");
    expect(getDefaultPathForRole("STUDENT")).toBe("/app");
  });
});
