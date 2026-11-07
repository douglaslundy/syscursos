import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";

export type PdfSeed = { title: string; url: string };
export type LessonSeed = { title: string; url: string; isPdf: boolean; pdfs: PdfSeed[]; transcript?: string };
export type ModuleSeed = { title: string; lessons: LessonSeed[] };
export type CourseSeed = { title: string; modules: ModuleSeed[] };

const CATALOG_DIR = "C:\\Users\\dougl\\Desktop\\cursos";
const SKIP_MODULES = [/^materiais gerais$/i, /^\.transcriber-cache$/i];

const cleanTitle = (value: string) => value.replace(/^\d+[.)]\s*/, "").replace(/\s+/g, " ").trim().slice(0, 180);
export const norm = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/^[\d\s.)\-_]+/, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export function parseCatalog(text: string): CourseSeed {
  const lines = text.split(/\r?\n/);
  const course: CourseSeed = { title: "", modules: [] };
  let mod: ModuleSeed | null = null;
  let skipping = false;
  let pasta: { title: string; lessons: LessonSeed[] } | null = null;
  let prev: LessonSeed | null = null; // aula imediatamente anterior (sem linha em branco)
  let adjacent = false;

  const urlAt = (i: number) => (/^https:\/\/drive\.google\.com\/file\/d\/[^/]+\/view$/.test(lines[i + 1]?.trim() ?? "") ? lines[i + 1].trim() : null);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      adjacent = false;
      continue;
    }
    if (line.startsWith("CURSO:")) {
      course.title = line.slice(6).trim();
    } else if (/^M.DULO:/.test(line)) {
      const title = cleanTitle(line.replace(/^M.DULO:/, ""));
      skipping = SKIP_MODULES.some((re) => re.test(title));
      mod = skipping ? null : { title, lessons: [] };
      if (mod) course.modules.push(mod);
      pasta = null;
      prev = null;
    } else if (line.startsWith("PASTA:")) {
      pasta = { title: cleanTitle(line.slice(6)), lessons: [] };
      prev = null;
    } else if (line.startsWith("[pdf]")) {
      const url = urlAt(i);
      if (!mod || !url) continue;
      const title = line.slice(5).trim();
      const owner = pasta?.lessons.find((l) => !l.isPdf) ?? (!pasta && adjacent ? prev : null);
      if (owner) owner.pdfs.push({ title, url });
      else {
        const lesson: LessonSeed = { title: cleanTitle(title), url, isPdf: true, pdfs: [] };
        mod.lessons.push(lesson);
        pasta?.lessons.push(lesson);
      }
      i++;
    } else if (/^\d+\.\s/.test(line) && urlAt(i)) {
      if (!mod) continue;
      const videoTitle = cleanTitle(line);
      const lesson: LessonSeed = { title: videoTitle, url: urlAt(i)!, isPdf: false, pdfs: [] };
      if (pasta) {
        const siblings = pasta.lessons.filter((l) => !l.isPdf);
        if (siblings.length === 0) {
          lesson.title = pasta.title;
          // pdf avulso ja criado como aula nesta pasta vira material
          for (const pdfLesson of pasta.lessons.filter((l) => l.isPdf)) {
            lesson.pdfs.push({ title: pdfLesson.title, url: pdfLesson.url });
            mod.lessons.splice(mod.lessons.indexOf(pdfLesson), 1);
          }
          pasta.lessons = [];
        } else {
          if (siblings.length === 1) siblings[0].title = `${pasta.title} - ${siblings[0].title}`.slice(0, 180);
          lesson.title = `${pasta.title} - ${videoTitle}`.slice(0, 180);
        }
        pasta.lessons.push(lesson);
      }
      mod.lessons.push(lesson);
      prev = lesson;
      adjacent = true;
      i++;
    }
  }
  course.modules = course.modules.filter((m) => m.lessons.length > 0);
  return course;
}

type Section = { module: string; lesson: string; text: string };

// Dois formatos: "--- AULA: x ---" sob "MODULO: y" e "--- Modulo -> pasta -> aula ---".
export function parseTranscript(text: string): Section[] {
  const out: Section[] = [];
  let module = "";
  let current: Section | null = null;
  const flush = () => {
    if (current && current.text.trim()) out.push({ ...current, text: current.text.trim() });
    current = null;
  };
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    let m: RegExpMatchArray | null;
    if ((m = line.match(/^={5,} (.+) ={5,}$/))) {
      flush();
      module = m[1].trim();
    } else if ((m = line.match(/^--- (Aula .+?) ---$/))) {
      flush();
      current = { module, lesson: m[1], text: "" };
    } else if ((m = line.match(/^M.DULO:\s*(.+)$/i))) {
      flush();
      module = m[1].trim();
    } else if ((m = line.match(/^--- AULA:\s*(.+?)\s*---$/))) {
      flush();
      current = { module, lesson: m[1], text: "" };
    } else if ((m = line.match(/^--- (.+) ---$/)) && m[1].includes(" -> ")) {
      flush();
      const parts = m[1].split(" -> ");
      current = { module: parts[0], lesson: parts[parts.length - 1], text: "" };
    } else if (current && !/^={5,}$/.test(line)) {
      current.text += raw + "\n";
    }
  }
  flush();
  return out;
}

export function loadAll() {
  return readdirSync(CATALOG_DIR)
    .filter((f) => f.endsWith(".txt") && !f.startsWith("PROMPT"))
    .map((f) => ({ file: f, course: parseCatalog(readFileSync(path.join(CATALOG_DIR, f), "utf8")) }));
}

export { CATALOG_DIR, existsSync };

if (process.argv[1]?.endsWith("import-drive-courses.ts") && process.argv.includes("--dry")) {
  for (const { file, course } of loadAll()) {
    const lessons = course.modules.flatMap((m) => m.lessons);
    console.log(`${course.title} | ${file}: ${course.modules.length} mod, ${lessons.length} aulas (${lessons.filter((l) => l.isPdf).length} pdf-aula), ${lessons.reduce((n, l) => n + l.pdfs.length, 0)} pdfs-material`);
    if (process.argv.includes("--v")) for (const m of course.modules) { console.log("  M", m.title); for (const l of m.lessons) console.log("    -", l.title, l.isPdf ? "[PDF]" : "", l.pdfs.length ? `(+${l.pdfs.length}pdf)` : ""); }
  }
}

export const TRANSCRIPT_FILES: Record<string, string> = {
  "Aprenda Desenhar do Zero": "Aprenda a Desenhar do Zero/Aprenda a Desenhar do Zero.txt",
  "Curso Memoria 360 - Renato Alves": "Curso Memória 360º [Renato Alves]/Curso Memória 360º [Renato Alves].txt",
  "Dicção - Aprenda Falar Bem": "Aprenda a falar bem diccao/TRANSCRICAO - Aprenda a falar bem diccao.txt",
  "Hamburgueria Artesanal": "Curso Hamburgueria Artesanal - Bruno Salomao/TRANSCRICAO - Curso Hamburgueria Artesanal - Bruno Salomao.txt",
  "Inteligência Pessoal - Como se conectar as pessoas": "Inteligencia Social Como se conectar e convencer pessoas/TRANSCRICAO - Inteligencia Social Como se conectar e convencer pessoas.txt",
  "Pegada Assertiva": "Leticia Felisberto-Pegada Assertiva/Leticia Felisberto-Pegada Assertiva.txt",
};
const DRIVE_DIR = "G:/Meu Drive/CURSOS";

// Casa cada aula em video com uma secao da transcricao (modulo+aula normalizados, depois so aula, em ordem).
export function attachTranscripts(course: CourseSeed, sections: Section[]) {
  const used = new Set<Section>();
  const missing: string[] = [];
  for (const mod of course.modules) {
    for (const lesson of mod.lessons.filter((l) => !l.isPdf)) {
      const ln = norm(lesson.title);
      const mn = norm(mod.title);
      const pick = (f: (s: Section) => boolean) => sections.find((s) => !used.has(s) && f(s));
      const hit =
        pick((s) => norm(s.lesson) === ln && norm(s.module) === mn) ??
        pick((s) => norm(s.lesson) === ln) ??
        pick((s) => (ln.includes(norm(s.lesson)) || norm(s.lesson).includes(ln)) && norm(s.lesson).length > 3);
      if (hit) {
        used.add(hit);
        lesson.transcript = hit.text;
      } else missing.push(`${mod.title} / ${lesson.title}`);
    }
  }
  return { missing, unused: sections.filter((s) => !used.has(s)).map((s) => `${s.module} / ${s.lesson}`) };
}

export function loadTranscript(title: string) {
  const rel = TRANSCRIPT_FILES[title];
  return rel ? parseTranscript(readFileSync(path.join(DRIVE_DIR, rel), "utf8")) : null;
}

if (process.argv[1]?.endsWith("import-drive-courses.ts") && process.argv.includes("--match")) {
  for (const { course } of loadAll()) {
    const sec = loadTranscript(course.title);
    if (!sec) continue;
    const r = attachTranscripts(course, sec);
    const vids = course.modules.flatMap((m) => m.lessons).filter((l) => !l.isPdf).length;
    console.log(`${course.title}: ${vids - r.missing.length}/${vids} aulas c/ transcricao; secoes=${sec.length} sobras=${r.unused.length}`);
    r.missing.slice(0, 6).forEach((m) => console.log("   falta:", m));
    r.unused.slice(0, 4).forEach((m) => console.log("   sobra:", m));
  }
}

const TITLE_FIX: Record<string, string> = {
  "Resiliiência e Anti-Fragilidade - Joel Jota": "Resiliência e Anti-Fragilidade - Joel Jota",
  "Inteligência Pessoal - Como se conectar as pessoas": "Inteligência Social - Como se conectar e convencer pessoas",
  "Ginastia Intima Pompoarismo": "Ginástica Íntima Pompoarismo",
  "Curso Memoria 360 - Renato Alves": "Curso Memória 360º - Renato Alves",
  "Aprenda Desenhar do Zero": "Aprenda a Desenhar do Zero",
  "Dicção - Aprenda Falar Bem": "Dicção - Aprenda a Falar Bem",
};
const slugify = (s: string) => norm(s).replace(/ /g, "-").slice(0, 190);

async function run() {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  const apply = process.argv.includes("--run");
  const producer = await prisma.user.findFirstOrThrow({ where: { email: "douglaslundy@gmail.com", role: "PRODUCER", status: "ACTIVE" } });
  const student = await prisma.studentProfile.findFirstOrThrow({ where: { user: { email: "douglaslundy100@gmail.com" } } });
  const startsAt = new Date();
  const expiresAt = new Date(startsAt);
  expiresAt.setMonth(expiresAt.getMonth() + 12);
  const report: string[] = [];

  for (const { course } of loadAll()) {
    const sections = loadTranscript(course.title);
    if (sections) attachTranscripts(course, sections);
    const lessons = course.modules.flatMap((m) => m.lessons);
    const urls = lessons.map((l) => l.url);
    const dup = await prisma.lesson.count({ where: { youtubeUrl: { in: urls } } });
    const title = TITLE_FIX[course.title] ?? course.title;
    if (dup > 0) {
      report.push(`SKIP ${title}: ${dup} aulas ja cadastradas`);
      continue;
    }
    const slug = slugify(title);
    if (await prisma.course.findUnique({ where: { slug } })) {
      report.push(`SKIP ${title}: slug ${slug} existe`);
      continue;
    }
    const videos = lessons.filter((l) => !l.isPdf);
    const withT = videos.filter((l) => l.transcript).length;
    report.push(`${apply ? "OK" : "DRY"} ${title}: ${course.modules.length} mod, ${lessons.length} aulas, transcricao ${withT}/${videos.length}`);
    if (!apply) continue;

    await prisma.$transaction(
      async (tx) => {
        const c = await tx.course.create({ data: { title, slug, status: "ACTIVE", organizationId: producer.organizationId, producerId: producer.id }, select: { id: true } });
        for (const [mi, m] of course.modules.entries()) {
          const mod = await tx.module.create({ data: { courseId: c.id, title: m.title, position: mi + 1, status: "ACTIVE" }, select: { id: true } });
          for (const [li, l] of m.lessons.entries()) {
            await tx.lesson.create({
              data: {
                moduleId: mod.id,
                title: l.title,
                position: li + 1,
                status: "ACTIVE",
                youtubeUrl: l.url,
                transcript: l.transcript ?? null,
                transcriptAuthorId: l.transcript ? producer.id : null,
                materials: { create: l.pdfs.map((p, pi) => ({ type: "PDF" as const, title: p.title.slice(0, 180), url: p.url, position: pi + 1 })) },
              },
            });
          }
        }
        await tx.enrollment.create({ data: { studentId: student.id, courseId: c.id, startsAt, expiresAt, status: "ACTIVE" } });
      },
      { timeout: 120_000 },
    );
  }
  console.log(report.join("\n"));
  await prisma.$disconnect();
}

if (process.argv[1]?.endsWith("import-drive-courses.ts") && (process.argv.includes("--run") || process.argv.includes("--plan"))) {
  run().catch((e) => {
    console.error(e);
    process.exitCode = 1;
  });
}
