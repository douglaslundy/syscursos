import { readFileSync, writeFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

const [treeFile, transcriptFile, catalogOut] = process.argv.slice(2);
const COURSE_ID = "3bdafdfc-fa97-4b13-bd71-ba37684f6b87";
const nfc = (s: string) => s.normalize("NFC");
const link = (id: string) => `https://drive.google.com/file/d/${id}/view`;
const strip = (s: string) => s.replace(/^\s*\d+\s*-\s*/, "");

type Node = { path: string[]; name: string; id: string };
const tree = (JSON.parse(readFileSync(treeFile, "utf8")) as Node[]).filter((n) => !n.path.includes(".transcriber-cache"));
const videos = tree.filter((n) => /\.mp4$/i.test(n.name));
const others = tree.filter((n) => !/\.mp4$/i.test(n.name));

// transcricao: "--- a -> b -> c ---" => texto
const raw = readFileSync(transcriptFile, "utf8").replace(/\r/g, "");
const transcripts = new Map<string, string>();
for (const part of raw.split(/^--- (.+) ---$/m).slice(1).reduce<string[][]>((a, v, i, arr) => (i % 2 === 0 ? [...a, [v, arr[i + 1] ?? ""]] : a), [])) {
  transcripts.set(nfc(part[0]), part[1].trim());
}

type L = { module: string; title: string; url: string; text: string | undefined; key: string };
const lessons: L[] = videos.map((v) => {
  const leaf = nfc(v.name.replace(/\.mp4$/i, ""));
  const parts = v.path.map(nfc);
  const key = (parts.length ? parts : ["(raiz)"]).concat(leaf).join(" -> ");
  const mod = parts.length ? strip(parts[0].replace(/^M[óo]dulo\s*\d+\s*-\s*/i, "")) : "Comece Por Aqui";
  const groups = parts.slice(1).map(strip);
  const same = groups.length && groups[groups.length - 1].toLowerCase() === leaf.toLowerCase();
  const title = (groups.length ? groups.join(" - ") + (same ? "" : " -- " + leaf) : leaf).slice(0, 180);
  return { module: mod, title, url: link(v.id), text: transcripts.get(nfc(key)), key };
});
const missing = lessons.filter((l) => !l.text);
const orphan = [...transcripts.keys()].filter((k) => !lessons.some((l) => nfc(l.key) === k));
console.log("videos", videos.length, "secoes", transcripts.size, "sem transcricao", missing.length, "secoes sem video", orphan.length);
missing.slice(0, 5).forEach((m) => console.log("  sem:", m.key));
orphan.slice(0, 5).forEach((m) => console.log("  orfa:", m));

const mods = [...new Set(["Comece Por Aqui", ...lessons.map((l) => l.module)])];
const cat = [`CURSO: Curso Master - O Cara da Foto`, ""];
for (const m of mods) {
  cat.push(`MÓDULO: ${m}`, "");
  for (const l of lessons.filter((x) => x.module === m)) cat.push(l.title, l.url, "");
}
for (const o of others) cat.push(`[exceção] Arquivo auxiliar "${nfc(o.name)}" em ${o.path.map(nfc).join("/") || "(raiz)"}`, link(o.id), "");
writeFileSync(catalogOut, cat.join("\n"), "utf8");

(async () => {
  if (!process.argv.includes("--run")) return;
  const prisma = new PrismaClient();
  const course = await prisma.course.findUniqueOrThrow({ where: { id: COURSE_ID }, select: { producerId: true } });
  await prisma.$transaction(async (tx) => {
    await tx.module.deleteMany({ where: { courseId: COURSE_ID } });
    for (const [mi, m] of mods.entries()) {
      const mod = await tx.module.create({ data: { courseId: COURSE_ID, title: m, position: mi + 1, status: "ACTIVE" }, select: { id: true } });
      const ls = lessons.filter((x) => x.module === m);
      for (const [li, l] of ls.entries()) {
        await tx.lesson.create({ data: { moduleId: mod.id, title: l.title, youtubeUrl: l.url, position: li + 1, status: "ACTIVE", transcript: l.text ?? null, transcriptAuthorId: l.text ? course.producerId : null } });
      }
    }
  }, { timeout: 120000 });
  console.log("gravado");
  await prisma.$disconnect();
})();
