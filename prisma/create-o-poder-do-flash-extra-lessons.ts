import { CourseStatus, LessonStatus, ModuleStatus, PrismaClient, UserRole, UserStatus } from "@prisma/client";

const prisma = new PrismaClient();

const PRODUCER_EMAIL = "douglaslundy@gmail.com";
const COURSE_TITLE = "O PODER DO FLASH";
const MODULE_TITLE = "CONTEUDO EXTRA";

type LessonSeed = {
  position: number;
  title: string;
  youtubeUrl: string;
};

const lessons: LessonSeed[] = [
  { position: 1, title: stripLeadingNumberPrefix("20 CAPTURA VICULADA"), youtubeUrl: "https://www.youtube.com/watch?v=bBpDevYhWWI" },
  { position: 2, title: stripLeadingNumberPrefix("21 MONITOR"), youtubeUrl: "https://www.youtube.com/watch?v=ByotOar6TSY" },
  { position: 3, title: stripLeadingNumberPrefix("22 SET FUNDO BRANCO  SOMBRA SUAVE"), youtubeUrl: "https://www.youtube.com/watch?v=9D4R64VJjhE" },
  { position: 4, title: stripLeadingNumberPrefix("23 SET LUZ DE SILUETA"), youtubeUrl: "https://www.youtube.com/watch?v=l0d5ltWWfmA" },
  { position: 5, title: stripLeadingNumberPrefix("24 SET FUNDO ESCURO - 45 - LATERAL - RECORTE"), youtubeUrl: "https://www.youtube.com/watch?v=RC4H11zPR_4" },
  { position: 6, title: stripLeadingNumberPrefix("25 SET CANTINHO ILUMINADO"), youtubeUrl: "https://www.youtube.com/watch?v=889EmWVCiQI" },
  { position: 7, title: stripLeadingNumberPrefix("26 SET DEGRADÊ"), youtubeUrl: "https://www.youtube.com/watch?v=UryA6Cqd9mM" },
  { position: 8, title: stripLeadingNumberPrefix("27 SET LUZ DE RECORTE"), youtubeUrl: "https://www.youtube.com/watch?v=ld5iFOCwaqI" },
  { position: 9, title: stripLeadingNumberPrefix("28 SET LUZ DE BELEZA"), youtubeUrl: "https://www.youtube.com/watch?v=TmM5scckWyQ" },
  { position: 10, title: stripLeadingNumberPrefix("29 SET LUZ DE LOOKBOOK"), youtubeUrl: "https://www.youtube.com/watch?v=2-H5uxpOuFk" },
  { position: 11, title: stripLeadingNumberPrefix("30 SET LUZ DURA"), youtubeUrl: "https://www.youtube.com/watch?v=lsPvsPMdghc" },
  { position: 12, title: stripLeadingNumberPrefix("31 SET COM TAPADEIRA"), youtubeUrl: "https://www.youtube.com/watch?v=HqqVSF1kGJo" },
  { position: 13, title: stripLeadingNumberPrefix("32 SET COM TAPADEIRA"), youtubeUrl: "https://www.youtube.com/watch?v=vUG0yZLhfiQ" },
  { position: 14, title: stripLeadingNumberPrefix("33 SET RECORTE COLORIDO"), youtubeUrl: "https://www.youtube.com/watch?v=mFYPDTi23V8" },
  { position: 15, title: stripLeadingNumberPrefix("34 SET COM SNOOT ÓPTICO"), youtubeUrl: "https://www.youtube.com/watch?v=3GgdhLXt-Fg" },
];

function stripLeadingNumberPrefix(value: string): string {
  return value.replace(/^\s*\d+\s+/, "").trim();
}

function extractYouTubeVideoId(youtubeUrl: string): string | null {
  try {
    const url = new URL(youtubeUrl);
    const hostname = url.hostname.toLowerCase();

    if (hostname === "youtu.be") {
      return normalizeVideoId(url.pathname.split("/").filter(Boolean)[0] ?? null);
    }

    if (hostname.includes("youtube.com")) {
      if (url.pathname === "/watch") {
        return normalizeVideoId(url.searchParams.get("v"));
      }

      if (url.pathname.startsWith("/embed/") || url.pathname.startsWith("/shorts/") || url.pathname.startsWith("/live/")) {
        return normalizeVideoId(url.pathname.split("/")[2] ?? null);
      }
    }

    return null;
  } catch {
    return null;
  }
}

function normalizeVideoId(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (!/^[A-Za-z0-9_-]{6,32}$/.test(trimmed)) {
    return null;
  }

  return trimmed;
}

async function main() {
  const producer = await prisma.user.findFirst({
    where: {
      email: PRODUCER_EMAIL,
      role: UserRole.PRODUCER,
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

  const course = await prisma.course.findFirst({
    where: {
      title: COURSE_TITLE,
      producerId: producer.id,
      organizationId: producer.organizationId,
      status: CourseStatus.ACTIVE,
    },
    select: {
      id: true,
      title: true,
    },
  });

  if (!course) {
    throw new Error(`Curso ${COURSE_TITLE} nao encontrado para o produtor ${PRODUCER_EMAIL}.`);
  }

  const moduleRecord = await prisma.module.findFirst({
    where: {
      courseId: course.id,
      title: MODULE_TITLE,
      status: ModuleStatus.ACTIVE,
    },
    select: {
      id: true,
      title: true,
    },
  });

  if (!moduleRecord) {
    throw new Error(`Modulo ${MODULE_TITLE} nao encontrado no curso ${COURSE_TITLE}.`);
  }

  await prisma.lesson.deleteMany({
    where: {
      moduleId: moduleRecord.id,
    },
  });

  for (const lesson of lessons) {
    await prisma.lesson.create({
      data: {
        moduleId: moduleRecord.id,
        title: lesson.title,
        position: lesson.position,
        status: LessonStatus.ACTIVE,
        description: null,
        youtubeUrl: lesson.youtubeUrl,
        youtubeVideoId: extractYouTubeVideoId(lesson.youtubeUrl),
      },
    });
  }

  console.log(`Curso ${COURSE_TITLE} atualizado com sucesso.`);
  console.log(`Modulo alvo: ${moduleRecord.title}.`);
  console.log(`Aulas cadastradas: ${lessons.length}.`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
