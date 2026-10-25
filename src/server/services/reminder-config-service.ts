import { prisma } from "@/lib/db/prisma";
import { computeSlots, dueReminder, type ReminderConfig } from "@/lib/study/reminder-slots";
import { requireStudentProfileId } from "@/server/services/student-service";

const MAX_BATCH = 200;

export async function getReminderConfig(): Promise<ReminderConfig & { slots: string[] }> {
  const studentId = await requireStudentProfileId();
  const row = await prisma.studentProfile.findUniqueOrThrow({
    where: { id: studentId },
    select: { reminderMode: true, reminderCount: true, reminderStart: true, reminderIntervalMin: true, reminderSlots: true },
  });
  const mode = row.reminderMode === "times" || row.reminderMode === "interval" ? row.reminderMode : "off";

  return { mode, count: row.reminderCount, start: row.reminderStart, intervalMin: row.reminderIntervalMin, times: row.reminderSlots, slots: row.reminderSlots };
}

export async function saveReminderConfig(config: ReminderConfig) {
  const slots = computeSlots(config);

  if (slots === null) return "invalid" as const;

  const studentId = await requireStudentProfileId();

  await prisma.studentProfile.update({
    where: { id: studentId },
    data: { reminderMode: config.mode, reminderCount: config.count, reminderStart: config.start, reminderIntervalMin: config.intervalMin, reminderSlots: slots, reminderLastSent: null },
  });
  return "saved" as const;
}

// Para o gateway do agente: lembretes que vencem agora, com o telefone do WhatsApp vinculado. Marca como enviado
// antes de devolver (um horario nunca sai duas vezes, mesmo com duas consultas ao mesmo tempo).
export async function collectDueAgentReminders(now = new Date()) {
  const rows = await prisma.studentProfile.findMany({
    where: { reminderMode: { not: "off" }, whatsappPhone: { not: null }, NOT: { reminderSlots: { isEmpty: true } } },
    select: { id: true, whatsappPhone: true, reminderSlots: true, reminderLastSent: true },
    take: MAX_BATCH * 5,
  });
  const out: Array<{ phone: string; text: string }> = [];

  for (const row of rows) {
    const key = dueReminder(row.reminderSlots, now, row.reminderLastSent);

    if (!key || !row.whatsappPhone || out.length >= MAX_BATCH) continue;

    const claimed = await prisma.studentProfile.updateMany({ where: { id: row.id, OR: [{ reminderLastSent: null }, { reminderLastSent: { lt: key } }] }, data: { reminderLastSent: key } });

    if (claimed.count === 0) continue;

    const due = await prisma.flashcardReview.count({ where: { studentId: row.id, dueAt: { lte: now } } });

    out.push({
      phone: row.whatsappPhone,
      text: due > 0 ? `Hora de estudar! Você tem ${due} ${due === 1 ? "cartão" : "cartões"} para revisar hoje. Me chame pelo nome para começar o quiz ou a revisão.` : "Hora de estudar! Me chame pelo nome para fazer um quiz ou ver seus cursos.",
    });
  }

  return out;
}
