import { Prisma, UserRole, UserStatus } from "@prisma/client";

export type PageResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export type PageArgs = {
  page: number;
  pageSize: number;
  query?: string;
};

export type ActorRole = "ADMIN" | "PRODUCER";

export type DashboardFilters = {
  producerId?: string | null;
  studentId?: string | null;
};

export class StudentMutationError extends Error {
  constructor(readonly status: string, message: string) {
    super(message);
    this.name = "StudentMutationError";
  }
}

export type StudentLookupResult = {
  studentProfileId: string;
  userId: string;
  email: string;
  name: string;
  document: string | null;
  phone: string | null;
  status: UserStatus;
  alreadyLinked: boolean;
};

export function offset(args: PageArgs) {
  return (args.page - 1) * args.pageSize;
}

export function pageResult<T>(items: T[], total: number, args: PageArgs): PageResult<T> {
  return {
    items,
    total,
    page: args.page,
    pageSize: args.pageSize,
    pageCount: Math.max(1, Math.ceil(total / args.pageSize)),
  };
}

export function scopedCourseWhere(organizationId: string, actorUserId: string, actorRole: ActorRole): Prisma.CourseWhereInput {
  if (actorRole === UserRole.ADMIN) {
    return { organizationId };
  }

  return { organizationId, producerId: actorUserId };
}

export function scopedCourseWhereWithFilters(
  organizationId: string,
  actorUserId: string,
  actorRole: ActorRole,
  filters?: DashboardFilters,
): Prisma.CourseWhereInput {
  const producerId = actorRole === UserRole.ADMIN ? filters?.producerId ?? null : actorUserId;

  if (producerId) {
    return { organizationId, producerId };
  }

  return scopedCourseWhere(organizationId, actorUserId, actorRole);
}

export function scopedStudentWhere(
  organizationId: string,
  actorUserId: string,
  actorRole: ActorRole,
): Prisma.StudentProfileWhereInput {
  if (actorRole === UserRole.ADMIN) {
    return { user: { organizationId, role: UserRole.STUDENT } };
  }

  return {
    user: { role: UserRole.STUDENT },
    OR: [
      { producers: { some: { producerId: actorUserId } } },
      {
        enrollments: {
          some: {
            course: {
              organizationId,
              producerId: actorUserId,
            },
          },
        },
      },
    ],
  };
}

export function scopedStudentWhereWithFilters(
  organizationId: string,
  actorUserId: string,
  actorRole: ActorRole,
  filters?: DashboardFilters,
): Prisma.StudentProfileWhereInput {
  const producerId = actorRole === UserRole.ADMIN ? filters?.producerId ?? null : actorUserId;
  const studentId = filters?.studentId ?? null;

  const baseWhere: Prisma.StudentProfileWhereInput = actorRole === UserRole.ADMIN
    ? producerId
      ? {
          user: { organizationId, role: UserRole.STUDENT },
          OR: [
            { producers: { some: { producerId } } },
            {
              enrollments: {
                some: {
                  course: {
                    organizationId,
                    producerId,
                  },
                },
              },
            },
          ],
        }
      : { user: { organizationId, role: UserRole.STUDENT } }
    : {
        user: { role: UserRole.STUDENT },
        OR: [
          { producers: { some: { producerId: actorUserId } } },
          {
            enrollments: {
              some: {
                course: {
                  organizationId,
                  producerId: actorUserId,
                },
              },
            },
          },
        ],
      };

  if (!studentId) {
    return baseWhere;
  }

  return {
    AND: [baseWhere, { id: studentId }],
  };
}
