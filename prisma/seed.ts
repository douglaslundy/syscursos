import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const organization = await prisma.organization.upsert({
    where: { id: "11111111-1111-1111-1111-111111111111" },
    update: {
      name: "SysCursos Tenant Demo",
    },
    create: {
      id: "11111111-1111-1111-1111-111111111111",
      name: "SysCursos Tenant Demo",
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@syscursos.local" },
    update: {
      organizationId: organization.id,
      name: "Admin SysCursos",
      role: UserRole.ADMIN,
      status: "ACTIVE",
    },
    create: {
      organizationId: organization.id,
      email: "admin@syscursos.local",
      name: "Admin SysCursos",
      role: UserRole.ADMIN,
      status: "ACTIVE",
    },
  });

  const studentUser = await prisma.user.upsert({
    where: { email: "aluno@syscursos.local" },
    update: {
      organizationId: organization.id,
      name: "Aluno Demonstracao",
      role: UserRole.STUDENT,
      status: "ACTIVE",
    },
    create: {
      organizationId: organization.id,
      email: "aluno@syscursos.local",
      name: "Aluno Demonstracao",
      role: UserRole.STUDENT,
      status: "ACTIVE",
    },
  });

  const producer = await prisma.user.upsert({
    where: { email: "produtor@syscursos.local" },
    update: {
      organizationId: organization.id,
      name: "Produtor Demonstracao",
      role: UserRole.PRODUCER,
      status: "ACTIVE",
    },
    create: {
      organizationId: organization.id,
      email: "produtor@syscursos.local",
      name: "Produtor Demonstracao",
      role: UserRole.PRODUCER,
      status: "ACTIVE",
    },
  });

  const student = await prisma.studentProfile.upsert({
    where: { userId: studentUser.id },
    update: {
      phone: "+5500000000000",
    },
    create: {
      userId: studentUser.id,
      phone: "+5500000000000",
    },
  });

  const course = await prisma.course.upsert({
    where: { slug: "curso-demonstracao" },
    update: {
      organizationId: organization.id,
      producerId: producer.id,
      title: "Curso Demonstracao",
      description: "Curso inicial usado para validar a camada de banco.",
      status: "ACTIVE",
    },
    create: {
      organizationId: organization.id,
      producerId: producer.id,
      title: "Curso Demonstracao",
      slug: "curso-demonstracao",
      description: "Curso inicial usado para validar a camada de banco.",
      status: "ACTIVE",
    },
  });

  const module = await prisma.module.upsert({
    where: {
      courseId_position: {
        courseId: course.id,
        position: 1,
      },
    },
    update: {
      title: "Primeiro modulo",
      description: "Modulo inicial do curso de demonstracao.",
      status: "ACTIVE",
    },
    create: {
      courseId: course.id,
      title: "Primeiro modulo",
      description: "Modulo inicial do curso de demonstracao.",
      position: 1,
      status: "ACTIVE",
    },
  });

  const lesson = await prisma.lesson.upsert({
    where: {
      moduleId_position: {
        moduleId: module.id,
        position: 1,
      },
    },
    update: {
      title: "Aula inicial",
      youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      youtubeVideoId: "dQw4w9WgXcQ",
      status: "ACTIVE",
    },
    create: {
      moduleId: module.id,
      title: "Aula inicial",
      youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      youtubeVideoId: "dQw4w9WgXcQ",
      position: 1,
      status: "ACTIVE",
    },
  });

  await prisma.enrollment.upsert({
    where: {
      studentId_courseId: {
        studentId: student.id,
        courseId: course.id,
      },
    },
    update: {
      startsAt: new Date("2026-05-04T00:00:00.000Z"),
      expiresAt: new Date("2027-05-04T00:00:00.000Z"),
      status: "ACTIVE",
    },
    create: {
      studentId: student.id,
      courseId: course.id,
      startsAt: new Date("2026-05-04T00:00:00.000Z"),
      expiresAt: new Date("2027-05-04T00:00:00.000Z"),
      status: "ACTIVE",
    },
  });

  await prisma.producerStudent.upsert({
    where: {
      producerId_studentId: {
        producerId: producer.id,
        studentId: student.id,
      },
    },
    update: {},
    create: {
      producerId: producer.id,
      studentId: student.id,
    },
  });

  await prisma.lessonNote.upsert({
    where: {
      studentId_lessonId: {
        studentId: student.id,
        lessonId: lesson.id,
      },
    },
    update: {
      content: "Anotacao inicial de demonstracao.",
    },
    create: {
      studentId: student.id,
      lessonId: lesson.id,
      content: "Anotacao inicial de demonstracao.",
    },
  });

  await prisma.lessonProgress.upsert({
    where: {
      studentId_lessonId: {
        studentId: student.id,
        lessonId: lesson.id,
      },
    },
    update: {
      status: "NOT_STARTED",
      completedAt: null,
    },
    create: {
      studentId: student.id,
      lessonId: lesson.id,
      status: "NOT_STARTED",
    },
  });

  console.log(`Seed concluido para ${admin.email} e ${studentUser.email}.`);
}

main()
  .catch((error: unknown) => {
    console.error("Erro ao executar seed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
