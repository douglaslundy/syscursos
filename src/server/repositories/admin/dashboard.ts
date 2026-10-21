import { EnrollmentStatus, LessonStatus, Prisma, UserRole, UserStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { ActorRole, DashboardFilters, scopedCourseWhereWithFilters, scopedStudentWhereWithFilters } from "@/server/repositories/admin/shared";

export async function getAdminDashboardStats(
  organizationId: string,
  actorUserId: string,
  actorRole: ActorRole,
  filters?: DashboardFilters,
) {
  const courseWhere = scopedCourseWhereWithFilters(organizationId, actorUserId, actorRole, filters);
  const studentWhere = scopedStudentWhereWithFilters(organizationId, actorUserId, actorRole, filters);
  const [courses, students, enrollments, lessons, activeLessons, inactiveLessons, producers] = await prisma.$transaction([
    prisma.course.count({ where: courseWhere }),
    prisma.studentProfile.count({ where: studentWhere }),
    prisma.enrollment.count({
      where: { status: EnrollmentStatus.ACTIVE, course: courseWhere, student: studentWhere },
    }),
    prisma.lesson.count({ where: { module: { course: courseWhere } } }),
    prisma.lesson.count({ where: { status: LessonStatus.ACTIVE, module: { course: courseWhere } } }),
    prisma.lesson.count({ where: { status: LessonStatus.INACTIVE, module: { course: courseWhere } } }),
    prisma.user.count({
      where:
        actorRole === UserRole.ADMIN
          ? { organizationId, role: UserRole.PRODUCER, status: UserStatus.ACTIVE }
          : { id: actorUserId, role: UserRole.PRODUCER, status: UserStatus.ACTIVE },
    }),
  ]);

  const [completedLessons] = await Promise.all([
    prisma.lessonProgress.count({
      where: {
        status: "COMPLETED",
        student: studentWhere,
        lesson: { status: LessonStatus.ACTIVE, module: { course: courseWhere } },
      },
    }),
  ]);

  const pendingLessons = Math.max(0, enrollments * activeLessons - completedLessons);

  return {
    courses,
    students,
    enrollments,
    lessons,
    activeLessons,
    inactiveLessons,
    completedLessons,
    pendingLessons,
    producers,
  };
}

// Sem limite a consulta agrega todos os alunos; com milhares de alunos o filtro por produtor/aluno do painel reduz a lista.
export const CONSUMPTION_LIMIT = 100;

export async function getAdminConsumptionMetrics(
  organizationId: string,
  actorUserId: string,
  actorRole: ActorRole,
  filters?: DashboardFilters,
) {
  const producerFilter = actorRole === UserRole.ADMIN ? filters?.producerId ?? null : actorUserId;
  const studentFilter = filters?.studentId ?? null;
  const studentScopeForCourse = producerFilter
    ? Prisma.sql`AND EXISTS (
      SELECT 1
      FROM producer_students ps
      WHERE ps.student_id = s.id
      AND ps.producer_id = ${producerFilter}::uuid
    )`
    : Prisma.sql``;
  const studentScope = actorRole === UserRole.ADMIN
    ? Prisma.sql`u.organization_id = ${organizationId}::uuid AND u.role = 'STUDENT'`
    : Prisma.sql`EXISTS (
      SELECT 1
      FROM producer_students ps_scope
      WHERE ps_scope.student_id = s.id
      AND ps_scope.producer_id = ${actorUserId}::uuid
    )`;

  const rows = await prisma.$queryRaw<
    Array<{
      student_id: string;
      name: string;
      email: string;
      last_login_at: Date | null;
      active_enrollments: bigint;
      total_enrollments: bigint;
      completed_lessons: bigint;
    }>
  >(Prisma.sql`
    SELECT
      s.id AS student_id,
      u.name,
      u.email,
      u.last_login_at,
      COUNT(DISTINCT CASE WHEN e.status = 'ACTIVE' THEN e.id END) AS active_enrollments,
      COUNT(DISTINCT e.id) AS total_enrollments,
      COUNT(DISTINCT lp.lesson_id) AS completed_lessons
    FROM student_profiles s
    INNER JOIN users u ON u.id = s.user_id
    LEFT JOIN enrollments e
      ON e.student_id = s.id
      AND EXISTS (
        SELECT 1
        FROM courses c
        WHERE c.id = e.course_id
          AND c.organization_id = ${organizationId}::uuid
          ${producerFilter ? Prisma.sql`AND c.producer_id = ${producerFilter}::uuid` : Prisma.sql``}
      )
    LEFT JOIN lesson_progress lp
      ON lp.student_id = s.id
      AND lp.status = 'COMPLETED'
      AND EXISTS (
        SELECT 1
        FROM lessons l
        INNER JOIN modules m ON m.id = l.module_id
        INNER JOIN courses c2 ON c2.id = m.course_id
        WHERE l.id = lp.lesson_id
          AND c2.organization_id = ${organizationId}::uuid
          ${producerFilter ? Prisma.sql`AND c2.producer_id = ${producerFilter}::uuid` : Prisma.sql``}
      )
    WHERE
      ${studentScope}
      ${studentScopeForCourse}
      ${studentFilter ? Prisma.sql`AND s.id = ${studentFilter}::uuid` : Prisma.sql``}
    GROUP BY s.id, u.name, u.email, u.last_login_at
    ORDER BY u.name ASC
    LIMIT ${CONSUMPTION_LIMIT}
  `);

  return rows.map((row) => ({
    studentId: row.student_id,
    name: row.name,
    email: row.email,
    lastLoginAt: row.last_login_at,
    activeEnrollments: Number(row.active_enrollments),
    totalEnrollments: Number(row.total_enrollments),
    completedLessons: Number(row.completed_lessons),
  }));
}
