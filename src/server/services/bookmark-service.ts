import { prisma } from "@/lib/db/prisma";
import { requireStudentProfileId } from "@/server/services/student-service";
import { findTranscribableLesson } from "@/server/services/transcript-service";

const MAX_BOOKMARKS_PER_LESSON = 100;

export type BookmarkItem = { id: string; seconds: number; label: string };

export async function listBookmarks(studentId: string, lessonId: string): Promise<BookmarkItem[]> {
  const rows = await prisma.lessonBookmark.findMany({ where: { studentId, lessonId }, orderBy: { seconds: "asc" }, select: { id: true, seconds: true, label: true } });

  return rows;
}

export async function addBookmark(input: { courseId: string; lessonId: string; seconds: number; label: string }) {
  const found = await findTranscribableLesson(input.courseId, input.lessonId);
  const label = input.label.trim().slice(0, 200);

  if (!found || !label) return { ok: false as const, error: "invalid" as const };

  const count = await prisma.lessonBookmark.count({ where: { studentId: found.studentId, lessonId: input.lessonId } });

  if (count >= MAX_BOOKMARKS_PER_LESSON) return { ok: false as const, error: "limit" as const };

  const created = await prisma.lessonBookmark.create({
    data: { studentId: found.studentId, lessonId: input.lessonId, seconds: Math.max(0, Math.round(input.seconds)), label },
    select: { id: true, seconds: true, label: true },
  });

  return { ok: true as const, bookmark: created };
}

// So apaga marcador do proprio aluno.
export async function removeBookmark(id: string) {
  const studentId = await requireStudentProfileId();
  const result = await prisma.lessonBookmark.deleteMany({ where: { id, studentId } });

  return result.count > 0;
}

// Guarda o minuto em que o aluno parou para retomar depois. Nunca volta uma aula concluida para "nao iniciada".
export async function savePosition(input: { courseId: string; lessonId: string; seconds: number }) {
  const found = await findTranscribableLesson(input.courseId, input.lessonId);

  if (!found) return false;

  const positionSeconds = Math.max(0, Math.round(input.seconds));

  await prisma.lessonProgress.upsert({
    where: { studentId_lessonId: { studentId: found.studentId, lessonId: input.lessonId } },
    update: { positionSeconds },
    create: { studentId: found.studentId, lessonId: input.lessonId, status: "NOT_STARTED", positionSeconds },
  });

  return true;
}
