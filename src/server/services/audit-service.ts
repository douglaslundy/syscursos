import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { requireAnyRole } from "@/server/auth/guards";

// Registra quem fez uma acao sensivel no painel. Nunca guarde segredos em `meta`. Falha de gravacao nao derruba a acao.
export async function recordAudit(action: string, entity: string, entityId?: string | null, meta: Prisma.InputJsonObject = {}) {
  try {
    const actor = await requireAnyRole(["ADMIN", "PRODUCER"]);

    await prisma.auditLog.create({
      data: { actorId: actor.id, actorRole: actor.role, action, entity, entityId: entityId ?? null, meta },
    });
  } catch (error) {
    console.error("Failed to record audit log.", { action, entity, error: error instanceof Error ? error.message : String(error) });
  }
}

export async function listAuditLogs(limit = 50) {
  await requireAnyRole(["ADMIN"]);

  return prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: limit });
}
