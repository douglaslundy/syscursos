import { ModuleStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { ModuleInput } from "@/server/validators/admin";
import { PageArgs, ActorRole, offset, pageResult, scopedCourseWhere } from "@/server/repositories/admin/shared";
import { positionRangeFilter, shiftedSiblingPosition, clampPosition, shiftPositions } from "@/server/repositories/admin/positions";

export async function listModuleOptions(
  organizationId: string,
  actorUserId: string,
  actorRole: ActorRole,
  courseId: string,
) {
  return prisma.module.findMany({
    where: {
      courseId,
      course: scopedCourseWhere(organizationId, actorUserId, actorRole),
    },
    orderBy: [{ position: "asc" }, { title: "asc" }],
    select: { id: true, title: true, position: true },
  });
}

export async function listModules(
  organizationId: string,
  actorUserId: string,
  actorRole: ActorRole,
  courseId: string,
  args: PageArgs,
) {
  const courseScope = scopedCourseWhere(organizationId, actorUserId, actorRole);
  const where: Prisma.ModuleWhereInput = {
    courseId,
    course: courseScope,
    ...(args.query ? { title: { contains: args.query, mode: "insensitive" } } : {}),
  };
  const [course, items, total] = await prisma.$transaction([
    prisma.course.findFirstOrThrow({
      where: { id: courseId, ...courseScope },
      select: { id: true, title: true },
    }),
    prisma.module.findMany({
      where,
      orderBy: [{ position: "asc" }],
      skip: offset(args),
      take: args.pageSize,
      include: { _count: { select: { lessons: true } } },
    }),
    prisma.module.count({ where }),
  ]);

  return { course, modules: pageResult(items, total, args) };
}

export async function findModuleById(
  organizationId: string,
  actorUserId: string,
  actorRole: ActorRole,
  courseId: string,
  moduleId: string,
) {
  return prisma.module.findFirst({
    where: {
      id: moduleId,
      courseId,
      course: scopedCourseWhere(organizationId, actorUserId, actorRole),
    },
    select: {
      id: true,
      title: true,
      description: true,
      position: true,
      status: true,
    },
  });
}

export async function upsertModule(
  organizationId: string,
  actorUserId: string,
  actorRole: ActorRole,
  input: ModuleInput,
) {
  const courseScope = scopedCourseWhere(organizationId, actorUserId, actorRole);

  return prisma.$transaction(async (tx) => {
    if (input.id) {
      const current = await tx.module.findFirstOrThrow({
        where: { id: input.id, course: courseScope },
        select: { position: true, courseId: true },
      });

      const total = await tx.module.count({ where: { courseId: current.courseId } });
      const position = clampPosition(input.position, total);

      if (position !== current.position) {
        const siblings = await tx.module.findMany({
          where: {
            courseId: current.courseId,
            id: { not: input.id },
            position: positionRangeFilter(current.position, position),
          },
          select: { id: true, position: true },
        });

        await shiftPositions(tx.module, [
          ...siblings.map((sibling) => ({
            id: sibling.id,
            position: shiftedSiblingPosition(sibling.position, current.position, position),
          })),
          { id: input.id, position },
        ]);
      }

      return tx.module.update({
        where: { id: input.id },
        data: {
          title: input.title,
          description: input.description,
          position,
          status: input.status,
        },
      });
    }

    const course = await tx.course.findFirstOrThrow({
      where: { id: input.courseId, ...courseScope },
      select: { id: true },
    });

    const total = await tx.module.count({ where: { courseId: course.id } });
    const position = clampPosition(input.position, total + 1);

    const siblings = await tx.module.findMany({
      where: { courseId: course.id, position: { gte: position } },
      select: { id: true, position: true },
    });

    if (siblings.length > 0) {
      await shiftPositions(
        tx.module,
        siblings.map((sibling) => ({ id: sibling.id, position: sibling.position + 1 })),
      );
    }

    return tx.module.create({
      data: {
        courseId: course.id,
        title: input.title,
        description: input.description,
        position,
        status: input.status ?? ModuleStatus.ACTIVE,
      },
    });
  });
}

export async function deleteModule(
  organizationId: string,
  actorUserId: string,
  actorRole: ActorRole,
  id: string,
) {
  return prisma.module.deleteMany({ where: { id, course: scopedCourseWhere(organizationId, actorUserId, actorRole) } });
}
