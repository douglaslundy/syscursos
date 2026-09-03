import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  CourseStatus,
  LessonMaterialStatus,
  LessonMaterialType,
  LessonStatus,
  ModuleStatus,
  PrismaClient,
  UserRole,
  UserStatus,
} from "@prisma/client";

const prisma = new PrismaClient();

const PRODUCER_EMAIL = "douglaslundy@gmail.com";
const COURSE_TITLE = "Curso de Chaveiro Profissional";
const COURSE_SLUG = "curso-de-chaveiro-profissional";
const SOURCE_PATH = resolve(process.env.USERPROFILE ?? "", "Desktop", "Curso de Chaveiro Profissional.txt");

type LessonMaterialSeed = {
  position: number;
  title: string;
  url: string;
  type: "PDF";
};

type LessonSeed = {
  position: number;
  title: string;
  youtubeUrl: string;
  youtubeVideoId: string | null;
  materials: LessonMaterialSeed[];
};

type ModuleSeed = {
  position: number;
  title: string;
  lessons: LessonSeed[];
};

type MissingLessonSeed = {
  moduleTitle: string;
  position: number;
  title: string;
  reason: string;
};

type ParsedCourse = {
  modules: ModuleSeed[];
  missingLessons: MissingLessonSeed[];
};

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

function cleanTitle(value: string) {
  return value
    .replace(/^\s*\d+\.\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractYouTubeVideoId(videoUrl: string): string | null {
  try {
    const url = new URL(videoUrl);
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

function parseCourseText(text: string): ParsedCourse {
  const modules: ModuleSeed[] = [];
  const missingLessons: MissingLessonSeed[] = [];
  const lines = text.split(/\r?\n/);

  let currentModule: ModuleSeed | null = null;
  let currentLesson: LessonSeed | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (!line.trim()) {
      continue;
    }

    const moduleMatch = /^(\d+)\.\s+(.*)$/.exec(line);
    if (moduleMatch && !line.startsWith("[")) {
      const position = Number(moduleMatch[1]);
      const title = cleanTitle(moduleMatch[2]);
      currentModule = { position, title, lessons: [] };
      modules.push(currentModule);
      currentLesson = null;
      continue;
    }

    const videoLessonMatch = /^\s+(\d+)\.\s+(.*?)\s+-\s+(https?:\/\/\S+)$/.exec(line);
    if (videoLessonMatch) {
      if (!currentModule) {
        throw new Error(`Aula encontrada sem modulo antecedente: ${line}`);
      }

      const position = Number(videoLessonMatch[1]);
      const title = cleanTitle(videoLessonMatch[2]);
      const url = videoLessonMatch[3].trim();
      const lesson: LessonSeed = {
        position,
        title,
        youtubeUrl: url,
        youtubeVideoId: extractYouTubeVideoId(url),
        materials: [],
      };
      currentModule.lessons.push(lesson);
      currentLesson = lesson;
      continue;
    }

    const pdfLessonMatch = /^\s+(\d+)\.\s+(.*?)\s+-\s+\[pdf\]\s+(https?:\/\/\S+)$/.exec(line);
    if (pdfLessonMatch) {
      if (!currentModule) {
        throw new Error(`Aula PDF encontrada sem modulo antecedente: ${line}`);
      }

      const position = Number(pdfLessonMatch[1]);
      const title = cleanTitle(pdfLessonMatch[2]);
      const url = pdfLessonMatch[3].trim();
      const lesson: LessonSeed = {
        position,
        title,
        youtubeUrl: url,
        youtubeVideoId: null,
        materials: [],
      };
      currentModule.lessons.push(lesson);
      currentLesson = lesson;
      continue;
    }

    const pdfMaterialMatch = /^\s+\[pdf\]\s+(https?:\/\/\S+)$/.exec(line);
    if (pdfMaterialMatch) {
      if (!currentLesson) {
        throw new Error(`Material PDF encontrado sem aula antecedente: ${line}`);
      }

      const url = pdfMaterialMatch[1].trim();
      const fileTitle = url.split("/").filter(Boolean).at(-2) ?? "PDF";
      currentLesson.materials.push({
        position: currentLesson.materials.length + 1,
        title: cleanTitle(fileTitle),
        url,
        type: "PDF",
      });
      continue;
    }

    const missingLessonMatch = /^\s+(\d+)\.\s+(.*?)\s+-\s+\[exceção\]\s+(.*)$/.exec(line);
    if (missingLessonMatch) {
      if (!currentModule) {
        throw new Error(`Excecao de aula encontrada sem modulo antecedente: ${line}`);
      }

      missingLessons.push({
        moduleTitle: currentModule.title,
        position: Number(missingLessonMatch[1]),
        title: cleanTitle(missingLessonMatch[2]),
        reason: missingLessonMatch[3].trim(),
      });
      currentLesson = null;
      continue;
    }
  }

  return { modules, missingLessons };
}

async function main() {
  loadLocalEnv();

  if (!existsSync(SOURCE_PATH)) {
    throw new Error(`Arquivo de origem nao encontrado: ${SOURCE_PATH}`);
  }

  const sourceText = readFileSync(SOURCE_PATH, "utf8");
  const parsed = parseCourseText(sourceText);

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

  for (const moduleSeed of parsed.modules) {
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
      const createdLesson = await prisma.lesson.create({
        data: {
          moduleId: createdModule.id,
          title: lessonSeed.title,
          position: lessonSeed.position,
          status: LessonStatus.ACTIVE,
          description: null,
          youtubeUrl: lessonSeed.youtubeUrl,
          youtubeVideoId: lessonSeed.youtubeVideoId,
        },
        select: { id: true },
      });

      for (const materialSeed of lessonSeed.materials) {
        await prisma.lessonMaterial.create({
          data: {
            lessonId: createdLesson.id,
            type: LessonMaterialType.PDF,
            title: materialSeed.title,
            url: materialSeed.url,
            position: materialSeed.position,
            status: LessonMaterialStatus.ACTIVE,
          },
        });
      }
    }
  }

  console.log(`Curso ${COURSE_TITLE} cadastrado/atualizado com sucesso.`);
  console.log(`Modulos cadastrados: ${parsed.modules.length}.`);
  console.log(`Aulas cadastradas: ${parsed.modules.reduce((total, moduleSeed) => total + moduleSeed.lessons.length, 0)}.`);

  if (parsed.missingLessons.length > 0) {
    console.warn("Aulas nao cadastradas por ausencia de video ou PDF direto:");
    for (const missingLesson of parsed.missingLessons) {
      console.warn(
        `- ${missingLesson.moduleTitle} | posicao ${missingLesson.position} | ${missingLesson.title}: ${missingLesson.reason}`,
      );
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



