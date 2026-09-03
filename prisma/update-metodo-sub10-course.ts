import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  LessonMaterialStatus,
  LessonMaterialType,
  LessonStatus,
  PrismaClient,
  UserRole,
  UserStatus,
} from '@prisma/client';

const prisma = new PrismaClient();
const PRODUCER_EMAIL = 'douglaslundy@gmail.com';
const COURSE_TITLE = 'MÉTODO SUB 10';
const COURSE_SLUG = 'metodo-sub10';
const SOURCE_PATH = resolve(process.env.USERPROFILE ?? '', 'Desktop', 'cubo magico.txt');

type SourcePdf = { title: string; url: string };
type SourceLesson = { position: number; title: string; url: string; pdfMaterials: SourcePdf[] };
type SourceModule = { position: number; title: string; lessons: SourceLesson[] };
type MatchedLesson = { source: SourceLesson; currentId: string };

function loadLocalEnv() {
  const envPath = resolve(process.cwd(), '.env');

  if (!existsSync(envPath)) return;

  const lines = readFileSync(envPath, 'utf8').split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex <= 0) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^["']|["']$/g, '');

    process.env[key] ??= value;
  }
}

function cleanTitle(value: string) {
  return value.replace(/^\s*\d+\.\s*/, '').replace(/\s+/g, ' ').trim();
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractYouTubeVideoId(videoUrl: string): string | null {
  try {
    const url = new URL(videoUrl);
    const hostname = url.hostname.toLowerCase();

    if (hostname === 'youtu.be') {
      return normalizeVideoId(url.pathname.split('/').filter(Boolean)[0] ?? null);
    }

    if (hostname.includes('youtube.com')) {
      if (url.pathname === '/watch') {
        return normalizeVideoId(url.searchParams.get('v'));
      }

      if (url.pathname.startsWith('/embed/') || url.pathname.startsWith('/shorts/') || url.pathname.startsWith('/live/')) {
        return normalizeVideoId(url.pathname.split('/')[2] ?? null);
      }
    }

    return null;
  } catch {
    return null;
  }
}

function normalizeVideoId(value: string | null): string | null {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (!/^[A-Za-z0-9_-]{6,32}$/.test(trimmed)) return null;

  return trimmed;
}

function parseCourseText(text: string): SourceModule[] {
  const modules: SourceModule[] = [];
  const lines = text.split(/\r?\n/);

  let currentModule: SourceModule | null = null;
  let pendingLessonTitle: { position: number; title: string } | null = null;
  let pendingPdfMaterialTitle: string | null = null;
  let currentLesson: SourceLesson | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const moduleMatch = /^(\d+)\.\s+(.*)$/.exec(line);
    if (moduleMatch && !line.startsWith('-')) {
      currentModule = { position: Number(moduleMatch[1]), title: cleanTitle(moduleMatch[2]), lessons: [] };
      modules.push(currentModule);
      pendingLessonTitle = null;
      pendingPdfMaterialTitle = null;
      currentLesson = null;
      continue;
    }

    const numberedTitleMatch = /^-\s+(\d+)\.\s+(.*)$/.exec(line);
    if (numberedTitleMatch) {
      if (!currentModule) throw new Error(`Aula sem modulo antecedente: ${line}`);
      pendingLessonTitle = { position: Number(numberedTitleMatch[1]), title: cleanTitle(numberedTitleMatch[2]) };
      pendingPdfMaterialTitle = null;
      continue;
    }

    const pdfHeadingMatch = /^-\s+(.*\.pdf)(?:\s+\[pdf\])?$/.exec(line);
    if (pdfHeadingMatch) {
      pendingPdfMaterialTitle = cleanTitle(pdfHeadingMatch[1]);
      continue;
    }

    const urlMatch = /^(https?:\/\/\S+)$/.exec(line);
    if (urlMatch) {
      const url = urlMatch[1].trim();

      if (pendingLessonTitle) {
        if (!currentModule) throw new Error(`URL sem modulo antecedente: ${line}`);
        currentLesson = {
          position: pendingLessonTitle.position,
          title: pendingLessonTitle.title,
          url,
          pdfMaterials: [],
        };
        currentModule.lessons.push(currentLesson);
        pendingLessonTitle = null;
        pendingPdfMaterialTitle = null;
        continue;
      }

      if (pendingPdfMaterialTitle) {
        if (!currentLesson) throw new Error(`PDF sem aula antecedente: ${line}`);
        currentLesson.pdfMaterials.push({ title: pendingPdfMaterialTitle, url });
        pendingPdfMaterialTitle = null;
        continue;
      }

      continue;
    }
  }

  for (const module of modules) {
    for (const lesson of module.lessons) {
      const uniquePdfMaterials = new Map<string, SourcePdf>();
      for (const pdf of lesson.pdfMaterials) {
        const key = `${normalizeText(pdf.title)}|${pdf.url}`;
        if (!uniquePdfMaterials.has(key)) {
          uniquePdfMaterials.set(key, pdf);
        }
      }
      lesson.pdfMaterials = [...uniquePdfMaterials.values()];
    }
  }

  return modules;
}

async function main() {
  loadLocalEnv();

  if (!existsSync(SOURCE_PATH)) {
    throw new Error(`Arquivo de origem nao encontrado: ${SOURCE_PATH}`);
  }

  const sourceText = readFileSync(SOURCE_PATH, 'utf8');
  const parsedModules = parseCourseText(sourceText);

  const producer = await prisma.user.findFirst({
    where: {
      email: PRODUCER_EMAIL,
      role: UserRole.PRODUCER,
      status: UserStatus.ACTIVE,
    },
    select: { id: true, organizationId: true },
  });

  if (!producer) {
    throw new Error(`Produtor ${PRODUCER_EMAIL} nao encontrado ou inativo.`);
  }

  const course = await prisma.course.findFirst({
    where: {
      OR: [
        { slug: COURSE_SLUG },
        { title: { equals: COURSE_TITLE } },
        { title: { contains: 'metodo sub 10', mode: 'insensitive' } },
        { title: { contains: 'método sub 10', mode: 'insensitive' } },
      ],
      producerId: producer.id,
      organizationId: producer.organizationId,
    },
    select: { id: true, title: true, slug: true },
  });

  if (!course) {
    throw new Error(`Curso ${COURSE_TITLE} nao encontrado.`);
  }

  const courseModules = await prisma.module.findMany({
    where: { courseId: course.id },
    orderBy: { position: 'asc' },
    include: {
      lessons: {
        orderBy: { position: 'asc' },
        include: { materials: { orderBy: { position: 'asc' } } },
      },
    },
  });

  const currentModuleByPosition = new Map(courseModules.map((module) => [module.position, module]));
  const summary = {
    modulesProcessed: 0,
    lessonsUpdated: 0,
    lessonsCreated: 0,
    materialsUpdated: 0,
    warnings: [] as string[],
  };

  for (const sourceModule of parsedModules) {
    const currentModule = currentModuleByPosition.get(sourceModule.position);

    if (!currentModule) {
      summary.warnings.push(`Modulo inexistente no banco na posicao ${sourceModule.position}: ${sourceModule.title}`);
      continue;
    }

    summary.modulesProcessed += 1;

    await prisma.$transaction(async (tx) => {
      const currentLessons = [...currentModule.lessons].sort((a, b) => a.position - b.position);
      const matchedLessons: MatchedLesson[] = [];
      const missingSourceLessons: SourceLesson[] = [];
      const usedLessonIds = new Set<string>();

      for (let index = 0; index < sourceModule.lessons.length; index += 1) {
        const sourceLesson = sourceModule.lessons[index];
        const normalizedSourceTitle = normalizeText(sourceLesson.title);

        let currentLesson = currentLessons.find(
          (lesson) => !usedLessonIds.has(lesson.id) && normalizeText(lesson.title) === normalizedSourceTitle,
        );

        if (!currentLesson) {
          currentLesson = currentLessons.find((lesson) => !usedLessonIds.has(lesson.id) && lesson.position === sourceLesson.position);
        }

        if (!currentLesson) {
          currentLesson = currentLessons.find((lesson) => !usedLessonIds.has(lesson.id));
        }

        if (!currentLesson) {
          missingSourceLessons.push(sourceLesson);
          continue;
        }

        usedLessonIds.add(currentLesson.id);
        matchedLessons.push({ source: sourceLesson, currentId: currentLesson.id });
      }

      for (const [index, lessonMatch] of matchedLessons.entries()) {
        await tx.lesson.update({
          where: { id: lessonMatch.currentId },
          data: {
            position: 1000 + sourceModule.position * 100 + index,
          },
        });
      }

      for (const lessonMatch of matchedLessons) {
        const youtubeVideoId = extractYouTubeVideoId(lessonMatch.source.url);

        await tx.lesson.update({
          where: { id: lessonMatch.currentId },
          data: {
            title: lessonMatch.source.title,
            youtubeUrl: lessonMatch.source.url,
            youtubeVideoId,
            position: lessonMatch.source.position,
          },
        });

        await tx.lessonMaterial.deleteMany({
          where: { lessonId: lessonMatch.currentId },
        });

        for (const [materialIndex, pdfMaterial] of lessonMatch.source.pdfMaterials.entries()) {
          await tx.lessonMaterial.create({
            data: {
              lessonId: lessonMatch.currentId,
              type: LessonMaterialType.PDF,
              title: pdfMaterial.title,
              url: pdfMaterial.url,
              position: materialIndex + 1,
              status: LessonMaterialStatus.ACTIVE,
            },
          });
          summary.materialsUpdated += 1;
        }

        summary.lessonsUpdated += 1;
      }

      for (const sourceLesson of missingSourceLessons) {
        if (sourceLesson.url.includes('/drive/folders/')) {
          summary.warnings.push(
            `Aula nao criada por usar pasta do Drive sem link de arquivo reproduzivel no modulo ${sourceModule.position}: ${sourceLesson.title}`,
          );
          continue;
        }

        const createdLesson = await tx.lesson.create({
          data: {
            moduleId: currentModule.id,
            title: sourceLesson.title,
            youtubeUrl: sourceLesson.url,
            youtubeVideoId: extractYouTubeVideoId(sourceLesson.url),
            position: sourceLesson.position,
            status: LessonStatus.ACTIVE,
          },
          select: { id: true },
        });

        summary.lessonsCreated += 1;

        for (const [materialIndex, pdfMaterial] of sourceLesson.pdfMaterials.entries()) {
          await tx.lessonMaterial.create({
            data: {
              lessonId: createdLesson.id,
              type: LessonMaterialType.PDF,
              title: pdfMaterial.title,
              url: pdfMaterial.url,
              position: materialIndex + 1,
              status: LessonMaterialStatus.ACTIVE,
            },
          });
          summary.materialsUpdated += 1;
        }
      }
    }, { timeout: 120000, maxWait: 120000 });
  }

  console.log(`Curso atualizado: ${course.title} (${course.slug})`);
  console.log(`Modulos processados: ${summary.modulesProcessed}`);
  console.log(`Aulas atualizadas: ${summary.lessonsUpdated}`);
  console.log(`Aulas criadas: ${summary.lessonsCreated}`);
  console.log(`Materiais PDF atualizados: ${summary.materialsUpdated}`);

  if (summary.warnings.length > 0) {
    console.warn('Avisos:');
    for (const warning of summary.warnings) {
      console.warn(`- ${warning}`);
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

