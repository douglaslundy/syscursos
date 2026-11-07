import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { attachTranscripts, type CourseSeed, type LessonSeed } from "./import-drive-courses";

const [slug, json] = process.argv.slice(2);
(async () => {
  const prisma = new PrismaClient();
  const course = await prisma.course.findUniqueOrThrow({ where: { slug }, select: { producerId: true, modules: { orderBy: { position: "asc" }, select: { title: true, lessons: { orderBy: { position: "asc" }, select: { id: true, title: true, transcript: true } } } } } });
  const ids = new Map<LessonSeed, string>();
  const seed: CourseSeed = { title: slug, modules: course.modules.map((m) => ({ title: m.title, lessons: m.lessons.filter((l) => !(l.transcript ?? "").trim()).map((l) => { const s: LessonSeed = { title: l.title, url: "", isPdf: false, pdfs: [] }; ids.set(s, l.id); return s; }) })) };
  const sections = JSON.parse(readFileSync(json, "utf8")) as Array<{ module: string; lesson: string; text: string }>;
  const r = attachTranscripts(seed, sections);
  const hits = [...ids.keys()].filter((s) => s.transcript);
  console.log(`${slug}: aulas sem transc.=${ids.size} casadas=${hits.length} secoes=${sections.length} sobras=${r.unused.length}`);
  r.unused.slice(0, 8).forEach((m) => console.log("   sobra:", m));
  if (process.argv.includes("--run")) for (const s of hits) await prisma.lesson.update({ where: { id: ids.get(s)! }, data: { transcript: s.transcript, transcriptAuthorId: course.producerId } });
  await prisma.$disconnect();
})();
