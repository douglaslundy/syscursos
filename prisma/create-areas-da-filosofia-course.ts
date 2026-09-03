import { PrismaClient, CourseStatus, ModuleStatus, LessonStatus, UserRole, UserStatus } from "@prisma/client";

const prisma = new PrismaClient();

const PRODUCER_EMAIL = "douglaslundy@gmail.com";
const COURSE_TITLE = "Áreas da filosofia";
const COURSE_SLUG = "areas-da-filosofia";

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
    title: "Áreas da filosofia",
    lessons: [
      { position: 1, title: "Metafísica", youtubeUrl: "https://www.youtube.com/watch?v=pFZ3-iOY5oI" },
      { position: 2, title: "Lógica", youtubeUrl: "https://www.youtube.com/watch?v=oha9Tq-J-oE" },
      { position: 3, title: "Epistemologia", youtubeUrl: "https://www.youtube.com/watch?v=zA4ZcsoB56Y" },
      { position: 4, title: "Estética", youtubeUrl: "https://www.youtube.com/watch?v=BgwgHqtm4Eo" },
      { position: 5, title: "Antropologia Filosófica", youtubeUrl: "https://www.youtube.com/watch?v=B6a0_3X_srw" },
      { position: 6, title: "Filosofia da Mente", youtubeUrl: "https://www.youtube.com/watch?v=knuOvQSencA" },
      { position: 7, title: "Ética", youtubeUrl: "https://www.youtube.com/watch?v=R5QGiv4ET7Y" },
      { position: 8, title: "Filosofia da Ação", youtubeUrl: "https://www.youtube.com/watch?v=ueT9u_yMsZw" },
      { position: 9, title: "Política", youtubeUrl: "https://www.youtube.com/watch?v=FI1RbXSz_wQ" },
      { position: 10, title: "Filosofia da História", youtubeUrl: "https://www.youtube.com/watch?v=A-6lylIUif0" },
      { position: 11, title: "Filosofia da Religião", youtubeUrl: "https://www.youtube.com/watch?v=1OoW_Q1kVh0" },
      { position: 12, title: "Filosofia da Linguagem", youtubeUrl: "https://www.youtube.com/watch?v=99Iew-fMkUw" },
      { position: 13, title: "Filosofia Clínica", youtubeUrl: "https://www.youtube.com/watch?v=CW38qLgaNhQ" },
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

  console.log("Curso Áreas da filosofia cadastrado/atualizado com sucesso.");
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
