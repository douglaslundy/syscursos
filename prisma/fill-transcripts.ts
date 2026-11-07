import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { attachTranscripts, parseTranscript, type CourseSeed, type LessonSeed } from "./import-drive-courses";

const D = "G:/Meu Drive/CURSOS/";
const JOBS: Array<[string, string]> = [
  ["Mestre da Leitura Fria - Bruno Cossalter", "Bruno Cossalter -  Mestre da Leitura Fria/TRANSCRICAO - Bruno Cossalter -  Mestre da Leitura Fria.txt"],
  ["Assunto Infinito", "Assuntos Infinitos/TRANSCRICAO - Assuntos Infinitos.txt"],
  ["Protocolo Corrida de Rua", "PROTOCOLO CORRA MAIS RAPIDO/TRANSCRICAO - PROTOCOLO CORRA MAIS RAPIDO.txt"],
  ["Resenhas Filosóficas", "RESENHAS FILOSOFICAS/RESENHAS FILOSOFICAS.txt"],
  ["Inteligência Social - Como se conectar e convencer pessoas", "Inteligencia Social Como se conectar e convencer pessoas/TRANSCRICAO - Inteligencia Social Como se conectar e convencer pessoas.txt"],
  ["Pegada Assertiva", "Leticia Felisberto-Pegada Assertiva/Leticia Felisberto-Pegada Assertiva.txt"],
  ["Hamburgueria Artesanal", "Curso Hamburgueria Artesanal - Bruno Salomao/TRANSCRICAO - Curso Hamburgueria Artesanal - Bruno Salomao.txt"],
  ["PALESTRAS", "PALESTRAS/TRANSCRICAO - PALESTRAS.txt"],
  ["POSICOES_SEXUAIS", "Posições Sexuais/TRANSCRICAO - Posições Sexuais.txt"],
];

(async () => {
  const prisma = new PrismaClient();
  const apply = process.argv.includes("--run");
  for (const [title, rel] of JOBS) {
    const course = await prisma.course.findFirst({ where: { title }, select: { producerId: true, modules: { orderBy: { position: "asc" }, select: { title: true, lessons: { orderBy: { position: "asc" }, select: { id: true, title: true, transcript: true } } } } } });
    if (!course) { console.log("SEM CURSO", title); continue; }
    const ids = new Map<LessonSeed, string>();
    const seed: CourseSeed = { title, modules: course.modules.map((m) => ({ title: m.title, lessons: m.lessons.filter((l) => !(l.transcript ?? "").trim()).map((l) => { const s: LessonSeed = { title: l.title, url: "", isPdf: false, pdfs: [] }; ids.set(s, l.id); return s; }) })) };
    const sections = parseTranscript(readFileSync(D + rel, "utf8"));
    const r = attachTranscripts(seed, sections);
    const hits = [...ids.keys()].filter((s) => s.transcript);
    console.log(`${title}: sem transc.=${ids.size} -> casadas=${hits.length}; secoes=${sections.length}; sobras=${r.unused.length}`);
    r.missing.slice(0, 3).forEach((m) => console.log("   falta:", m));
    r.unused.slice(0, 8).forEach((m) => console.log("   sobra:", m));
    if (apply) for (const s of hits) await prisma.lesson.update({ where: { id: ids.get(s)! }, data: { transcript: s.transcript, transcriptAuthorId: course.producerId } });
  }
  await prisma.$disconnect();
})();
