import { readFile } from 'node:fs/promises';

import {
  CourseStatus,
  LessonStatus,
  ModuleStatus,
  PrismaClient,
  UserRole,
  UserStatus,
} from '@prisma/client';

const prisma = new PrismaClient();
const PRODUCER_EMAIL = 'douglaslundy@gmail.com';
const PRIMARY_COURSE = 'A BIBLIA COMENTADA';
const PLACEHOLDER_URL = 'https://www.youtube.com/watch?v=unavailable';
const EXPECTED_COURSES = 15;
const EXPECTED_MODULES = 60;
const EXPECTED_LESSONS = 802;

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

type CourseSeed = {
  title: string;
  slug: string;
  modules: ModuleSeed[];
};

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
}

function afterColon(value: string): string {
  return value.split(':').slice(1).join(':').trim();
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function videoId(value: string): string | null {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    let candidate: string | null = null;

    if (host === 'youtu.be') {
      candidate = url.pathname.split('/').filter(Boolean)[0] ?? null;
    } else if (host === 'youtube.com' || host === 'www.youtube.com') {
      candidate =
        url.pathname === '/watch'
          ? url.searchParams.get('v')
          : url.pathname.split('/').filter(Boolean)[1] ?? null;
    }

    return candidate && /^[A-Za-z0-9_-]{6,32}$/.test(candidate) ? candidate : null;
  } catch {
    return null;
  }
}

function supportedVideoUrl(value: string): boolean {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    const path = url.pathname;

    if (url.protocol !== 'https:') return false;
    if (host === 'youtu.be') return Boolean(path.split('/').filter(Boolean)[0]);
    if (host === 'youtube.com' || host === 'www.youtube.com') {
      return (
        (path === '/watch' && Boolean(url.searchParams.get('v'))) ||
        path.startsWith('/embed/') ||
        path.startsWith('/shorts/') ||
        path.startsWith('/live/')
      );
    }
    if (host === 'drive.google.com') return path.startsWith('/file/d/');
    if (host === '1drv.ms') return path.startsWith('/v/');
    return host === 'onedrive.live.com' || host === 'www.onedrive.live.com';
  } catch {
    return false;
  }
}

function lessonSeed(title: string, source: string, position: number): LessonSeed {
  if (/^https?:\/\//i.test(source) && supportedVideoUrl(source)) {
    return {
      position,
      title,
      description: null,
      youtubeUrl: source,
      youtubeVideoId: videoId(source),
    };
  }

  return {
    position,
    title,
    description: /^https?:\/\//i.test(source)
      ? `Link de origem n\u00e3o compat\u00edvel com o player: ${source}`
      : source,
    youtubeUrl: PLACEHOLDER_URL,
    youtubeVideoId: null,
  };
}

function parseCourses(source: string): CourseSeed[] {
  const lines = source
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const courses: CourseSeed[] = [];
  let course: CourseSeed | null = null;
  let moduleSeed: ModuleSeed | null = null;
  let pendingTitle: string | null = null;

  for (const line of lines) {
    const label = normalize(line);

    if (label.startsWith('CURSO:')) {
      if (pendingTitle) throw new Error(`Aula sem origem: ${pendingTitle}`);
      const title = afterColon(line);
      course = { title, slug: slugify(title), modules: [] };
      courses.push(course);
      moduleSeed = null;
      continue;
    }

    if (label.startsWith('MODULO:')) {
      if (!course) throw new Error(`M\u00f3dulo sem curso: ${line}`);
      if (pendingTitle) throw new Error(`Aula sem origem: ${pendingTitle}`);
      moduleSeed = {
        position: course.modules.length + 1,
        title: afterColon(line),
        lessons: [],
      };
      course.modules.push(moduleSeed);
      continue;
    }

    if (label.startsWith('AULA:')) {
      if (!moduleSeed) throw new Error(`Aula sem m\u00f3dulo: ${line}`);
      if (pendingTitle) throw new Error(`Aula sem origem: ${pendingTitle}`);
      pendingTitle = afterColon(line);
      continue;
    }

    if (
      pendingTitle &&
      (/^https?:\/\//i.test(line) || label.startsWith('SEM LINK DO YOUTUBE'))
    ) {
      moduleSeed?.lessons.push(
        lessonSeed(pendingTitle, line, moduleSeed.lessons.length + 1),
      );
      pendingTitle = null;
      continue;
    }

    if (label === 'SEM AULAS CADASTRADAS') continue;
    throw new Error(`Linha n\u00e3o reconhecida: ${line}`);
  }

  if (pendingTitle) throw new Error(`Aula sem origem: ${pendingTitle}`);

  const additional = courses.filter((item) => normalize(item.title) !== PRIMARY_COURSE);
  const moduleCount = additional.flatMap((item) => item.modules).length;
  const lessonCount = additional.flatMap((item) => item.modules).flatMap((item) => item.lessons).length;

  if (
    additional.length !== EXPECTED_COURSES ||
    moduleCount !== EXPECTED_MODULES ||
    lessonCount !== EXPECTED_LESSONS ||
    new Set(additional.map((item) => item.slug)).size !== additional.length
  ) {
    throw new Error(
      `Estrutura inesperada: ${additional.length} cursos, ${moduleCount} m\u00f3dulos, ${lessonCount} aulas.`,
    );
  }

  return additional;
}

function summary(course: CourseSeed) {
  const lessons = course.modules.flatMap((item) => item.lessons);
  return {
    title: course.title,
    slug: course.slug,
    modules: course.modules.length,
    lessons: lessons.length,
    placeholders: lessons.filter((item) => item.youtubeUrl === PLACEHOLDER_URL).length,
  };
}

async function main() {
  const sourcePath = process.argv.find(
    (argument) =>
      !argument.startsWith('--') &&
      argument !== process.argv[0] &&
      argument !== process.argv[1],
  );
  const apply = process.argv.includes('--apply');
  if (!sourcePath) throw new Error('Informe o arquivo de origem.');

  const courses = parseCourses(await readFile(sourcePath, { encoding: 'utf8' }));
  const slugs = courses.map((item) => item.slug);
  const producer = await prisma.user.findFirst({
    where: { email: PRODUCER_EMAIL, role: UserRole.PRODUCER, status: UserStatus.ACTIVE },
    select: { id: true, organizationId: true },
  });
  if (!producer) throw new Error(`Produtor n\u00e3o encontrado: ${PRODUCER_EMAIL}`);

  const existing = await prisma.course.findMany({
    where: { slug: { in: slugs } },
    select: {
      id: true,
      title: true,
      slug: true,
      producer: { select: { email: true } },
      _count: { select: { modules: true } },
    },
  });
  const collisions = existing.filter((record) => {
    const seed = courses.find((item) => item.slug === record.slug);
    return !seed || seed.title !== record.title || record.producer.email !== PRODUCER_EMAIL;
  });

  console.log(
    JSON.stringify(
      { mode: apply ? 'apply' : 'dry-run', courses: courses.map(summary), existing, collisions },
      null,
      2,
    ),
  );
  if (collisions.length) throw new Error('Colis\u00f5es inseguras de slug encontradas.');
  if (!apply) return;

  await prisma.$transaction(
    async (transaction) => {
      for (const seed of courses) {
        const courseRecord = await transaction.course.upsert({
          where: { slug: seed.slug },
          update: {
            title: seed.title,
            status: CourseStatus.ACTIVE,
            description: null,
            organizationId: producer.organizationId,
            producerId: producer.id,
          },
          create: {
            title: seed.title,
            slug: seed.slug,
            status: CourseStatus.ACTIVE,
            description: null,
            organizationId: producer.organizationId,
            producerId: producer.id,
          },
          select: { id: true },
        });

        await transaction.module.deleteMany({ where: { courseId: courseRecord.id } });
        for (const moduleItem of seed.modules) {
          await transaction.module.create({
            data: {
              courseId: courseRecord.id,
              title: moduleItem.title,
              position: moduleItem.position,
              status: ModuleStatus.ACTIVE,
              description: null,
              lessons: {
                create: moduleItem.lessons.map((lesson) => ({
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
      }
    },
    { maxWait: 20_000, timeout: 300_000 },
  );

  const records = await prisma.course.findMany({
    where: { slug: { in: slugs } },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      producer: { select: { email: true } },
      modules: {
        orderBy: { position: 'asc' },
        select: {
          title: true,
          position: true,
          lessons: {
            orderBy: { position: 'asc' },
            select: { title: true, position: true, youtubeUrl: true, description: true },
          },
        },
      },
    },
  });

  const validation = courses.map((seed) => {
    const record = records.find((item) => item.slug === seed.slug);
    const sequenceValid = seed.modules.every((moduleItem, moduleIndex) => {
      const storedModule = record?.modules[moduleIndex];
      return (
        storedModule?.title === moduleItem.title &&
        storedModule.position === moduleItem.position &&
        moduleItem.lessons.every((lesson, lessonIndex) => {
          const storedLesson = storedModule.lessons[lessonIndex];
          return (
            storedLesson?.title === lesson.title &&
            storedLesson.position === lesson.position &&
            storedLesson.youtubeUrl === lesson.youtubeUrl &&
            storedLesson.description === lesson.description
          );
        })
      );
    });
    const lessons = record?.modules.flatMap((item) => item.lessons) ?? [];
    return {
      title: seed.title,
      id: record?.id,
      modules: record?.modules.length ?? 0,
      lessons: lessons.length,
      valid:
        record?.producer.email === PRODUCER_EMAIL &&
        record.status === CourseStatus.ACTIVE &&
        record.modules.length === seed.modules.length &&
        lessons.length === seed.modules.flatMap((item) => item.lessons).length &&
        sequenceValid,
    };
  });
  if (validation.some((item) => !item.valid)) {
    throw new Error('A valida\u00e7\u00e3o final encontrou diverg\u00eancias.');
  }
  console.log(JSON.stringify({ result: 'success', validation }, null, 2));
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
