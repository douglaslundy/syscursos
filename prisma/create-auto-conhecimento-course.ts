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
const COURSE_TITLE = "Projeto Autoconhecimento e Transformacao - Pedro Calabrez";
const COURSE_SLUG = "projeto-autoconhecimento-e-transformacao-pedro-calabrez";
const SOURCE_PATH = resolve(
  process.env.USERPROFILE ?? "",
  "Desktop",
  "PROJETO AUTO CONHECIMENTO E TRANSFORMAÇÃO PEDRO CALABREZ.txt",
);
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

// Formato: "MODULO NN - titulo", depois pares "Aula NN - titulo" / "[pdf] nome" seguidos da linha com a URL.
function parse(text: string) {
  const modules: ModuleSeed[] = [];
  let module: ModuleSeed | null = null;
  let pending: { kind: "lesson" | "pdf"; title: string; position: number } | null = null;
  let lastLesson: LessonSeed | null = null;

  for (const raw of text.replace(/^﻿/, "").split(/\r?\n/)) {
    const line = raw.trim();

    if (!line) continue;

    const moduleMatch = /^M[ÓO]DULO\s+\d+\s*-\s*(.+)$/i.exec(line);

    if (moduleMatch) {
      module = { position: modules.length + 1, title: clean(moduleMatch[1]), lessons: [] };
      modules.push(module);
      pending = null;
      lastLesson = null;
      continue;
    }

    if (/^https?:\/\//.test(line)) {
      if (!module || !pending) throw new Error(`URL sem titulo antecedente: ${line}`);

      if (pending.kind === "lesson") {
        lastLesson = { position: module.lessons.length + 1, title: pending.title, url: line, materials: [] };
        module.lessons.push(lastLesson);
      } else {
        if (!lastLesson) throw new Error(`PDF sem aula antecedente: ${pending.title}`);
        lastLesson.materials.push({ title: pending.title, url: line });
      }

      pending = null;
      continue;
    }

    const pdfMatch = /^\[pdf\]\s*(.+)$/i.exec(line);

    if (pdfMatch) {
      pending = { kind: "pdf", title: clean(pdfMatch[1].replace(/\+/g, " ").replace(/_/g, "")), position: 0 };
      continue;
    }

    const lessonMatch = /^(?:Aula|Bonus)\s+\d+\s*-\s*(.+)$/i.exec(line);

    if (lessonMatch) {
      pending = { kind: "lesson", title: clean(lessonMatch[1]), position: 0 };
      continue;
    }

    throw new Error(`Linha nao reconhecida: ${line}`);
  }

  return modules;
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
