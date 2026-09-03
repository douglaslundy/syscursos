import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  CourseStatus,
  LessonStatus,
  ModuleStatus,
  PrismaClient,
  UserRole,
  UserStatus,
} from "@prisma/client";

const prisma = new PrismaClient();

const PRODUCER_EMAIL = "douglaslundy@gmail.com";
const COURSE_TITLE = "ORATÓRIA PARA INICIANTE - ROBERTO MALLET";
const COURSE_SLUG = "oratoria-para-iniciante-roberto-mallet";

type LessonSeed = {
  position: number;
  title: string;
  videoUrl: string;
};

type ModuleSeed = {
  position: number;
  title: string;
  lessons: LessonSeed[];
};

const MODULES: ModuleSeed[] = [
  {
    position: 1,
    title: "Edição Definitiva",
    lessons: [
      { position: 1, title: "Boas Vindas", videoUrl: "https://drive.google.com/file/d/1BnXvQG3tGn0oORVw4SBmxUU2uG38Ob43/view" },
      { position: 2, title: "Os 3 Tipos de Iniciantes", videoUrl: "https://drive.google.com/file/d/13NeasXFkj7CWZHDAYkH7EL9QU8uXnV6f/view" },
      { position: 3, title: "A Origem dos Bloqueios Físicos e Emocionais", videoUrl: "https://drive.google.com/file/d/1aF_iUZ0-5ccT-MJDNRJ_F1ub0Gv9RA5r/view" },
      { position: 4, title: "Como Ter Atitude", videoUrl: "https://drive.google.com/file/d/1CxMTBh-ib1R6rVemTnUxTaToY7vgMAfs/view" },
      { position: 5, title: "Recuperando sua Respiração", videoUrl: "https://drive.google.com/file/d/1GwuDIR0xSXdMhLXH1ORyrCKPlLKYlYDT/view" },
      { position: 6, title: "Ressonância Vocal", videoUrl: "https://drive.google.com/file/d/16BFAiPnj55X2CJqj59XmxjCQCjsfJ4JC/view" },
      { position: 7, title: "Conclusão e Certificação", videoUrl: "https://drive.google.com/file/d/1V6Ll7aaKBqe7LoCEMmCqvKpE6vb95Ao-/view" },
    ],
  },
  {
    position: 2,
    title: "Biblioteca de Exercicios",
    lessons: [
      { position: 1, title: "Exercício Atitude Sentado", videoUrl: "https://drive.google.com/file/d/1OVGV-qrqBqhuFDfbHyZKtrQbRo_syir7/view" },
      { position: 2, title: "Exercício Atitude Alongamento", videoUrl: "https://drive.google.com/file/d/1p-DTzDZL3q0VAELvsm02X3SzK2rPH5Bo/view" },
      { position: 3, title: "Exercício Atitude em Pé", videoUrl: "https://drive.google.com/file/d/1zBaNZj_x18LmZG5UkkGkjKVI2fVsFPQ4/view" },
      { position: 4, title: "Exercício Respiração Deitado", videoUrl: "https://drive.google.com/file/d/14-9-aNmgWokgh_wN4NYJUS2hcOYRwBpT/view" },
      { position: 5, title: "Exercício Respiração Sentado", videoUrl: "https://drive.google.com/file/d/1zvc17aSEg77Gq4hdMuMAHWI4pDUQLvDt/view" },
      { position: 6, title: "Exercício de Aquecimento Vocal", videoUrl: "https://drive.google.com/file/d/1FDflBHVbN8eP3h7tY9usOE7zX97UbTk9/view" },
      { position: 7, title: "Exercício de Ressonância Vocal", videoUrl: "https://drive.google.com/file/d/1K9qN5isc8oCxWu72Y1zOaiLqR5See9Rt/view" },
    ],
  },
  {
    position: 3,
    title: "Edição Original 2023",
    lessons: [
      { position: 1, title: "A Tradição Aristotélica", videoUrl: "https://drive.google.com/file/d/1aMhOav9w00cXF8dV2RvpPX-BeBkE1L-z/view" },
      { position: 2, title: "Técnica do Discurso", videoUrl: "https://drive.google.com/file/d/1H0BcC5oAxgjsZ6P0bYQA4_c5NdK6K2g7/view" },
      { position: 3, title: "Antologia do Discurso", videoUrl: "https://drive.google.com/file/d/1EsRrkzF9i8xIytlasz5-QtJYTObtRCbs/view" },
    ],
  },
];

function loadLocalEnv() {
  const envPath = resolve(process.cwd(), ".env");

  if (!existsSync(envPath)) {
    return;
  }

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^["']|["']$/g, "");

    process.env[key] ??= value;
  }
}

function assertValidDriveUrl(url: string) {
  if (!/^https:\/\/drive\.google\.com\/file\/d\/[A-Za-z0-9_-]+/.test(url)) {
    throw new Error(`URL de video fora do padrao aceito pelo banco: ${url}`);
  }
}

async function main() {
  loadLocalEnv();

  for (const moduleSeed of MODULES) {
    for (const lessonSeed of moduleSeed.lessons) {
      assertValidDriveUrl(lessonSeed.videoUrl);
    }
  }

  const producer = await prisma.user.findFirst({
    where: {
      email: PRODUCER_EMAIL,
      role: { in: [UserRole.PRODUCER, UserRole.ADMIN] },
      status: UserStatus.ACTIVE,
    },
    select: {
      id: true,
      organizationId: true,
    },
  });

  if (!producer) {
    throw new Error(`Produtor ${PRODUCER_EMAIL} nao encontrado ou inativo.`);
  }

  const course = await prisma.course.upsert({
    where: { slug: COURSE_SLUG },
    update: {
      title: COURSE_TITLE,
      status: CourseStatus.ACTIVE,
      organizationId: producer.organizationId,
      producerId: producer.id,
    },
    create: {
      title: COURSE_TITLE,
      slug: COURSE_SLUG,
      status: CourseStatus.ACTIVE,
      description: null,
      organizationId: producer.organizationId,
      producerId: producer.id,
    },
    select: { id: true },
  });

  await prisma.module.deleteMany({ where: { courseId: course.id } });

  for (const moduleSeed of MODULES) {
    const createdModule = await prisma.module.create({
      data: {
        courseId: course.id,
        title: moduleSeed.title,
        position: moduleSeed.position,
        status: ModuleStatus.ACTIVE,
        description: null,
      },
      select: { id: true },
    });

    for (const lessonSeed of moduleSeed.lessons) {
      await prisma.lesson.create({
        data: {
          moduleId: createdModule.id,
          title: lessonSeed.title,
          position: lessonSeed.position,
          status: LessonStatus.ACTIVE,
          description: null,
          youtubeUrl: lessonSeed.videoUrl,
          youtubeVideoId: null,
        },
      });
    }
  }

  console.log(`Curso "${COURSE_TITLE}" (slug ${COURSE_SLUG}) cadastrado/atualizado com sucesso.`);
  console.log(`Modulos cadastrados: ${MODULES.length}.`);
  console.log(`Aulas cadastradas: ${MODULES.reduce((total, moduleSeed) => total + moduleSeed.lessons.length, 0)}.`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
