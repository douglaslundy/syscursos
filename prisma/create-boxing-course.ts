import { PrismaClient, CourseStatus, ModuleStatus, LessonStatus, UserRole, UserStatus } from "@prisma/client";

const prisma = new PrismaClient();

const PRODUCER_EMAIL = "douglaslundy@gmail.com";
const COURSE_TITLE = normalizeTitleAfterDash("CURSO DE BOXE");
const COURSE_SLUG = "curso-de-boxe";

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

const playlist = "PLgn2TIIeIaI7bJjdfJwMz_RMgsuIdZYQt";

const modules: ModuleSeed[] = [
  {
    position: 1,
    title: normalizeTitleAfterDash("Modulo 1 - Módulo 1 Introdução Box (Iniciante)"),
    lessons: [
      lesson(1, "Aula 00 - Guia do Curso", "7X5Bim99Nn0"),
      lesson(2, "Aula 01 - O que é o Boxe", "e2Wk4rFzI-U"),
      lesson(3, "Aula 02 - História do Boxe e sua Evolução", "L5kJXF1oHGY"),
      lesson(4, "Aula 03 - Os Diferentes Estilos de Boxeadores", "am2qag0-wvo"),
      lesson(5, "Aula 04 - Equipamentos Essenciais para esse Curso", "FNJREXbwNIM"),
      lesson(6, "Aula 05 - Material Utilizado (Aparelhos)", "Po8ykCdqaj8"),
      lesson(7, "Aula 06 - Como Colocar Bandagens Corretamente", "Z5L6TOL7H94"),
      lesson(8, "Aula 07 - Aquecimento", "_RqYTVK5GZA"),
      lesson(9, "Aula 08 - Introdução às Escolas de Boxe e de Combate", "0wp63NJ7H-s"),
      lesson(10, "Capítulo I - Introdução e Apresentação Pessoal", "RH3nupILKFQ"),
      lesson(11, "Aula 09 - Meio passo", "5JFFHghZ4U8"),
      lesson(12, "Aula 10 - Pivô (Giro Simples)", "CO7ufrFMfGg"),
      lesson(13, "Aula 11 - Principais Golpes (Retos)", "uzetOw1s8TA"),
      lesson(14, "Aula 12 - Golpes Curvos", "cDORqzB1pG8"),
      lesson(15, "Aula 13 - Golpes em Deslocamento - Meio Passo Passo Plano", "wZryScA3wm4"),
      lesson(16, "Aula 14 - Treino de Movimentação", "6dqF65dAh6Q"),
      lesson(17, "Capítulo II - Postura e Movimentação Básica", "JiJJtkD59To"),
      lesson(18, "Aula 15 - Treino no Saco de Pancadas (Considerações)", "KOXVpcnOpC0"),
      lesson(19, "Aula 16 - Repetição dos Golpes (Golpes Retos no Saco de Pancadas)", "E-Ug1Z-3dLw"),
      lesson(20, "Aula 17 - Cruzados e Uppercut (Saco de Pancadas)", "FQHj3UbjoCA"),
      lesson(21, "Aula 18 - Ganchos na Linha de Cintura (Saco de Pancadas)", "qPidrVQ891o"),
      lesson(22, "Aula 19 - Golpes em Deslocamento (Saco de Pancadas)", "OzKz0DDj29E"),
      lesson(23, "Aula 20 - Trabalho Direcionado no Saco de Pancadas", "9pKBXEwJ_bs"),
      lesson(24, "Aula 21 - Trabalho Condicionado no Saco de Pancadas", "3PXI-PgERsU"),
      lesson(25, "Capítulo III - Treinos Iniciais Escola de Boxe Sombra Shadowboxing", "2sERvYzJcBo"),
    ],
  },
  {
    position: 2,
    title: normalizeTitleAfterDash("Modulo 2 - Módulo 2 Evoluindo no treinamento (Intermediario)"),
    lessons: [
      lesson(1, "Aula 22 - Demonstração das Esquivas e Pêndulos", "4hQqBgJbagc"),
      lesson(2, "Aula 23 - Esquivas de Golpes Retos", "KXlcpSGQlZY"),
      lesson(3, "Aula 24 - Pêndulos", "26gxxNR5cIw"),
      lesson(4, "Aula 25 - Esquivas e Pêndulos em Deslocamento", "902WTcTArUE"),
      lesson(5, "Aula 26 - Trabalho de Esquivas no Bastão", "SEdGhM7cWX4"),
      lesson(6, "Aula 27 - Trabalho Condicionado de Ataque e Esquivas", "wqdOTakM_Wo"),
      lesson(7, "Aula 28 - Trabalho Condicionado de Ataque e Esquivas no Saco", "sIy9Ba6rDVE"),
      lesson(8, "Capítulo IV - Técnicas Defensivas (Esquivas Introdução)", "7ozREeeb9Xo"),
      lesson(9, "Aula 30 - Combinações de Golpes Curvos", "vPxFDH_b2xs"),
      lesson(10, "Aula 31 - Alternando entre Cabeça e Linha de Cintura", "9bvKXOWr0Is"),
      lesson(11, "Aula 32 - Sequências Repetindo a mão", "dR5H84f-ukA"),
      lesson(12, "Capítulo V - Combinações de Golpes", "ewGVJaF0afo"),
      lesson(13, "Aula 33 - Demonstração dos Bloqueios de Guarda", "Chk3mYItG9k"),
      lesson(14, "Aula 34 - Bloqueios com os Braços e Luvas", "91DxYGx4OAE"),
      lesson(15, "Aula 35 - Paradas de Mão", "ArczZZxaJew"),
      lesson(16, "Aula 36 - Trabalho Direcionado de Ataque e Defesa", "d7rUpWnc3mI"),
      lesson(17, "Aula 37 - Trabalho Direcionado no Saco", "3xkeh0DDoOs"),
      lesson(18, "Aula 38 - Trabalho Condicionado de Ataque e Defesa", "tJriPCGhDnY"),
      lesson(19, "Aula 39 - Trabalho Condicionado no Saco", "eRUT4VOU3Ps"),
      lesson(20, "Capítulo VI - Técnicas Defensivas (Bloqueios de Guarda)", "T1p6MRJ6Srs"),
      lesson(21, "Aula 40 - Golpes Preparatórios", "UHdHOhHEiEA"),
      lesson(22, "Aula 41 - Fintas", "SBE6kuqswLw"),
      lesson(23, "Aula 42 - Finta Basica", "zAVc9PdYVmA"),
      lesson(24, "Aula 43 - Trabalho Direcionado de Preparação e Ataque", "9Y1Wtx_lslk"),
      lesson(25, "Aula 44 - Trabalho Condicionado de Preparação e Ataque", "21eqC30HaTY"),
      lesson(26, "Capítulo VII - Ritmo e Tempo de Luta", "AMbD1uSjTZ8"),
      lesson(27, "Aula 45 - Quebras de Ritmo nas Sequências", "uBBzqkagBFk"),
      lesson(28, "Aula 46 - Posicionamento Estratégico no Ringue", "KOBwLxfeB04"),
      lesson(29, "Aula 47 - Posicionamento na Prática", "3elfrkVeXGQ"),
      lesson(30, "Aula 48 - Enquadramento (Cortar Passo, Cercar)", "90zeVCbDUcw"),
      lesson(31, "Aula 49 - Movimentação Evasiva", "hnmNziPrkeM"),
      lesson(32, "Aula 50 - Trabalho Condicionado Enquadramento", "02BZHcVq1Fs"),
      lesson(33, "Aula 51 - Trabalho Condicionado Evasivo", "shAZ-m_CMsk"),
      lesson(34, "Aula 52 - Trabalho Condicionado Posicionamento Estratégico", "9pMz2KSrBeg"),
      lesson(35, "Aula 53 - Movimentos Rápidos e Dinâmicos na Escada de Agilidade", "bcbkvNxMv4E"),
      lesson(36, "Capítulo VIII - Trabalho de Pés e Posicionamento Avançado", "Jw_YgGb-_Dc"),
    ],
    missingLessons: [
      {
        position: 9,
        title: "Aula 29 - Combinações Básicas",
        reason: "Vídeo não identificado na playlist informada.",
      },
    ],
  },
  {
    position: 3,
    title: normalizeTitleAfterDash("Modulo 3 - Módulo 3 Dominando o Boxe (Avançado)"),
    lessons: [
      lesson(1, "Aula 54 - Contragolpe através de Esquivas", "hOWO6ZuqVW8"),
      lesson(2, "Aula 55 - Trabalho Direcionado de Esquiva e Resposta", "m-y0HaC2bAQ"),
      lesson(3, "Aula 56 - Em Duplas - Colocando em Prática (Trabalho Dirigido)", "RZBgA2eeobA"),
      lesson(4, "Capítulo IX - Técnicas de Contragolpe (Esquiva e Resposta)", "npLj9bCS6TY"),
      lesson(5, "Aula 57 - Contragolpe Através de Bloqueios", "CdHvcF83ieA"),
      lesson(6, "Aula 58 - Exemplo Prático", "8WN7olqPre0"),
      lesson(7, "Aula 59 - Praticando Bloqueio e Resposta", "zliqNFsI4oo"),
      lesson(8, "Aula 60 - Trabalho Dirigido em Duplas", "EtXjb5Jl61U"),
      lesson(9, "Aula 61 - Trabalho Condicionado em Duplas", "YViQqXr6SS8"),
      lesson(10, "Capítulo X - Técnicas de Contragolpe (Bloqueio e Resposta)", "aZbdPHfm03E"),
      lesson(11, "Aula 62 - Encontro Através de Esquivas (Praticando)", "iZCquco99f8"),
      lesson(12, "Aula 63 - Trabalho em Duplas", "ygf7NRMKis4"),
      lesson(13, "Aula 64 - Escola Dirigida em Duplas", "Zyb6J3_fYEY"),
      lesson(14, "Aula 65 - Escola Condicionada em Duplas", "awNirwy6OtQ"),
      lesson(15, "Capítulo XI - Golpes de Encontro", "N5tgHTHbjp4"),
      lesson(16, "Aula 66 - Sombra Livre", "WgMCZPxZ_L8"),
      lesson(17, "Aula 67 - Saco de Pancadas Livre", "Vj_2w7_52xw"),
      lesson(18, "Aula 68 - Escola de Combate Condicionada I (Toque no Tronco)", "zrpbQhlsei4"),
      lesson(19, "Aula 69 - Escola de Combate Condicionada II (Golpes Retos Livre)", "RWscXc-eeH4"),
      lesson(20, "Aula 70 - Escola de Combate Condicionada III (Golpes Curvos Livre)", "MdtBCfRG-wk"),
      lesson(21, "Aula 71 - Escola de Combate Livre", "9cxlZc7Jai4"),
      lesson(22, "Capítulo XII - Trabalho Livre", "qWZd_9R9coE"),
      lesson(23, "Aula 72 - Trabalho na Escada de Agilidade + Sombra", "tQB3-f2NPZw"),
      lesson(24, "Aula 73 - Trabalho Intervalado no Saco de Pancadas", "D-ybS3Qfebw"),
      lesson(25, "Aula 74 - Trabalho de Resistência", "6YzqF-qh9so"),
      lesson(26, "Aula 75 - Aula Final - Curso Concluído", "fgKOjrkXOXM"),
      lesson(27, "Capítulo XIII - Condicionamento Físico de Alta Performance", "rIN_DDdgkow"),
    ],
  },
  {
    position: 4,
    title: normalizeTitleAfterDash("Modulo 4 - Módulo Bônus Iniciando no Boxe"),
    lessons: [
      lesson(1, "Aula 01 Trabalho Mental com a Psicóloga do Esporte Irene Cougo", "NexqSmvn0Jg"),
      lesson(2, "Aula 02 - Respiração com a Instrutora de Ioga Karol Khater", "mpwP7_SaV7I"),
      lesson(3, "Aula 03 - Suplementação para o Boxe com o Nutricionista Esportivo Ricardo Sotoriva", "B550lM7jif0"),
      lesson(4, "Aula 04 - Transtorno de Ansiedade Generalizada com o Médico Psiquiatra Dr. Glauco Pimenta", "GW4l_V5h0iM"),
      lesson(5, "Aula 05 - Especificidade da Preparação Física com Itallo Vilardo", "iyvUxwji7ZI"),
    ],
  },
];

function lesson(position: number, title: string, videoId: string): LessonSeed {
  return {
    position,
    title,
    youtubeUrl: `https://www.youtube.com/watch?v=${videoId}&list=${playlist}`,
  };
}

function normalizeTitleAfterDash(value: string): string {
  const marker = " - ";
  const markerIndex = value.indexOf(marker);

  if (markerIndex === -1) {
    return value.trim();
  }

  return value.slice(markerIndex + marker.length).trim();
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
    throw new Error(`Produtor ${PRODUCER_EMAIL} não encontrado ou inativo.`);
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
    console.warn("Aulas não cadastradas:");
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
