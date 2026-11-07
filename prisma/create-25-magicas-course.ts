import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const TITLE = "Curso 25 Mágicas";
const SLUG = "curso-25-magicas";
const GROUP = "https://t.me/+Zh7VPHcON-UxNjQx";

type Link = { title: string; url: string };
type Lesson = { title: string; url: string; links?: Link[] };
type Mod = { title: string; lessons: Lesson[] };

const yt = (id: string) => `https://youtu.be/${id}`;
const MODULES: Mod[] = [
  { title: "Mágica do Dinheiro", lessons: [{ title: "Explicação", url: yt("HuxbmymCuqY"), links: [{ title: "Grupo no Telegram com todas as mágicas", url: GROUP }] }, { title: "Fabricação das Notas", url: yt("xURNuJ2xhiQ"), links: [{ title: "Link dos ímãs", url: "https://meli.la/1Y3ytCH" }] }] },
  { title: "Mágica da Cerveja Infinita", lessons: [{ title: "Explicação", url: yt("w_rpAf6ha5E") }] },
  { title: "Mágica da Marca na Mão", lessons: [{ title: "Explicação", url: yt("uhgsdKjPNQc") }] },
  { title: "Leitura Mental", lessons: [{ title: "Explicação", url: yt("bUn-cShV4F4") }, { title: "Técnica Manual Papel", url: yt("Jm9eIJ7gX_0") }] },
  { title: "Carta no Celular", lessons: [{ title: "Explicação", url: yt("BKyCUsw2qm8") }] },
  { title: "Mágica da Barata", lessons: [{ title: "Explicação", url: "https://youtube.com/shorts/Ux7lIWTsgjk", links: [{ title: "Link do app", url: "https://www.mypetboris.com" }] }] },
  { title: "Lacre da Lata", lessons: [{ title: "Explicação", url: yt("uQ0wKBvTKpI") }] },
  { title: "Carta no Nariz", lessons: [{ title: "Explicação", url: yt("DiikkNgQxqM") }] },
  { title: "Naturalidade, Sincronia e Fluidez", lessons: [{ title: "Explicação", url: yt("cCicyUjv_qc") }] },
  { title: "Baralho que Vira", lessons: [{ title: "Explicação", url: yt("ZTtGapaCp5M") }] },
  { title: "Intuição Perfeita", lessons: [{ title: "Explicação", url: yt("1PdbzQFNalQ") }] },
  { title: "Carta Invisível", lessons: [{ title: "Explicação", url: yt("KgvO0gbqgLg") }] },
  { title: "Baralho que se Arruma", lessons: [{ title: "Explicação", url: yt("BJeXpQbO5l0") }] },
  { title: "A Carta Diferente - 8 Cartas", lessons: [{ title: "Explicação", url: yt("jn4z2QonZmA") }] },
  { title: "Chicago Opener", lessons: [{ title: "Explicação", url: yt("q8YIEMK-Wnk") }] },
  { title: "O Tapa", lessons: [{ title: "Explicação", url: yt("ApzMJHKrXKE") }] },
  { title: "Cartão do Fogo", lessons: [{ title: "Explicação", url: yt("61R2LTS7YGQ") }] },
  { title: "Misdirection e Distanciamento do Truque de Mágicas", lessons: [{ title: "Explicação", url: yt("bB46hnhdHsQ") }] },
  { title: "Tirando o Dedo", lessons: [{ title: "Explicação", url: yt("cWbJ2soLW2M") }] },
  { title: "Ramjolock", lessons: [{ title: "Explicação", url: yt("jZa5tdmgzEw") }] },
  { title: "Mentalismo Caixa Branca e Preta", lessons: [{ title: "Explicação", url: yt("xdP-a1a7fwc") }] },
];

const videoId = (url: string) => {
  const u = new URL(url);
  return u.hostname === "youtu.be" ? u.pathname.slice(1) : (u.pathname.split("/")[2] ?? null);
};

(async () => {
  if (await prisma.course.findUnique({ where: { slug: SLUG } })) throw new Error(`curso ${SLUG} já existe`);
  const producer = await prisma.user.findFirstOrThrow({ where: { email: "douglaslundy@gmail.com", role: "PRODUCER", status: "ACTIVE" } });
  const student = await prisma.studentProfile.findFirstOrThrow({ where: { user: { email: "douglaslundy100@gmail.com" } } });
  const startsAt = new Date();
  const expiresAt = new Date(startsAt);
  expiresAt.setMonth(expiresAt.getMonth() + 12);

  await prisma.$transaction(async (tx) => {
    const course = await tx.course.create({ data: { title: TITLE, slug: SLUG, status: "ACTIVE", organizationId: producer.organizationId, producerId: producer.id }, select: { id: true } });
    for (const [mi, m] of MODULES.entries()) {
      const mod = await tx.module.create({ data: { courseId: course.id, title: m.title, position: mi + 1, status: "ACTIVE" }, select: { id: true } });
      for (const [li, l] of m.lessons.entries()) {
        await tx.lesson.create({
          data: {
            moduleId: mod.id,
            title: l.title,
            position: li + 1,
            status: "ACTIVE",
            youtubeUrl: l.url,
            youtubeVideoId: videoId(l.url),
            materials: { create: (l.links ?? []).map((k, ki) => ({ type: "LINK" as const, title: k.title, url: k.url, position: ki + 1 })) },
          },
        });
      }
    }
    await tx.enrollment.create({ data: { studentId: student.id, courseId: course.id, startsAt, expiresAt, status: "ACTIVE" } });
  }, { timeout: 120_000 });
  const n = MODULES.reduce((a, m) => a + m.lessons.length, 0);
  console.log(`${TITLE}: ${MODULES.length} módulos, ${n} aulas`);
  await prisma.$disconnect();
})();
