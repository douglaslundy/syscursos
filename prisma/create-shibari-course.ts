import { PrismaClient, CourseStatus, ModuleStatus, LessonStatus, UserRole, UserStatus } from "@prisma/client";

const prisma = new PrismaClient();

const PRODUCER_EMAIL = "douglaslundy@gmail.com";
const COURSE_TITLE = "Shibari";
const COURSE_SLUG = "shibari";

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
    title: "Comece Aqui",
    lessons: [
      { position: 1, title: "Aula Bônus 01 - Harness Tórax", youtubeUrl: "https://www.youtube.com/watch?v=rwyzLOSDGX0" },
      { position: 2, title: "Aula Bônus 02 - Amarrando 4 Membros", youtubeUrl: "https://www.youtube.com/watch?v=HJBV1P7Fhtc" },
    ],
  },
  {
    position: 2,
    title: "Preliminawa",
    lessons: [
      { position: 1, title: "Primeiros nós", youtubeUrl: "https://www.youtube.com/watch?v=iFC9yW5GaeY" },
      { position: 2, title: "Single Column Tie (SCT)", youtubeUrl: "https://www.youtube.com/watch?v=PRmAN57KJH0" },
      { position: 3, title: "SCT Clássico", youtubeUrl: "https://www.youtube.com/watch?v=FqzHL7PE-JQ" },
      { position: 4, title: "SCT - Voltinha Mágica", youtubeUrl: "https://www.youtube.com/watch?v=ATC1rTCDn44" },
      { position: 5, title: "SCT - O Que NÃO Fazer", youtubeUrl: "https://www.youtube.com/watch?v=L4cB9fDz5pk" },
      { position: 6, title: "SCT - Voltinha Que Salva", youtubeUrl: "https://www.youtube.com/watch?v=sWF-fwls-0Y" },
      { position: 7, title: "Double Column Tie (DCT)", youtubeUrl: "https://www.youtube.com/watch?v=4VL8yhQnras" },
      { position: 8, title: "DCT - Pernas Cruzadas", youtubeUrl: "https://www.youtube.com/watch?v=Z5tzCAXrWK8" },
      { position: 9, title: "DCT - Pernas Esticadas", youtubeUrl: "https://www.youtube.com/watch?v=goMoQJ8Squ0" },
      { position: 10, title: "DCT - Nas Coxas", youtubeUrl: "https://www.youtube.com/watch?v=0v11fWyn6Vg" },
      { position: 11, title: "Boca de lobo", youtubeUrl: "https://www.youtube.com/watch?v=vWohsVxju2E" },
      { position: 12, title: "Hojo Cuff", youtubeUrl: "https://www.youtube.com/watch?v=9sVI8uNofAk" },
      { position: 13, title: "Tensão e Contratensão", youtubeUrl: "https://www.youtube.com/watch?v=3mdVs2zu6l4" },
      { position: 14, title: "Half Hitch - Fricções", youtubeUrl: "https://www.youtube.com/watch?v=ApZeN0FjeTQ" },
      { position: 15, title: "Nodome - Fricções", youtubeUrl: "https://www.youtube.com/watch?v=bgpmP4ODD40" },
      { position: 16, title: "Uranodome - Fricções", youtubeUrl: "https://www.youtube.com/watch?v=GfhIVJpOlDc" },
      { position: 17, title: "X - Fricções", youtubeUrl: "https://www.youtube.com/watch?v=Mz9s_Kr2MRU" },
      { position: 18, title: "L e U - Fricções", youtubeUrl: "https://www.youtube.com/watch?v=_g0v4OiQbwA" },
      { position: 19, title: "Meia lua - Fricções", youtubeUrl: "https://www.youtube.com/watch?v=7sacmKEGxCI" },
      { position: 20, title: "Emendar cordas", youtubeUrl: "https://www.youtube.com/watch?v=lw6P8Wgcdrw" },
      { position: 21, title: "Como amarrar em móveis", youtubeUrl: "https://www.youtube.com/watch?v=8-70rF8XoU0" },
    ],
  },
  { position: 3, title: "Dó Ré Mi Na Wa", lessons: [] },
  {
    position: 4,
    title: "Menu Nawa I - Figuras Clássicas",
    lessons: [
      { position: 1, title: "Usagi", youtubeUrl: "https://www.youtube.com/watch?v=vHBzkXJRoPA" },
      { position: 2, title: "Usagi com Travas", youtubeUrl: "https://www.youtube.com/watch?v=ODUe2TlPgWw" },
      { position: 3, title: "Futomomo", youtubeUrl: "https://www.youtube.com/watch?v=cXb42sKJtYI" },
      { position: 4, title: "Jiai Fisherman", youtubeUrl: "https://www.youtube.com/watch?v=S54SKyECDN4" },
      { position: 5, title: "Strappado", youtubeUrl: "https://www.youtube.com/watch?v=CaJT9RDsQYk" },
      { position: 6, title: "Box Tie", youtubeUrl: "https://www.youtube.com/watch?v=xiFYplz_Z5U" },
      { position: 7, title: "Agura", youtubeUrl: "https://www.youtube.com/watch?v=ajwPAO4ssmQ" },
      { position: 8, title: "Ebi", youtubeUrl: "https://www.youtube.com/watch?v=lh0PsmYhUBo" },
      { position: 9, title: "Tengu Hogtie", youtubeUrl: "https://www.youtube.com/watch?v=2UfJWpRGGbw" },
    ],
  },
  {
    position: 5,
    title: "Menu Nawa II - Takate-Kote",
    lessons: [
      { position: 1, title: "Takate Kote formato V", youtubeUrl: "https://www.youtube.com/watch?v=F-RJY9UzRPo" },
      { position: 2, title: "Takate Kote formato T", youtubeUrl: "https://www.youtube.com/watch?v=MBtvF0egYbM" },
      { position: 3, title: "Como Praticar Sozinho", youtubeUrl: "https://www.youtube.com/watch?v=FvyNWKbyYwQ" },
    ],
  },
  {
    position: 6,
    title: "Menu Nawa III - Harness",
    lessons: [
      { position: 1, title: "Aula Bônus 01 - Harness Tórax", youtubeUrl: "https://www.youtube.com/watch?v=rwyzLOSDGX0" },
      { position: 2, title: "Pentagrama", youtubeUrl: "https://www.youtube.com/watch?v=uurMdTzvYc4" },
      { position: 3, title: "Hip Harness Cadeirinha", youtubeUrl: "https://www.youtube.com/watch?v=TKPNJONaZeE" },
      { position: 4, title: "Shukabishi - Gorgone's version", youtubeUrl: "https://www.youtube.com/watch?v=HA8xhWK-Mww" },
    ],
  },
  {
    position: 7,
    title: "Menu Nawa IV - Temperos",
    lessons: [
      { position: 1, title: "Cabelo Curto", youtubeUrl: "https://www.youtube.com/watch?v=ITyHWv45Oc8" },
      { position: 2, title: "Cabelo Longo (equivale a Cabelo Comprido)", youtubeUrl: "https://www.youtube.com/watch?v=crxc_OYToqg" },
      { position: 3, title: "Cabelo Longo Liso (equivale a Cabelo Liso Comprido)", youtubeUrl: "https://www.youtube.com/watch?v=seioWDoTvtQ" },
      { position: 4, title: "Mordaça", youtubeUrl: "https://www.youtube.com/watch?v=OE0SdLEgSK8" },
      { position: 5, title: "Matanawa", youtubeUrl: "https://www.youtube.com/watch?v=8k2rL_rE3Jk" },
    ],
  },
  { position: 8, title: "Menu Nawa V - Suspensão", lessons: [] },
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

  console.log("Curso Shibari cadastrado/atualizado com sucesso.");
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
