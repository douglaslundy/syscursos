// Varre as transcricoes combinadas do Drive e preenche as aulas do banco que ainda estao sem transcricao.
// Uso: node --env-file=.env node_modules/tsx/dist/cli.mjs prisma/sweep-transcripts.ts <all.json> [--run]
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

import { norm, parseTranscript } from "./import-drive-courses";

type Node = { path: string[]; name: string; id: string };
type Section = ReturnType<typeof parseTranscript>[number];

const DRIVE_DIR = "G:/Meu Drive/CURSOS";
const VIDEO = /\.(mp4|mov|mkv|avi|webm|m4v|ts)$/i;
const nfc = (s: string) => s.normalize("NFC");
const stem = (name: string) => nfc(name).replace(/\.[^.]{1,5}$/, "").replace(/\s+/g, " ").trim();

function transcriptSections(folder: string) {
  const dir = path.join(DRIVE_DIR, folder);
  if (!existsSync(dir)) return [];

  const files = readdirSync(dir).filter((f) => /\.txt$/i.test(f) && !/^(leia|relatorio)/i.test(f) && statSync(path.join(dir, f)).size > 2000);
  const parsed = files.map((f) => ({ f, sections: parseTranscript(readFileSync(path.join(dir, f), "utf8")) }));

  return parsed.sort((a, b) => b.sections.length - a.sections.length)[0]?.sections ?? [];
}

(async () => {
  const all = JSON.parse(readFileSync(process.argv[2], "utf8")) as Record<string, Node[]>;
  const apply = process.argv.includes("--run");
  const prisma = new PrismaClient();
  const lessons = await prisma.lesson.findMany({
    select: { id: true, title: true, youtubeUrl: true, transcript: true, module: { select: { title: true, course: { select: { id: true, title: true, producerId: true } } } } },
    orderBy: [{ module: { position: "asc" } }, { position: "asc" }],
  });
  const byFileId = new Map<string, (typeof lessons)[number]>();
  for (const l of lessons) {
    const id = l.youtubeUrl?.match(/\/d\/([^/]+)/)?.[1];
    if (id) byFileId.set(id, l);
  }

  let total = 0;

  for (const [folder, files] of Object.entries(all)) {
    const visible = files.filter((f) => !f.path.some((p) => p.startsWith(".")) && VIDEO.test(f.name));
    const owners = new Map<string, number>();
    for (const f of visible) { const l = byFileId.get(f.id); if (l) owners.set(l.module.course.id, (owners.get(l.module.course.id) ?? 0) + 1); }
    const courseId = [...owners.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    if (!courseId) continue;

    const sections = transcriptSections(folder);
    if (sections.length === 0) continue;

    const todo = visible.filter((f) => { const l = byFileId.get(f.id); return l && l.module.course.id === courseId && !(l.transcript ?? "").trim(); });
    if (todo.length === 0) { console.log(`OK    ${folder}: todas as aulas ja tem transcricao (${sections.length} secoes)`); continue; }

    // Aulas ja transcritas consomem a secao correspondente, para nao serem usadas de novo.
    const used = new Set<Section>();
    const doneTexts = new Set(visible.map((f) => (byFileId.get(f.id)?.transcript ?? "").trim()).filter(Boolean));
    for (const s of sections) if (doneTexts.has(s.text.trim())) used.add(s);

    const course = lessons.find((l) => l.module.course.id === courseId)!.module.course;
    let matched = 0;

    for (const f of todo) {
      const l = byFileId.get(f.id)!;
      const leaf = norm(stem(f.name));
      const mod = norm(nfc(f.path[0] ?? ""));
      const pick = (test: (s: Section) => boolean) => sections.find((s) => !used.has(s) && test(s));
      const hit =
        pick((s) => norm(s.lesson) === leaf && norm(s.module) === mod) ??
        pick((s) => norm(s.lesson) === leaf) ??
        pick((s) => norm(s.lesson) === norm(l.title) && norm(s.module) === norm(l.module.title)) ??
        pick((s) => norm(s.lesson) === norm(l.title));

      if (!hit) continue;

      used.add(hit);
      matched += 1;
      if (apply) await prisma.lesson.update({ where: { id: l.id }, data: { transcript: hit.text, transcriptAuthorId: course.producerId } });
    }

    total += matched;
    console.log(`${apply ? "FEITO" : "PEND "} ${course.title}: sem transcricao=${todo.length}, casadas=${matched}, secoes=${sections.length}, sobras=${sections.length - used.size}`);
  }

  console.log("total casadas:", total);
  await prisma.$disconnect();
})();
