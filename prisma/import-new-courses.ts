// Cadastra cursos do Drive que faltam na plataforma, a partir da arvore dumpada do DriveFS (all.json).
// Uso: node --env-file=.env node_modules/tsx/dist/cli.mjs prisma/import-new-courses.ts <all.json> [--run]
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

import { norm, parseTranscript } from "./import-drive-courses";

type Node = { path: string[]; name: string; id: string };
type Pdf = { title: string; url: string; type?: "PDF" | "LINK" };
type Lesson = { title: string; url: string; isPdf: boolean; pdfs: Pdf[]; transcript?: string; sortKey: string; leaf: string };
type Module = { title: string; folder: string; lessons: Lesson[] };

const DRIVE_DIR = "G:/Meu Drive/CURSOS";
const CATALOG_DIR = "C:\\Users\\dougl\\Desktop\\cursos";
const VIDEO = /\.(mp4|mov|mkv|avi|webm|m4v|ts)$/i;
const PDF = /\.pdf$/i;
const AUDIO = /\.(mp3|m4a)$/i;
const ROOT_MODULE = "Aulas";

// Pasta do Drive (trecho ASCII do nome) -> titulo na plataforma.
const COURSES: Array<[string, string]> = [
  ["Academia da Mem", "Academia da Memória + Memória Total - Ana Lopes"],
  ["Aprenda jogar poker do zero", "Aprenda a Jogar Poker do Zero"],
  ["BARBEIRO PROFISIONAL 3.0", "Barbeiro Profissional 3.0"],
  ["Big Bang", "Big Bang - Astronomia Para Leigos e Apressados - Sérgio Sacani"],
  ["CURSO GEAZI BARBEIRO", "Curso Geazi Barbeiro"],
  ["Cadernos de Autoconhecimento", "Cadernos de Autoconhecimento"],
  ["Operação de Drones", "Operação de Drones - AvMakers"],
  ["Redação ENEM", "Redação ENEM"],
  ["Curso de DJ Profissional", "Curso de DJ Profissional"],
  ["Desenho Artístico", "Desenho Artístico - ABRA EAD"],
  ["Massagem Tântrica", "Massagem Tântrica"],
  ["Código Reverso", "Código Reverso - Método Estudo Reverso - Reverso Academy [2024]"],
  ["Descomplica Drone", "Descomplica Drone"],
  ["Imã de Mulheres", "Fórmula Imã de Mulheres - Vitor Flores"],
  ["Hacker Iniciante", "Hacker Iniciante"],
  ["Laboratorio de Alta Performance", "Laboratório de Alta Performance - Capivara Team"],
  ["Massagem Nuru", "Massagem Nuru"],
  ["Neurociencia Descomplicada", "Neurociência Descomplicada"],
  ["Só Pudim", "O Fantástico Guia da Só Pudim - Chef Sollon e Daniel Praxedes"],
  ["PoxaLulu", "PoxaLulu"],
  ["Profissao Hacker", "Profissão Hacker - Gustavo Celani"],
  ["Projeto 60 Dias", "Projeto 60 Dias"],
  ["Protocol Mass", "Protocol Mass - Laércio Refundini"],
  ["React Native", "React Native"],
  ["Tecnicas de Invasao em Redes Sem Fios", "Técnicas de Invasão em Redes Sem Fios"],
  ["Hacker em Redes Wi-Fi", "Técnicas Hacker em Redes Wi-Fi (completo)"],
  ["Viver de Lançamentos", "Viver de Lançamentos - Karyne Otto"],
  ["WKT MILITAR", "WKT Militar"],
  ["xadrez esssencial", "Xadrez Essencial"],
  ["Libras Intensive", "Libras Intensive - Libras Academy"],
  ["MARTE - DESVENDANDO", "Marte - Desvendando os Mistérios do Planeta Vermelho - Sérgio Sacani"],
  ["Mitologia Nórdica", "Mitologia Nórdica - Neil Gaiman (by Analytic)"],
];

const nfc = (s: string) => s.normalize("NFC");
const link = (id: string) => `https://drive.google.com/file/d/${id}/view`;
const nat = (a: string, b: string) => a.localeCompare(b, "pt", { numeric: true, sensitivity: "base" });
const stem = (name: string) => nfc(name).replace(/\.[^.]{1,5}$/, "").replace(/\s+/g, " ").trim();
const slugify = (s: string) => norm(s).replace(/ /g, "-").slice(0, 190);

function build(files: Node[]): { modules: Module[]; exceptions: Node[] } {
  // Arquivos soltos na raiz com prefixo "NN.MMM" (ex.: Libras) viram um modulo por NN.
  const visible = files
    .filter((f) => !f.path.some((p) => p.startsWith(".")))
    .map((f) => ({ ...f, path: f.path.length === 0 && /^\d{2}\.\d+/.test(f.name) ? [`Módulo ${f.name.slice(0, 2)}`] : f.path }));
  const exceptions = visible.filter((f) => !VIDEO.test(f.name) && !PDF.test(f.name) && !AUDIO.test(f.name));
  const byFolder = new Map<string, Node[]>();

  for (const f of visible.filter((f) => VIDEO.test(f.name) || PDF.test(f.name) || AUDIO.test(f.name))) {
    const key = f.path.map(nfc).join("/");
    byFolder.set(key, [...(byFolder.get(key) ?? []), f]);
  }

  const modules = new Map<string, Module>();
  const seen = new Set<string>();

  for (const [folder, nodes] of byFolder) {
    const parts = folder ? folder.split("/") : [];
    const top = parts[0] ?? ROOT_MODULE;
    const groups = parts.slice(1);
    const videos = nodes.filter((n) => VIDEO.test(n.name));
    const pdfs = nodes.filter((n) => PDF.test(n.name));
    const audios = nodes.filter((n) => AUDIO.test(n.name));
    const mod = modules.get(top) ?? { title: top.replace(/^\d+[.)]\s*/, "").slice(0, 180) || top, folder: top, lessons: [] };
    modules.set(top, mod);

    const make = (n: Node, isPdf: boolean): Lesson => {
      const leaf = stem(n.name);
      const same = groups.length > 0 && norm(groups[groups.length - 1]) === norm(leaf);
      const title = (groups.length ? groups.join(" - ") + (same ? "" : " - " + leaf) : leaf).slice(0, 180);
      return { title, url: link(n.id), isPdf, pdfs: [], sortKey: `${folder}/${nfc(n.name)}`, leaf };
    };

    const lessons = videos.filter((v) => !seen.has(v.id)).map((v) => (seen.add(v.id), make(v, false)));

    for (const p of pdfs.filter((p) => !seen.has(p.id))) {
      seen.add(p.id);
      const owner = lessons.find((l) => l.leaf.toLowerCase() === stem(p.name).toLowerCase()) ?? lessons.find((l) => norm(l.leaf) === norm(stem(p.name))) ??(lessons.length === 1 ? lessons[0] : undefined);

      if (owner) owner.pdfs.push({ title: stem(p.name).slice(0, 180), url: link(p.id) });
      else lessons.push(make(p, true));
    }

    // Audio: vira material (link) da aula de mesmo numero ("07.042a Verbos 2" -> "07.042 Verbos 2"); sem dono, vira aula.
    for (const a of audios.filter((a) => !seen.has(a.id))) {
      seen.add(a.id);
      const key = stem(a.name).replace(/^(\d+\.\d+)[a-z]/i, "$1").toLowerCase();
      const owner = lessons.find((l) => !l.isPdf && l.leaf.toLowerCase() === key) ?? lessons.find((l) => !l.isPdf && norm(l.leaf) === norm(key));

      if (owner) owner.pdfs.push({ title: `Áudio - ${stem(a.name)}`.slice(0, 180), url: link(a.id), type: "LINK" });
      else lessons.push(make(a, false));
    }

    mod.lessons.push(...lessons);
  }

  const ordered = [...modules.values()].filter((m) => m.lessons.length > 0).sort((a, b) => nat(a.folder, b.folder));

  for (const m of ordered) m.lessons.sort((a, b) => nat(a.sortKey, b.sortKey));

  return { modules: ordered, exceptions };
}

// Casa cada aula em video com uma secao da transcricao: modulo+aula, depois so a aula, na ordem do arquivo.
function attach(modules: Module[], rootFiles: string[], folder: string) {
  const file = rootFiles.find((f) => /^TRANSCRICAO/i.test(f)) ?? rootFiles.find((f) => /\.txt$/i.test(f) && !/leia|relatorio|^LEIA/i.test(f));

  if (!file) return { sections: 0, matched: 0, videos: modules.flatMap((m) => m.lessons).filter((l) => !l.isPdf).length };

  const sections = parseTranscript(readFileSync(path.join(DRIVE_DIR, folder, file), "utf8"));
  const used = new Set<(typeof sections)[number]>();
  let matched = 0;

  for (const m of modules) {
    for (const l of m.lessons.filter((x) => !x.isPdf)) {
      const ln = norm(l.leaf);
      const mn = norm(m.title);
      const pick = (f: (s: (typeof sections)[number]) => boolean) => sections.find((s) => !used.has(s) && f(s));
      const hit = pick((s) => norm(s.lesson) === ln && norm(s.module) === mn) ?? pick((s) => norm(s.lesson) === ln) ?? pick((s) => norm(l.title) === norm(s.lesson));

      if (hit) {
        used.add(hit);
        l.transcript = hit.text;
        matched += 1;
      }
    }
  }

  return { sections: sections.length, matched, videos: modules.flatMap((m) => m.lessons).filter((l) => !l.isPdf).length };
}

function catalog(title: string, modules: Module[], exceptions: Node[]) {
  const out = [`CURSO: ${title}`, ""];

  for (const m of modules) {
    out.push(`MÓDULO: ${m.title}`, "");

    for (const l of m.lessons) {
      out.push(l.isPdf ? `[pdf] ${l.title}` : l.title, l.url);
      for (const p of l.pdfs) out.push(`[pdf] ${p.title}`, p.url);
      out.push("");
    }
  }

  for (const e of exceptions) out.push(`[exceção] Arquivo auxiliar "${nfc(e.name)}" em ${e.path.map(nfc).join("/") || "(raiz)"}`, link(e.id), "");
  return out.join("\n");
}

(async () => {
  const all = JSON.parse(readFileSync(process.argv[2], "utf8")) as Record<string, Node[]>;
  const apply = process.argv.includes("--run");
  const prisma = new PrismaClient();
  const producer = await prisma.user.findFirstOrThrow({ where: { email: "douglaslundy@gmail.com", role: "PRODUCER", status: "ACTIVE" } });
  const student = await prisma.studentProfile.findFirstOrThrow({ where: { user: { email: "douglaslundy100@gmail.com" } } });
  const startsAt = new Date();
  const expiresAt = new Date(startsAt);
  expiresAt.setMonth(expiresAt.getMonth() + 12);

  for (const [needle, title] of COURSES) {
    const folder = Object.keys(all).find((k) => nfc(k).includes(needle));

    if (!folder) {
      console.log(`SEM PASTA ${title}`);
      continue;
    }

    const { modules, exceptions } = build(all[folder]);
    const lessons = modules.flatMap((m) => m.lessons);
    const dup = await prisma.lesson.count({ where: { youtubeUrl: { in: lessons.map((l) => l.url) } } });
    const slug = slugify(title);

    if (dup > 0 || (await prisma.course.findUnique({ where: { slug } }))) {
      console.log(`SKIP ${title}: ja existe (${dup} aulas, slug ${slug})`);
      continue;
    }

    const rootFiles = existsSync(path.join(DRIVE_DIR, folder)) ? readdirSync(path.join(DRIVE_DIR, folder)).filter((f) => /\.txt$/i.test(f)) : [];
    const t = attach(modules, rootFiles, folder);
    const pdfAulas = lessons.filter((l) => l.isPdf).length;
    const materials = lessons.reduce((n, l) => n + l.pdfs.length, 0);

    console.log(`${apply ? "OK " : "DRY"} ${title}: ${modules.length} mod, ${lessons.length} aulas (${pdfAulas} pdf-aula, ${materials} pdf-material), transcricao ${t.matched}/${t.videos} (secoes ${t.sections}), excecoes ${exceptions.length}`);
    writeFileSync(path.join(CATALOG_DIR, `${title.replace(/[\\/:*?"<>|]/g, "")}.txt`), catalog(title, modules, exceptions), "utf8");

    if (!apply) continue;

    await prisma.$transaction(
      async (tx) => {
        const c = await tx.course.create({ data: { title, slug, status: "ACTIVE", organizationId: producer.organizationId, producerId: producer.id }, select: { id: true } });

        for (const [mi, m] of modules.entries()) {
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
                materials: { create: l.pdfs.map((p, pi) => ({ type: p.type ?? ("PDF" as const), title: p.title, url: p.url, position: pi + 1 })) },
              },
            });
          }
        }

        await tx.enrollment.create({ data: { studentId: student.id, courseId: c.id, startsAt, expiresAt, status: "ACTIVE" } });
      },
      { timeout: 300_000 },
    );
  }

  await prisma.$disconnect();
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
