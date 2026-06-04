import { CourseStatus, LessonStatus, ModuleStatus, PrismaClient, UserRole, UserStatus } from "@prisma/client";

const prisma = new PrismaClient();

const PRODUCER_EMAIL = "douglaslundy@gmail.com";
const COURSE_TITLE = "Mestre co Claude";
const COURSE_SLUG = normalizeSlug(COURSE_TITLE);

type LessonSeed = {
  position: number;
  title: string;
  youtubeUrl: string;
};

type MissingLessonSeed = {
  position: number;
  title: string;
  reason: string;
};

type ModuleSeed = {
  position: number;
  title: string;
  lessons: LessonSeed[];
  missingLessons?: MissingLessonSeed[];
};

const modules: ModuleSeed[] = [
  {
    position: 1,
    title: stripLeadingNumberPrefix("01 Mestre do Claude do Zero ao Avançado"),
    lessons: [
      lesson(1, "Casos de Uso do Claude", "kgwrDVHhIFM"),
      lesson(2, "Claude Dispatch", "0UdMaq1s8QY"),
      lesson(3, "Como aumentar sua produtividade em 20x", "8JoSGfpMchQ"),
      lesson(4, "como claude realmente funciona", "-95Q2n2obUA"),
      lesson(5, "Como criar sistemas autonomos que trabalham por você", "djBbOsjd8gw"),
      lesson(6, "Como criar suas proprias skills", "76H36IQaJI8"),
      lesson(7, "como desbloquear todo poder", "Nb6P6IzEipw"),
      lesson(8, "como instalar o claude e qual melhor plano", "ahxU6tsVPmI"),
      lesson(9, "como programar tarefas claude cowork", "cRUB3YZlxsU"),
      lesson(10, "exemplo de projeto com claude cowork", "cRUB3YZlxsU"),
      lesson(11, "Fundamentos Essenciais", "YMZ4Nd9UDD0"),
      lesson(12, "Introdução e Cronograma", "BFqGKIDDuxo"),
      lesson(13, "Setup Inicial Claude", "gxEfXyw2LWI"),
    ],
  },
  {
    position: 2,
    title: stripLeadingNumberPrefix("02 CLAUDE Code e seu primeiro Squad de Agentes"),
    lessons: [
      lesson(1, "Como criar Dashbopards Usando time de agentes", "n3zFcoDDwbQ"),
      lesson(2, "Como criar uma API para o instagran", "8C0UFeH-fnA"),
      lesson(3, "Como instalar o VS CODE", "9ae1rx6sFr4"),
      lesson(4, "Como integrar o Claude Code", "JD4fl9oIn9M"),
      lesson(5, "Criando seu primeiro video Motion", "U--NfZ8ChgM"),
      lesson(6, "Instalando api de Pesquisa de Mercado", "q1sMeMI6e4M"),
      lesson(7, "Instalando todos os Agentes", "QJf8hT1oSxU"),
      lesson(8, "Introdução - Primeiro time de agentes", "UwfsGuJlx6c"),
      lesson(9, "Primeiro Teste dos Agentes", "tCuiZMI8lEw"),
    ],
  },
  {
    position: 3,
    title: stripLeadingNumberPrefix("03 Squad Audio Visual"),
    lessons: [
      lesson(1, "Agente de Carrosseis na pratica", "dhHTR2QN_94"),
      lesson(2, "Agente de sites na pratica", "xh8rtwFt1jw"),
      lesson(3, "agentes de video e edição", "ksBQM3cBe4w"),
      lesson(4, "Estrutura das Paginas", "j0Ms_CBdZmQ"),
      lesson(5, "Introdução segundo time focado em design", "ib3MTZBlieg"),
    ],
    missingLessons: [
      {
        position: 6,
        title: "Site em 5 Minutos com claude Chat + Gemini",
        reason: "URL do video nao foi fornecida no pedido.",
      },
      {
        position: 7,
        title: "Aulão como montar seu site em 5 minutos",
        reason: "URL do video nao foi fornecida no pedido.",
      },
    ],
  },
];

function lesson(position: number, title: string, videoId: string): LessonSeed {
  return {
    position,
    title,
    youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
  };
}

function stripLeadingNumberPrefix(value: string) {
  return value.replace(/^\s*\d+\s*[-.)]?\s*/, "").trim();
}

function normalizeSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
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

  const course = await prisma.course.upsert({
    where: { slug: COURSE_SLUG },
    update: {
      title: COURSE_TITLE,
      status: CourseStatus.ACTIVE,
      description: null,
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

  for (const moduleSeed of modules) {
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
          youtubeUrl: lessonSeed.youtubeUrl,
          youtubeVideoId: extractYouTubeVideoId(lessonSeed.youtubeUrl),
        },
      });
    }
  }

  const skipped = modules.flatMap((moduleSeed) =>
    (moduleSeed.missingLessons ?? []).map((missingLesson) => ({
      module: moduleSeed.title,
      ...missingLesson,
    })),
  );

  console.log(`Curso ${COURSE_TITLE} cadastrado/atualizado com sucesso.`);
  console.log(`Modulos cadastrados: ${modules.length}.`);
  console.log(`Aulas cadastradas: ${modules.reduce((total, moduleSeed) => total + moduleSeed.lessons.length, 0)}.`);

  if (skipped.length > 0) {
    console.warn("Aulas nao cadastradas:");
    for (const missingLesson of skipped) {
      console.warn(`- ${missingLesson.module} | posicao ${missingLesson.position} | ${missingLesson.title}: ${missingLesson.reason}`);
    }
  }
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
