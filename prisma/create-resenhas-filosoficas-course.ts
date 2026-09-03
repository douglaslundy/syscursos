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
const COURSE_TITLE = "Resenhas Filosóficas";
const COURSE_SLUG = "resenhas-filosoficas";

const EXPECTED_MODULE_COUNT = 1;
const EXPECTED_LESSON_COUNT = 31;

function driveUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/view`;
}

type MaterialSeed = {
  title: string;
  fileId: string;
};

type LessonInput = {
  title: string;
  videoFileId: string;
  materials?: MaterialSeed[];
};

type LessonSeed = {
  position: number;
  title: string;
  youtubeUrl: string;
  materials: { position: number; title: string; url: string }[];
};

// Aulas na sequência informada. Aulas 30 e 31 são somente PDF: o link do
// Drive é usado como conteúdo principal e também anexado como material.
const lessonInputs: LessonInput[] = [
  { title: "Boas Vindas", videoFileId: "1tEFlszjKUN3_W1JWflfcPtnZBEjYp0Fz" },
  {
    title: "Carta Sobre a Felicidade - Epicuro",
    videoFileId: "1xEV3T6Q7ejYL891Mn6Dpd-QuvVRxdw3E",
    materials: [{ title: "Epicuro - Carta sobre a Felicidade", fileId: "1HcnNY0Bjy5WiWuIcJzcEI-9ZI0Mjvuvf" }],
  },
  {
    title: "Sociedade do Cansaço - Byung-Chul Han",
    videoFileId: "1cizLVkoCefYaw0AA6C2luzjm0LWnlBBC",
    materials: [{ title: "Byung-Chul Han - Sociedade do Cansaço", fileId: "11ZhzP1aOBnr_lCyStqEWfV-Ysz-6SrSM" }],
  },
  { title: "Discurso do Método - René Descartes", videoFileId: "17GxoUcJcXHvqaZpKtaG8wcgBR7v0xsyw" },
  {
    title: "Ética a Nicômaco - Aristóteles",
    videoFileId: "1tN8iyOBN8PjWSEZidMbf3e668T6Czz9i",
    materials: [{ title: "Aristóteles - Ética a Nicômaco", fileId: "1Ok9WsT7es94X602wXhIv0ofh0erwSO4K" }],
  },
  {
    title: "O Príncipe - Maquiavel",
    videoFileId: "1o-vOM41x8MaTWS9htmPAljnFJW1uRMBD",
    materials: [{ title: "Maquiavel - O Príncipe", fileId: "10RgcYnFYrdKXaHDDlj3S9rwcpEPo2yYP" }],
  },
  {
    title: "A Genealogia da Moral - Friedrich Nietzsche",
    videoFileId: "1TchxZkpPdPmaIrCIsIVNU4K9jmLQhrhO",
    materials: [{ title: "Nietzsche - A Genealogia da Moral", fileId: "1uU1PDAqUJru0-yW-suQPEWr_KDUviVq4" }],
  },
  { title: "O Banquete - Platão", videoFileId: "1GOV9umzeye51p_FdkMJn04HHSTgwQ290" },
  { title: "Leviatã - Thomas Hobbes", videoFileId: "1SR_FzEaT2lPPK1J66vM1Ir2n5uo1TZOf" },
  {
    title: "Modernidade Líquida - Zygmunt Bauman",
    videoFileId: "1mbHDkwU3P2Y1BLZ0qIJHprj8T7KjSo_i",
    materials: [{ title: "Bauman - Modernidade Líquida", fileId: "1AwGMrmygi45t7heh_46vugskiLdQH44P" }],
  },
  {
    title: "Meditações - Marco Aurélio",
    videoFileId: "1bc8E7Q3TyVv3hC4mq41o1nBwYdh0FLv9",
    materials: [{ title: "Marco Aurélio - Meditações", fileId: "17FBzaDxPEpt4v5j5oa2yEG-oF6w-E_0X" }],
  },
  { title: "Do Contrato Social - Jean-Jacques Rousseau", videoFileId: "1cDV8-yy3IyT53D0cVkXcD2bUiUzXO5KK" },
  { title: "Sobre a Brevidade da Vida - Sêneca", videoFileId: "1fqOAnCdHQDxzaT7otpGqmAjpnx0TKgQU" },
  {
    title: "O Espírito das Leis - Montesquieu",
    videoFileId: "1PpJEzKt_URnKPQXFz6CA_MOs08NaneEy",
    materials: [{ title: "Montesquieu - O Espírito das Leis", fileId: "1GbMCU13k0wrjRSp1HlBNTWhqcb8D_Sev" }],
  },
  { title: "O Mito da Caverna - Platão", videoFileId: "1iKZEVCZsi_3C6mHyC7dV3XFnELBnJ9qo" },
  {
    title: "A Ética Protestante e o Espírito do Capitalismo - Max Weber",
    videoFileId: "17HrlZDg345M9HN9ZVa4AGC40nhAOT0Hp",
    materials: [
      { title: "Max Weber - A Ética Protestante e o Espírito do Capitalismo", fileId: "1SMiVkcWo22sJxfuoc1Q9TFeb_u9Ov7_O" },
    ],
  },
  {
    title: "O Suicídio - Émile Durkheim",
    videoFileId: "1Hrg3A4CCR0pSHIDt2YzCRqLAoTNUJCqs",
    materials: [{ title: "Émile Durkheim - O Suicídio", fileId: "1eBEp67xsX0oxGaYlTGUgyzaeVSiTbGjd" }],
  },
  {
    title: "As Palavras e as Coisas - Michel Foucault",
    videoFileId: "1bx6hb0nc6tRT_006yjSVZSkTkXFPzUpm",
    materials: [{ title: "Foucault - As Palavras e as Coisas", fileId: "1aA5-2jgZzTsRFlcIiVGf7AJHac8MK6Rk" }],
  },
  { title: "O Livre-Arbítrio - Santo Agostinho", videoFileId: "1HJ0rUC5k6HogF-DMfiLxeW66z3BlmmDM" },
  {
    title: "Odisseia - Homero",
    videoFileId: "1BvlBIOIcAYeLl1SYs_E9eTps2rCPwenM",
    materials: [{ title: "Homero - Odisseia", fileId: "1EfiutBz-VNEY-MwFYds8aizbV0FnPcGG" }],
  },
  {
    title: "O Mito de Sísifo - Albert Camus",
    videoFileId: "1iEOfBBLGtDl51nhAgfFAQGl6POUYwx5Y",
    materials: [{ title: "Albert Camus - O Mito de Sísifo", fileId: "11NenyutxCn1DQTT-P3A_QiZCHBXjAlwL" }],
  },
  {
    title: "Madame Bovary - Gustave Flaubert",
    videoFileId: "1i45cXn1iEaf9sqXEZVjbRRN5WC3hSxxb",
    materials: [{ title: "Gustave Flaubert - Madame Bovary", fileId: "1GBm_tCNF__KQSka53lR2OvleZALd7I88" }],
  },
  {
    title: "Sobre Como Lidar Consigo Mesmo - Schopenhauer",
    videoFileId: "1jNOVV6pld_duaoFUzFep9THlklByfQTC",
    materials: [
      { title: "Arthur Schopenhauer - Sobre Como Lidar Consigo Mesmo", fileId: "134Y35b9JCnpvU0JFPUby7lyI0QCbAlIn" },
    ],
  },
  {
    title: "O Existencialismo é um Humanismo - Jean-Paul Sartre",
    videoFileId: "1CYIJOnUm5i__R4uZyxj_67Vnj58UE5X3",
    materials: [
      { title: "Jean-Paul Sartre - O Existencialismo é um Humanismo", fileId: "1RYS1um8eKHKchO-7MEMDtOH4bUT0DUg6" },
    ],
  },
  {
    title: "A Crise da Narração - Byung-Chul Han",
    videoFileId: "1BXIvvhdFog7Yj0I9rN9lY2YI0cdQCZOh",
    materials: [{ title: "Byung-Chul Han - A Crise da Narração", fileId: "1g3kHByRoOlBqp_JTOEafWPabEXxC8hi2" }],
  },
  {
    title: "Favor Fechar os Olhos: Em Busca de um Outro Tempo - Byung-Chul Han",
    videoFileId: "1V3ptTNvA6sAhxCXPEC8zaBHpJtY3A2TO",
    materials: [
      { title: "Byung-Chul Han - Favor Fechar os Olhos: Em Busca de Outro Tempo", fileId: "14BiPZb9wfjp_hfjFuuplqD2ObNB4qYfe" },
    ],
  },
  { title: "Suma Teológica - São Tomás de Aquino", videoFileId: "16nSxPzHn7ouQF4Uxa5RCvc-yYjaT04Fd" },
  {
    title: "A Carta no Barril de Cimento - Hayama Yoshiki",
    videoFileId: "1WoVKy1eAp-hBvyCbH3l80QbReFmutZGN",
    materials: [
      { title: "Hayama Yoshiki - A Carta Dentro do Barril de Cimento", fileId: "1RzvA3NFDTM5kbAVHojM-HRDd1AfcEF_p" },
    ],
  },
  { title: "O Conceito de Angústia - Soren Kierkegaard", videoFileId: "1bjHLsU9qsuAqxz25ntLEW7K8Q_8RqtqK" },
  {
    title: "O Ser e o Nada - Jean-Paul Sartre",
    videoFileId: "1r9ENfqmrKDZNdrErNAXC6MzIMjOfsvdL",
    materials: [{ title: "Jean-Paul Sartre - O Ser e o Nada", fileId: "1r9ENfqmrKDZNdrErNAXC6MzIMjOfsvdL" }],
  },
  {
    title: "eBook de Introdução à Filosofia",
    videoFileId: "1ol9xBAMzhaBG3wZOpmD9PJLP10Q3ElRG",
    materials: [{ title: "eBook de Introdução à Filosofia", fileId: "1ol9xBAMzhaBG3wZOpmD9PJLP10Q3ElRG" }],
  },
];

const lessons: LessonSeed[] = lessonInputs.map((lesson, index) => ({
  position: index + 1,
  title: lesson.title,
  youtubeUrl: driveUrl(lesson.videoFileId),
  materials: (lesson.materials ?? []).map((material, materialIndex) => ({
    position: materialIndex + 1,
    title: material.title,
    url: driveUrl(material.fileId),
  })),
}));

function loadLocalEnv() {
  const envPath = resolve(process.cwd(), ".env");

  if (!existsSync(envPath)) {
    return;
  }

  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, "");

    process.env[key] ??= value;
  }
}

async function main() {
  loadLocalEnv();

  const applyChanges = process.argv.includes("--apply");

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

  const materialCount = lessons.reduce((total, lesson) => total + lesson.materials.length, 0);

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
        modules: EXPECTED_MODULE_COUNT,
        lessons: lessons.length,
        materials: materialCount,
        existingCourse,
      },
      null,
      2,
    ),
  );

  if (lessons.length !== EXPECTED_LESSON_COUNT) {
    throw new Error(`Esperado ${EXPECTED_LESSON_COUNT} aulas, encontrado ${lessons.length}.`);
  }

  if (!applyChanges) {
    console.log("\nDry-run. Rode novamente com --apply para gravar.");
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

      const createdModule = await transaction.module.create({
        data: {
          courseId: course.id,
          title: "Módulo 01 - Resenhas Filosóficas",
          position: 1,
          status: ModuleStatus.ACTIVE,
          description: null,
        },
        select: { id: true },
      });

      for (const lesson of lessons) {
        await transaction.lesson.create({
          data: {
            moduleId: createdModule.id,
            title: lesson.title,
            position: lesson.position,
            status: LessonStatus.ACTIVE,
            description: null,
            youtubeUrl: lesson.youtubeUrl,
            youtubeVideoId: null,
            materials: {
              create: lesson.materials.map((material) => ({
                type: LessonMaterialType.PDF,
                title: material.title,
                url: material.url,
                position: material.position,
                status: LessonMaterialStatus.ACTIVE,
              })),
            },
          },
        });
      }
    },
    { maxWait: 20_000, timeout: 120_000 },
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
          _count: { select: { lessons: true } },
          lessons: { select: { _count: { select: { materials: true } } } },
        },
      },
    },
  });

  const createdLessonCount = createdCourse.modules.reduce((total, m) => total + m._count.lessons, 0);
  const createdMaterialCount = createdCourse.modules.reduce(
    (total, m) => total + m.lessons.reduce((sum, l) => sum + l._count.materials, 0),
    0,
  );

  if (
    createdCourse.producer.email !== PRODUCER_EMAIL ||
    createdCourse.modules.length !== EXPECTED_MODULE_COUNT ||
    createdLessonCount !== EXPECTED_LESSON_COUNT ||
    createdMaterialCount !== materialCount
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
        materials: createdMaterialCount,
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
