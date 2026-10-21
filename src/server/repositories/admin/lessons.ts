import { LessonMaterialStatus, LessonStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { extractYouTubeVideoId } from "@/server/services/video-platform-service";
import type { LessonInput, LessonMaterialInput } from "@/server/validators/admin";
import { PageArgs, ActorRole, offset, pageResult, scopedCourseWhere } from "@/server/repositories/admin/shared";
import { positionRangeFilter, shiftedSiblingPosition, clampPosition, shiftPositions } from "@/server/repositories/admin/positions";

export async function listLessons(
  organizationId: string,
  actorUserId: string,
  actorRole: ActorRole,
  moduleId: string,
  args: PageArgs,
) {
  const courseScope = scopedCourseWhere(organizationId, actorUserId, actorRole);
  const where: Prisma.LessonWhereInput = {
    moduleId,
    module: { course: courseScope },
    ...(args.query ? { title: { contains: args.query, mode: "insensitive" } } : {}),
  };
  const [module, items, total] = await prisma.$transaction([
    prisma.module.findFirstOrThrow({
      where: { id: moduleId, course: courseScope },
      select: { id: true, title: true, courseId: true, course: { select: { title: true } } },
    }),
    prisma.lesson.findMany({
      where,
      orderBy: [{ position: "asc" }],
      skip: offset(args),
      take: args.pageSize,
    }),
    prisma.lesson.count({ where }),
  ]);

  return { module, lessons: pageResult(items, total, args) };
}

export async function upsertLesson(
  organizationId: string,
  actorUserId: string,
  actorRole: ActorRole,
  input: LessonInput,
) {
  const courseScope = scopedCourseWhere(organizationId, actorUserId, actorRole);
  const youtubeVideoId = normalizeLessonYouTubeVideoId(input.youtubeUrl);

  return prisma.$transaction(async (tx) => {
    if (input.id) {
      const current = await tx.lesson.findFirstOrThrow({
        where: { id: input.id, module: { course: courseScope } },
        select: { position: true, moduleId: true },
      });

      const total = await tx.lesson.count({ where: { moduleId: current.moduleId } });
      const position = clampPosition(input.position, total);

      if (position !== current.position) {
        const siblings = await tx.lesson.findMany({
          where: {
            moduleId: current.moduleId,
            id: { not: input.id },
            position: positionRangeFilter(current.position, position),
          },
          select: { id: true, position: true },
        });

        await shiftPositions(tx.lesson, [
          ...siblings.map((sibling) => ({
            id: sibling.id,
            position: shiftedSiblingPosition(sibling.position, current.position, position),
          })),
          { id: input.id, position },
        ]);
      }

      return tx.lesson.update({
        where: { id: input.id },
        data: {
          title: input.title,
          description: input.description,
          youtubeUrl: input.youtubeUrl,
          youtubeVideoId,
          coverImageUrl: input.coverImageUrl,
          position,
          status: input.status,
        },
      });
    }

    const lessonModule = await tx.module.findFirstOrThrow({
      where: { id: input.moduleId, course: courseScope },
      select: { id: true },
    });

    const total = await tx.lesson.count({ where: { moduleId: lessonModule.id } });
    const position = clampPosition(input.position, total + 1);

    const siblings = await tx.lesson.findMany({
      where: { moduleId: lessonModule.id, position: { gte: position } },
      select: { id: true, position: true },
    });

    if (siblings.length > 0) {
      await shiftPositions(
        tx.lesson,
        siblings.map((sibling) => ({ id: sibling.id, position: sibling.position + 1 })),
      );
    }

    return tx.lesson.create({
      data: {
        moduleId: lessonModule.id,
        title: input.title,
        description: input.description,
        youtubeUrl: input.youtubeUrl,
        youtubeVideoId,
        coverImageUrl: input.coverImageUrl,
        position,
        status: input.status ?? LessonStatus.ACTIVE,
      },
    });
  });
}

export async function deleteLesson(
  organizationId: string,
  actorUserId: string,
  actorRole: ActorRole,
  id: string,
) {
  return prisma.lesson.deleteMany({
    where: { id, module: { course: scopedCourseWhere(organizationId, actorUserId, actorRole) } },
  });
}

// Limpa a transcricao para que possa ser gerada de novo.
export async function clearLessonTranscript(
  organizationId: string,
  actorUserId: string,
  actorRole: ActorRole,
  id: string,
) {
  return prisma.lesson.updateMany({
    where: { id, module: { course: scopedCourseWhere(organizationId, actorUserId, actorRole) } },
    data: { transcript: null },
  });
}

export async function listLessonMaterials(
  organizationId: string,
  actorUserId: string,
  actorRole: ActorRole,
  lessonId: string,
) {
  try {
    return await prisma.lessonMaterial.findMany({
      where: {
        lessonId,
        lesson: {
          module: {
            course: scopedCourseWhere(organizationId, actorUserId, actorRole),
          },
        },
      },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2021"
    ) {
      // Backward-compatible fallback when lesson_materials migration is not applied yet.
      return [];
    }

    throw error;
  }
}

export async function upsertLessonMaterial(
  organizationId: string,
  actorUserId: string,
  actorRole: ActorRole,
  input: LessonMaterialInput,
) {
  const courseScope = scopedCourseWhere(organizationId, actorUserId, actorRole);

  return prisma.$transaction(async (tx) => {
    if (input.id) {
      const current = await tx.lessonMaterial.findFirstOrThrow({
        where: { id: input.id, lesson: { module: { course: courseScope } } },
        select: { position: true, lessonId: true },
      });

      const total = await tx.lessonMaterial.count({ where: { lessonId: current.lessonId } });
      const position = clampPosition(input.position, total);

      if (position !== current.position) {
        const siblings = await tx.lessonMaterial.findMany({
          where: {
            lessonId: current.lessonId,
            id: { not: input.id },
            position: positionRangeFilter(current.position, position),
          },
          select: { id: true, position: true },
        });

        await shiftPositions(tx.lessonMaterial, [
          ...siblings.map((sibling) => ({
            id: sibling.id,
            position: shiftedSiblingPosition(sibling.position, current.position, position),
          })),
          { id: input.id, position },
        ]);
      }

      return tx.lessonMaterial.update({
        where: { id: input.id },
        data: {
          type: input.type,
          title: input.title,
          url: input.url,
          position,
          status: input.status,
        },
      });
    }

    const lesson = await tx.lesson.findFirstOrThrow({
      where: { id: input.lessonId, module: { course: courseScope } },
      select: { id: true },
    });

    const total = await tx.lessonMaterial.count({ where: { lessonId: lesson.id } });
    const position = clampPosition(input.position, total + 1);

    const siblings = await tx.lessonMaterial.findMany({
      where: { lessonId: lesson.id, position: { gte: position } },
      select: { id: true, position: true },
    });

    if (siblings.length > 0) {
      await shiftPositions(
        tx.lessonMaterial,
        siblings.map((sibling) => ({ id: sibling.id, position: sibling.position + 1 })),
      );
    }

    return tx.lessonMaterial.create({
      data: {
        lessonId: lesson.id,
        type: input.type,
        title: input.title,
        url: input.url,
        position,
        status: input.status ?? LessonMaterialStatus.ACTIVE,
      },
    });
  });
}

export async function deleteLessonMaterial(
  organizationId: string,
  actorUserId: string,
  actorRole: ActorRole,
  id: string,
) {
  return prisma.lessonMaterial.deleteMany({
    where: {
      id,
      lesson: {
        module: {
          course: scopedCourseWhere(organizationId, actorUserId, actorRole),
        },
      },
    },
  });
}

export function normalizeLessonYouTubeVideoId(videoUrl: string) {
  return extractYouTubeVideoId(videoUrl);
}
