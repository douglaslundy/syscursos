import { prisma } from "@/lib/db/prisma";
import { requireStudentProfileId } from "@/server/services/student-service";
import { listAvailableCourses } from "@/server/services/study-access";
import { findTranscribableLesson } from "@/server/services/transcript-service";

const MAX_PLAYLISTS = 30;
const MAX_ITEMS = 200;

export async function listPlaylists() {
  const studentId = await requireStudentProfileId();
  const rows = await prisma.playlist.findMany({ where: { studentId }, orderBy: { createdAt: "desc" }, select: { id: true, name: true, _count: { select: { items: true } } } });

  return rows.map((row) => ({ id: row.id, name: row.name, items: row._count.items }));
}

export async function createPlaylist(name: string) {
  const studentId = await requireStudentProfileId();
  const clean = name.trim().slice(0, 120);

  if (!clean) return { ok: false as const, error: "invalid" as const };
  if ((await prisma.playlist.count({ where: { studentId } })) >= MAX_PLAYLISTS) return { ok: false as const, error: "limit" as const };

  const created = await prisma.playlist.create({ data: { studentId, name: clean }, select: { id: true } });

  return { ok: true as const, id: created.id };
}

export async function deletePlaylist(id: string) {
  const studentId = await requireStudentProfileId();

  return (await prisma.playlist.deleteMany({ where: { id, studentId } })).count > 0;
}

// Aulas da playlist em ordem; aulas de cursos que o aluno nao pode mais estudar somem da lista.
export async function getPlaylist(id: string) {
  const studentId = await requireStudentProfileId();
  const playlist = await prisma.playlist.findFirst({
    where: { id, studentId },
    select: {
      id: true,
      name: true,
      items: { orderBy: { position: "asc" }, select: { id: true, lesson: { select: { id: true, title: true, status: true, module: { select: { courseId: true, title: true } } } } } },
    },
  });

  if (!playlist) return null;

  const available = new Map((await listAvailableCourses(studentId)).map((course) => [course.id, course.title]));
  const items = playlist.items.flatMap((item) =>
    item.lesson.status === "ACTIVE" && available.has(item.lesson.module.courseId)
      ? [{ id: item.id, lessonId: item.lesson.id, courseId: item.lesson.module.courseId, title: item.lesson.title, courseTitle: available.get(item.lesson.module.courseId) ?? "" }]
      : [],
  );

  return { id: playlist.id, name: playlist.name, items };
}

export async function addToPlaylist(input: { playlistId: string; courseId: string; lessonId: string }) {
  const found = await findTranscribableLesson(input.courseId, input.lessonId);

  if (!found) return "forbidden" as const;

  const playlist = await prisma.playlist.findFirst({ where: { id: input.playlistId, studentId: found.studentId }, select: { id: true, _count: { select: { items: true } } } });

  if (!playlist) return "forbidden" as const;
  if (playlist._count.items >= MAX_ITEMS) return "limit" as const;

  const last = await prisma.playlistItem.findFirst({ where: { playlistId: playlist.id }, orderBy: { position: "desc" }, select: { position: true } });

  await prisma.playlistItem.upsert({
    where: { playlistId_lessonId: { playlistId: playlist.id, lessonId: input.lessonId } },
    create: { playlistId: playlist.id, lessonId: input.lessonId, position: (last?.position ?? 0) + 1 },
    update: {},
  });

  return "ok" as const;
}

export async function removeFromPlaylist(itemId: string) {
  const studentId = await requireStudentProfileId();

  return (await prisma.playlistItem.deleteMany({ where: { id: itemId, playlist: { studentId } } })).count > 0;
}

// Troca a posicao do item com o vizinho (cima/baixo).
export async function moveInPlaylist(itemId: string, direction: "up" | "down") {
  const studentId = await requireStudentProfileId();
  const item = await prisma.playlistItem.findFirst({ where: { id: itemId, playlist: { studentId } }, select: { id: true, playlistId: true, position: true } });

  if (!item) return false;

  const neighbor = await prisma.playlistItem.findFirst({
    where: { playlistId: item.playlistId, position: direction === "up" ? { lt: item.position } : { gt: item.position } },
    orderBy: { position: direction === "up" ? "desc" : "asc" },
    select: { id: true, position: true },
  });

  if (!neighbor) return false;

  await prisma.$transaction([
    prisma.playlistItem.update({ where: { id: item.id }, data: { position: neighbor.position } }),
    prisma.playlistItem.update({ where: { id: neighbor.id }, data: { position: item.position } }),
  ]);

  return true;
}
