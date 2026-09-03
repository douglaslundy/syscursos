import { PrismaClient, CourseStatus, ModuleStatus, LessonStatus, UserRole, UserStatus } from "@prisma/client";

const prisma = new PrismaClient();

const PRODUCER_EMAIL = "douglaslundy@gmail.com";
const COURSE_TITLE = "Filosofia Profunda - parte III: livros";
const COURSE_SLUG = "filosofia-profunda-parte-iii-livros";

type LessonSeed = {
  position: number;
  title: string;
  youtubeUrl: string;
};

type ModuleSeed = {
  position: number;
  title: string;
  lessons: LessonSeed[];
};

const modules: ModuleSeed[] = [
  {
    position: 1,
    title: "1. Filosofia profunda - parte III: livros",
    lessons: [
      { position: 1, title: "Apresentação do módulo", youtubeUrl: "https://www.youtube.com/watch?v=QEm1VVKpXJI" },
      { position: 2, title: "Técnicas de leitura", youtubeUrl: "https://www.youtube.com/watch?v=fDcHAwCNWjU" },
      { position: 3, title: "Didascalicon: sobre a arte de ler - Hugo de São Vítor", youtubeUrl: "https://www.youtube.com/watch?v=XZC3kucvWn4" },
      { position: 4, title: "Apologia de Sócrates, Platão", youtubeUrl: "https://www.youtube.com/watch?v=0QG0rcSQYr8" },
      { position: 5, title: "O mito da caverna, Platão", youtubeUrl: "https://www.youtube.com/watch?v=OAr_w9JxQh4" },
      { position: 6, title: "Carta sobre a felicidade, Epicuro", youtubeUrl: "https://www.youtube.com/watch?v=SEdWqodcizY" },
      { position: 7, title: "Carta a Diogneto, autoria desconhecida", youtubeUrl: "https://www.youtube.com/watch?v=XMZDj4stwMc" },
      { position: 8, title: "Proslógio, Anselmo de Aosta", youtubeUrl: "https://www.youtube.com/watch?v=X-f4ANGnMbk" },
      { position: 9, title: "O Príncipe, Maquiavel", youtubeUrl: "https://www.youtube.com/watch?v=fi3UO-wNWLY" },
      { position: 10, title: "A Cidade do Sol, Campanella", youtubeUrl: "https://www.youtube.com/watch?v=GkFmIvHaKQc" },
      { position: 11, title: "Princípios da Natureza e da Graça, Leibniz", youtubeUrl: "https://www.youtube.com/watch?v=TWsnptax6E0" },
      { position: 12, title: "A origem da desigualdade entre os homens, Rousseau", youtubeUrl: "https://www.youtube.com/watch?v=VDJEz7c7miY" },
      { position: 13, title: "A ideia de uma história universal em perspectiva cosmopolita, Kant", youtubeUrl: "https://www.youtube.com/watch?v=CWYO4X6rCQs" },
      { position: 14, title: "Resposta à pergunta: 'O que é o Esclarecimento?', Kant", youtubeUrl: "https://www.youtube.com/watch?v=IBU3IA5xLic" },
      { position: 15, title: "Sobre o ensino da filosofia, Hegel", youtubeUrl: "https://www.youtube.com/watch?v=M__j1TVAFJg" },
      { position: 16, title: "Para a crítica da filosofia do direito de Hegel, Karl Marx", youtubeUrl: "https://www.youtube.com/watch?v=k4t21pKMszY" },
      { position: 17, title: "O anticristo, Nietzsche", youtubeUrl: "https://www.youtube.com/watch?v=QQXaBMlNoDM" },
      { position: 18, title: "A filosofia entre a religião e a ciência, Bertrand Russell", youtubeUrl: "https://www.youtube.com/watch?v=8UCvzk-M8as" },
      { position: 19, title: "Diferença essencial entre o homem e o animal, Max Scheler", youtubeUrl: "https://www.youtube.com/watch?v=maAE811nwus" },
      { position: 20, title: "Nós, os refugiados, Hannah Arendt", youtubeUrl: "https://www.youtube.com/watch?v=C81zBBVtgOI" },
    ],
  },
];

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

  console.log("Curso Filosofia Profunda - parte III: livros cadastrado/atualizado com sucesso.");
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
