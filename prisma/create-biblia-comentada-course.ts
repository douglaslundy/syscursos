import { readFile } from "node:fs/promises";

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
const SOURCE_COURSE_TITLE = "A Bíblia Comentada";
const COURSE_TITLE = "Bíblia Comentada";
const COURSE_SLUG = "biblia-comentada";
const EXPECTED_MODULE_COUNT = 67;
const EXPECTED_LESSON_COUNT = 758;
const UNAVAILABLE_VIDEO_URL = "https://www.youtube.com/watch?v=unavailable";

type LessonSeed = {
  position: number;
  title: string;
  description: string | null;
  youtubeUrl: string;
  youtubeVideoId: string | null;
};

type ModuleSeed = {
  position: number;
  title: string;
  lessons: LessonSeed[];
};

type PendingLesson = {
  title: string;
  sourceLine: string | null;
};

function normalizeLabel(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

function valueAfterColon(value: string): string {
  return value.split(":").slice(1).join(":").trim();
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

      if (
        url.pathname.startsWith("/embed/") ||
        url.pathname.startsWith("/shorts/") ||
        url.pathname.startsWith("/live/")
      ) {
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
  return /^[A-Za-z0-9_-]{6,32}$/.test(trimmed) ? trimmed : null;
}

function isSupportedVideoUrl(value: string): boolean {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();

    if (url.protocol !== 'https:') {
      return false;
    }

    if (hostname === 'youtu.be') {
      return Boolean(url.pathname.split('/').filter(Boolean)[0]);
    }

    if (hostname === 'youtube.com' || hostname === 'www.youtube.com') {
      return (
        (url.pathname === '/watch' && Boolean(url.searchParams.get('v'))) ||
        url.pathname.startsWith('/embed/') ||
        url.pathname.startsWith('/shorts/') ||
        url.pathname.startsWith('/live/')
      );
    }

    if (hostname === 'drive.google.com') {
      return url.pathname.startsWith('/file/d/');
    }

    if (hostname === '1drv.ms') {
      return url.pathname.startsWith('/v/');
    }

    return hostname === 'onedrive.live.com' || hostname === 'www.onedrive.live.com';
  } catch {
    return false;
  }
}

function createLessonSeed(lesson: PendingLesson, position: number): LessonSeed {
  if (!lesson.sourceLine) {
    throw new Error(`A aula "${lesson.title}" não possui linha de origem.`);
  }

  if (/^https?:\/\//i.test(lesson.sourceLine) && isSupportedVideoUrl(lesson.sourceLine)) {
    return {
      position,
      title: lesson.title,
      description: null,
      youtubeUrl: lesson.sourceLine,
      youtubeVideoId: extractYouTubeVideoId(lesson.sourceLine),
    };
  }

  if (/^https?:\/\//i.test(lesson.sourceLine)) {
    return {
      position,
      title: lesson.title,
      description: `Link de origem n\u00e3o compat\u00edvel com o player: ${lesson.sourceLine}`,
      youtubeUrl: UNAVAILABLE_VIDEO_URL,
      youtubeVideoId: null,
    };
  }

  if (normalizeLabel(lesson.sourceLine).startsWith("SEM LINK DO YOUTUBE")) {
    return {
      position,
      title: lesson.title,
      description: lesson.sourceLine,
      youtubeUrl: UNAVAILABLE_VIDEO_URL,
      youtubeVideoId: null,
    };
  }

  throw new Error(`Origem não reconhecida para a aula "${lesson.title}": ${lesson.sourceLine}`);
}

function parseSource(source: string): ModuleSeed[] {
  const lines = source
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const modules: ModuleSeed[] = [];
  let insideTargetCourse = false;
  let currentModule: ModuleSeed | null = null;
  let pendingLesson: PendingLesson | null = null;

  for (const line of lines) {
    const normalizedLine = normalizeLabel(line);

    if (normalizedLine.startsWith("CURSO:")) {
      const courseTitle = valueAfterColon(line);

      if (insideTargetCourse) {
        break;
      }

      insideTargetCourse = normalizeLabel(courseTitle) === normalizeLabel(SOURCE_COURSE_TITLE);
      continue;
    }

    if (!insideTargetCourse) {
      continue;
    }

    if (normalizedLine.startsWith("MODULO:")) {
      if (pendingLesson) {
        throw new Error(`A aula "${pendingLesson.title}" não possui origem antes do próximo módulo.`);
      }

      currentModule = {
        position: modules.length + 1,
        title: valueAfterColon(line),
        lessons: [],
      };
      modules.push(currentModule);
      continue;
    }

    if (normalizedLine.startsWith("AULA:")) {
      if (!currentModule) {
        throw new Error(`Aula encontrada antes de um módulo: ${line}`);
      }

      if (pendingLesson) {
        throw new Error(`A aula "${pendingLesson.title}" não possui origem antes da aula seguinte.`);
      }

      pendingLesson = {
        title: valueAfterColon(line),
        sourceLine: null,
      };
      continue;
    }

    if (pendingLesson && (/^https?:\/\//i.test(line) || normalizedLine.startsWith("SEM LINK DO YOUTUBE"))) {
      pendingLesson.sourceLine = line;
      currentModule?.lessons.push(createLessonSeed(pendingLesson, currentModule.lessons.length + 1));
      pendingLesson = null;
      continue;
    }

    if (normalizedLine === "SEM AULAS CADASTRADAS") {
      continue;
    }

    throw new Error(`Linha não reconhecida no curso de origem: ${line}`);
  }

  if (pendingLesson) {
    throw new Error(`A aula "${pendingLesson.title}" não possui origem ao fim do curso.`);
  }

  const lessonCount = modules.reduce((total, moduleSeed) => total + moduleSeed.lessons.length, 0);

  if (modules.length !== EXPECTED_MODULE_COUNT || lessonCount !== EXPECTED_LESSON_COUNT) {
    throw new Error(
      `Estrutura inesperada no arquivo: ${modules.length} módulos e ${lessonCount} aulas. ` +
        `Esperado: ${EXPECTED_MODULE_COUNT} módulos e ${EXPECTED_LESSON_COUNT} aulas.`,
    );
  }

  return modules;
}

async function main() {
  const sourcePath = process.argv.find((argument) => !argument.startsWith("--") && argument !== process.argv[0] && argument !== process.argv[1]);
  const applyChanges = process.argv.includes("--apply");

  if (!sourcePath) {
    throw new Error("Informe o caminho do arquivo de origem.");
  }

  const modules = parseSource(await readFile(sourcePath, { encoding: "utf8" }));
  const lessonCount = modules.reduce((total, moduleSeed) => total + moduleSeed.lessons.length, 0);
  const unavailableLessonCount = modules.reduce(
    (total, moduleSeed) =>
      total + moduleSeed.lessons.filter((lesson) => lesson.youtubeUrl === UNAVAILABLE_VIDEO_URL).length,
    0,
  );

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

  const existingCourse = await prisma.course.findUnique({
    where: { slug: COURSE_SLUG },
    select: {
      id: true,
      title: true,
      producer: { select: { email: true } },
      _count: { select: { modules: true } },
    },
  });

  console.log(
    JSON.stringify(
      {
        mode: applyChanges ? "apply" : "dry-run",
        course: COURSE_TITLE,
        slug: COURSE_SLUG,
        producer: PRODUCER_EMAIL,
        modules: modules.length,
        lessons: lessonCount,
        lessonsUsingPlaceholder: unavailableLessonCount,
        existingCourse,
      },
      null,
      2,
    ),
  );

  if (!applyChanges) {
    return;
  }

  await prisma.$transaction(
    async (transaction) => {
      const course = await transaction.course.upsert({
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

      await transaction.module.deleteMany({ where: { courseId: course.id } });

      for (const moduleSeed of modules) {
        await transaction.module.create({
          data: {
            courseId: course.id,
            title: moduleSeed.title,
            position: moduleSeed.position,
            status: ModuleStatus.ACTIVE,
            description: null,
            lessons: {
              create: moduleSeed.lessons.map((lesson) => ({
                title: lesson.title,
                position: lesson.position,
                status: LessonStatus.ACTIVE,
                description: lesson.description,
                youtubeUrl: lesson.youtubeUrl,
                youtubeVideoId: lesson.youtubeVideoId,
              })),
            },
          },
        });
      }
    },
    {
      maxWait: 20_000,
      timeout: 180_000,
    },
  );

  const createdCourse = await prisma.course.findUniqueOrThrow({
    where: { slug: COURSE_SLUG },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      producer: { select: { email: true } },
      modules: {
        orderBy: { position: "asc" },
        select: {
          title: true,
          position: true,
          _count: { select: { lessons: true } },
        },
      },
    },
  });

  const createdLessonCount = createdCourse.modules.reduce(
    (total, moduleRecord) => total + moduleRecord._count.lessons,
    0,
  );

  if (
    createdCourse.producer.email !== PRODUCER_EMAIL ||
    createdCourse.modules.length !== EXPECTED_MODULE_COUNT ||
    createdLessonCount !== EXPECTED_LESSON_COUNT
  ) {
    throw new Error("A validação após a gravação encontrou divergências no curso criado.");
  }

  console.log(
    JSON.stringify(
      {
        result: "success",
        id: createdCourse.id,
        title: createdCourse.title,
        slug: createdCourse.slug,
        status: createdCourse.status,
        producer: createdCourse.producer.email,
        modules: createdCourse.modules.length,
        lessons: createdLessonCount,
        firstModule: createdCourse.modules[0],
        lastModule: createdCourse.modules.at(-1),
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
