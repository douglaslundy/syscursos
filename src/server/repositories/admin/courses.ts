import { CourseStatus, Prisma, UserRole } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { CourseInput } from "@/server/validators/admin";
import { PageArgs, ActorRole, offset, pageResult, scopedCourseWhere } from "@/server/repositories/admin/shared";

export async function listCourses(
  organizationId: string,
  actorUserId: string,
  actorRole: ActorRole,
  args: PageArgs,
) {
  const courseScope = scopedCourseWhere(organizationId, actorUserId, actorRole);
  const where: Prisma.CourseWhereInput = args.query
    ? {
        ...courseScope,
        OR: [
          { title: { contains: args.query, mode: "insensitive" } },
          { slug: { contains: args.query, mode: "insensitive" } },
        ],
      }
    : courseScope;

  const [items, total] = await prisma.$transaction([
    prisma.course.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      skip: offset(args),
      take: args.pageSize,
      include: {
        _count: {
          select: { modules: true, enrollments: true },
        },
      },
    }),
    prisma.course.count({ where }),
  ]);

  return pageResult(items, total, args);
}

export async function listCourseOptions(
  organizationId: string,
  actorUserId: string,
  actorRole: ActorRole,
) {
  return prisma.course.findMany({
    where: scopedCourseWhere(organizationId, actorUserId, actorRole),
    orderBy: { title: "asc" },
    select: { id: true, title: true },
  });
}

export async function upsertCourse(
  organizationId: string,
  actorUserId: string,
  actorRole: ActorRole,
  input: CourseInput,
) {
  const courseScope = scopedCourseWhere(organizationId, actorUserId, actorRole);
  if (input.id) {
    return prisma.course.updateMany({
      where: { id: input.id, ...courseScope },
      data: {
        title: input.title,
        slug: input.slug,
        description: input.description,
        coverImageUrl: input.coverImageUrl,
        status: input.status,
        isPublic: input.isPublic,
      },
    });
  }

  return prisma.course.create({
    data: {
      organizationId,
      producerId: actorRole === UserRole.PRODUCER ? actorUserId : actorUserId,
      title: input.title,
      slug: input.slug,
      description: input.description,
      coverImageUrl: input.coverImageUrl,
      status: input.status ?? CourseStatus.ACTIVE,
      isPublic: input.isPublic,
    },
  });
}

export async function deleteCourse(
  organizationId: string,
  actorUserId: string,
  actorRole: ActorRole,
  id: string,
) {
  return prisma.course.deleteMany({ where: { id, ...scopedCourseWhere(organizationId, actorUserId, actorRole) } });
}

export async function listCourseLessonsForDuration(
  organizationId: string,
  actorUserId: string,
  actorRole: ActorRole,
  courseId: string,
) {
  return prisma.lesson.findMany({
    where: {
      status: "ACTIVE",
      module: { courseId, course: scopedCourseWhere(organizationId, actorUserId, actorRole) },
    },
    orderBy: [{ module: { position: "asc" } }, { position: "asc" }],
    select: { id: true, youtubeUrl: true, youtubeVideoId: true, durationSeconds: true },
  });
}

export async function setLessonDuration(lessonId: string, durationSeconds: number) {
  return prisma.lesson.update({ where: { id: lessonId }, data: { durationSeconds } });
}

// Aulas ativas com e sem duracao lida, por curso (restrito ao escopo do ator).
export async function getDurationCoverage(
  organizationId: string,
  actorUserId: string,
  actorRole: ActorRole,
  courseIds: string[],
) {
  if (courseIds.length === 0) {
    return [];
  }

  const producerId = actorRole === UserRole.ADMIN ? null : actorUserId;
  const rows = await prisma.$queryRaw<Array<{ course_id: string; total: number; read: number; none: number }>>`
    select m.course_id, count(*)::int as total, count(l.duration_seconds)::int as read,
           count(*) filter (where l.duration_seconds = 0)::int as none
    from lessons l
    join modules m on m.id = l.module_id
    join courses c on c.id = m.course_id
    where l.status::text = 'ACTIVE'
      and c.organization_id = ${organizationId}::uuid
      and (${producerId}::uuid is null or c.producer_id = ${producerId}::uuid)
      and m.course_id = any(${courseIds}::uuid[])
    group by m.course_id`;
  return rows.map((row) => ({ courseId: row.course_id, total: row.total, read: row.read, none: row.none }));
}
