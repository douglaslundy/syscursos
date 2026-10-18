import { gzipSync } from "zlib";

import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/server/auth/guards";
import { BACKUP_FORMAT, orderedModels } from "@/server/services/backup-models";

type Delegate = { findMany: () => Promise<unknown[]> };

export async function createBackup() {
  await requireRole("ADMIN");
  const tables: Record<string, unknown[]> = {};

  for (const name of orderedModels()) {
    const delegate = (prisma as unknown as Record<string, Delegate>)[name.charAt(0).toLowerCase() + name.slice(1)];
    tables[name] = await delegate.findMany();
  }

  const migrations = await prisma.$queryRaw<Array<{ migration_name: string }>>`
    select migration_name from _prisma_migrations where finished_at is not null order by migration_name`;
  const counts = Object.fromEntries(Object.entries(tables).map(([name, rows]) => [name, rows.length]));
  const payload = {
    format: BACKUP_FORMAT,
    createdAt: new Date().toISOString(),
    migrations: migrations.map((row) => row.migration_name),
    counts,
    tables,
  };

  return gzipSync(Buffer.from(JSON.stringify(payload)));
}
