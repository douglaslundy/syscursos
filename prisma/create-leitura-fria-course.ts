import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  CourseStatus,
  EnrollmentStatus,
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
const STUDENT_EMAIL = "douglaslundy100@gmail.com";
const COURSE_TITLE = "Mestre da Leitura Fria - Bruno Cossalter";
const COURSE_SLUG = "mestre-da-leitura-fria-bruno-cossalter";
const SOURCE_PATH = resolve(process.env.USERPROFILE ?? "", "Desktop", "cursos", "MESTRE DA LEITURA FRIA - BRUNO COSSALTER.txt");
const DRY_RUN = process.argv.includes("--dry-run");

type LessonSeed = { position: number; title: string; url: string; materials: Array<{ title: string; url: string }> };
type ModuleSeed = { position: number; title: string; lessons: LessonSeed[] };

function loadLocalEnv() {
  const envPath = resolve(process.cwd(), ".env");

  if (!existsSync(envPath)) return;

  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    const separatorIndex = trimmed.indexOf("=");

    if (!trimmed || trimmed.startsWith("#") || separatorIndex <= 0) continue;

    process.env[trimmed.slice(0, separatorIndex).trim()] ??= trimmed
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
  }
}

const clean = (value: string) => value.replace(/\s+/g, " ").trim().slice(0, 180);

// Formato: "MODULO NN - titulo", depois pares "[pdf] NN - titulo" e a linha com a URL. Cada PDF e uma aula (o link do Drive abre o PDF).
function parse(text: string) {
  const modules: ModuleSeed[] = [];
  let module: ModuleSeed | null = null;
  let pendingTitle: string | null = null;
  let skipUrl = false;

  for (const raw of text.replace(/^\uFEFF/, "").split(/\r?\n/)) {
    const line = raw.trim();

    if (!line) continue;

    // Arquivos de texto fora de video/PDF ("[excecao]") e a secao da raiz nao viram aula.
    if (/^EXCE[ÇC][ÕO]ES/i.test(line)) { module = null; pendingTitle = null; skipUrl = false; continue; }

    if (/^\[exce[çc][ãa]o\]/i.test(line)) { skipUrl = true; pendingTitle = null; continue; }

    if (skipUrl && /^https?:\/\//.test(line)) { skipUrl = false; continue; }

    const moduleMatch = /^M[ÓO]DULO\s+\d+\s*-\s*(.+)$/i.exec(line);

    if (moduleMatch) {
      module = { position: modules.length + 1, title: clean(moduleMatch[1]), lessons: [] };
      modules.push(module);
      continue;
    }

    const pdfMatch = /^\[pdf\]\s*(?:\d+\s*-\s*)?(.+)$/i.exec(line);

    if (pdfMatch) {
      pendingTitle = clean(pdfMatch[1]);
      continue;
    }

    if (/^https?:\/\//.test(line)) {
      if (!module || !pendingTitle) throw new Error(`URL sem titulo antecedente: ${line}`);

      module.lessons.push({ position: module.lessons.length + 1, title: pendingTitle, url: line, materials: [] });
      pendingTitle = null;
      continue;
    }

    // Linha solta antes de uma URL = titulo de videoaula.
    if (pendingTitle) throw new Error(`Titulo sem URL: ${pendingTitle}`);
    pendingTitle = clean(line.replace(/\s+-\s+\d+x\d+\s+\d+K$/i, ""));
  }

  if (pendingTitle) throw new Error(`Titulo sem URL: ${pendingTitle}`);

  return modules.filter((item) => item.lessons.length > 0).map((item, index) => ({ ...item, position: index + 1 }));
}

async function main() {
  loadLocalEnv();

  const modules = parse(readFileSync(SOURCE_PATH, "utf8"));
  const lessons = modules.reduce((sum, item) => sum + item.lessons.length, 0);
  const materials = modules.reduce((sum, item) => sum + item.lessons.reduce((s, l) => s + l.materials.length, 0), 0);

  console.log(`Modulos: ${modules.length}, aulas: ${lessons}, materiais: ${materials}.`);
  modules.forEach((item) => console.log(`- ${item.title}: ${item.lessons.length} aulas`));

  if (DRY_RUN) return;

  const producer = await prisma.user.findFirst({
    where: { email: PRODUCER_EMAIL, role: UserRole.PRODUCER, status: UserStatus.ACTIVE },
    select: { id: true, organizationId: true },
  });

  if (!producer) throw new Error(`Produtor ${PRODUCER_EMAIL} nao encontrado ou inativo.`);

  const student = await prisma.studentProfile.findFirst({
    where: { user: { email: STUDENT_EMAIL, role: UserRole.STUDENT, status: UserStatus.ACTIVE } },
    select: { id: true },
  });

  if (!student) throw new Error(`Aluno ${STUDENT_EMAIL} nao encontrado ou inativo.`);

  const course = await prisma.course.upsert({
    where: { slug: COURSE_SLUG },
    update: { title: COURSE_TITLE, status: CourseStatus.ACTIVE, organizationId: producer.organizationId, producerId: producer.id },
    create: {
      title: COURSE_TITLE,
      slug: COURSE_SLUG,
      status: CourseStatus.ACTIVE,
      organizationId: producer.organizationId,
      producerId: producer.id,
    },
    select: { id: true },
  });

  await prisma.module.deleteMany({ where: { courseId: course.id } });

  for (const moduleSeed of modules) {
    const created = await prisma.module.create({
      data: { courseId: course.id, title: moduleSeed.title, position: moduleSeed.position, status: ModuleStatus.ACTIVE },
      select: { id: true },
    });

    for (const lessonSeed of moduleSeed.lessons) {
      const lesson = await prisma.lesson.create({
        data: {
          moduleId: created.id,
          title: lessonSeed.title,
          position: lessonSeed.position,
          status: LessonStatus.ACTIVE,
          youtubeUrl: lessonSeed.url,
          youtubeVideoId: null,
        },
        select: { id: true },
      });

      for (const [index, material] of lessonSeed.materials.entries()) {
        await prisma.lessonMaterial.create({
          data: {
            lessonId: lesson.id,
            type: LessonMaterialType.PDF,
            title: material.title,
            url: material.url,
            position: index + 1,
            status: LessonMaterialStatus.ACTIVE,
          },
        });
      }
    }
  }

  const startsAt = new Date();
  const expiresAt = new Date(startsAt);
  expiresAt.setMonth(expiresAt.getMonth() + 12);

  await prisma.enrollment.upsert({
    where: { studentId_courseId: { studentId: student.id, courseId: course.id } },
    update: { startsAt, expiresAt, status: EnrollmentStatus.ACTIVE },
    create: { studentId: student.id, courseId: course.id, startsAt, expiresAt, status: EnrollmentStatus.ACTIVE },
  });

  await prisma.producerStudent.upsert({
    where: { producerId_studentId: { producerId: producer.id, studentId: student.id } },
    update: {},
    create: { producerId: producer.id, studentId: student.id },
  });

  console.log(`Curso "${COURSE_TITLE}" criado. Matricula de ${STUDENT_EMAIL}: ${startsAt.toISOString()} ate ${expiresAt.toISOString()}.`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
