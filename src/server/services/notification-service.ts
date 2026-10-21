import { prisma } from "@/lib/db/prisma";

export type NotificationKind = "question_answered" | "question_new" | "study_reminder" | "certificate";

// Cria um aviso para um usuario. Falha de gravacao nao pode derrubar a acao que gerou o aviso.
export async function notifyUser(userId: string, input: { kind: NotificationKind; title: string; href?: string }) {
  try {
    await prisma.notification.create({ data: { userId, kind: input.kind, title: input.title.slice(0, 200), href: input.href?.slice(0, 300) ?? null } });
  } catch (error) {
    console.error("Failed to create notification.", { kind: input.kind, error: error instanceof Error ? error.message : String(error) });
  }
}

export async function countUnreadNotifications(userId: string) {
  return prisma.notification.count({ where: { userId, readAt: null } });
}

export async function listNotifications(userId: string, limit = 50) {
  const rows = await prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: limit });

  return rows.map((row) => ({ id: row.id, kind: row.kind, title: row.title, href: row.href, read: row.readAt !== null, createdAt: row.createdAt.toISOString() }));
}

export async function markAllNotificationsRead(userId: string) {
  await prisma.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
}
