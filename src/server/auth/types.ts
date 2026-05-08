import type { UserRole, UserStatus } from "@prisma/client";

export type AuthenticatedUser = {
  id: string;
  organizationId: string;
  authUserId: string | null;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  accessExpiresAt: Date | null;
  lastLoginAt: Date | null;
  studentProfileId: string | null;
};

export type AuthResult =
  | {
      ok: true;
      user: AuthenticatedUser;
    }
  | {
      ok: false;
      reason: "UNAUTHENTICATED" | "USER_NOT_FOUND" | "INACTIVE" | "SERVER_ERROR";
    };
