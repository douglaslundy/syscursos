// Restaura um backup gerado pelo botao "Backup" do painel admin.
// Uso: npm run db:restore -- arquivo.json.gz [--wipe]
// Pre-requisito: banco com o schema criado (npx prisma migrate deploy).
import { readFileSync } from "fs";
import { gunzipSync } from "zlib";

import { Prisma, PrismaClient } from "@prisma/client";

import { BACKUP_FORMAT, orderedModels } from "../src/server/services/backup-models";

type Backup = { format: string; createdAt: string; tables: Record<string, Array<Record<string, unknown>>> };
type CreateMany = { createMany: (args: { data: unknown[] }) => Promise<unknown> };

const CHUNK = 1000;
const prisma = new PrismaClient();

function revive(model: string, row: Record<string, unknown>) {
  const fields = Prisma.dmmf.datamodel.models.find((item) => item.name === model)?.fields ?? [];
  const data: Record<string, unknown> = { ...row };

  for (const field of fields) {
    const value = data[field.name];

    if (field.type === "DateTime" && typeof value === "string") data[field.name] = new Date(value);
    if (field.type === "Json" && value === null) data[field.name] = Prisma.DbNull;
  }

  return data;
}

async function main() {
  const [file, ...flags] = process.argv.slice(2);

  if (!file) {
    throw new Error("Informe o arquivo: npm run db:restore -- arquivo.json.gz [--wipe]");
  }

  const backup = JSON.parse(gunzipSync(readFileSync(file)).toString("utf8")) as Backup;

  if (backup.format !== BACKUP_FORMAT) {
    throw new Error(`Formato desconhecido: ${backup.format}`);
  }

  const models = orderedModels();
  const delegate = (name: string) =>
    (prisma as unknown as Record<string, CreateMany & { count: () => Promise<number> }>)[
      name.charAt(0).toLowerCase() + name.slice(1)
    ];

  if (flags.includes("--wipe")) {
    const tables = Prisma.dmmf.datamodel.models
      .filter((model) => models.includes(model.name))
      .map((model) => `"${model.dbName ?? model.name}"`)
      .join(", ");
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE`);
  } else {
    for (const name of models) {
      if ((await delegate(name).count()) > 0) {
        throw new Error(`Tabela ${name} nao esta vazia. Use --wipe para apagar tudo antes de restaurar.`);
      }
    }
  }

  await prisma.$transaction(
    async (tx) => {
      for (const name of models) {
        const rows = backup.tables[name] ?? [];
        const target = (tx as unknown as Record<string, CreateMany>)[name.charAt(0).toLowerCase() + name.slice(1)];

        for (let start = 0; start < rows.length; start += CHUNK) {
          await target.createMany({ data: rows.slice(start, start + CHUNK).map((row) => revive(name, row)) });
        }

        console.log(`${name}: ${rows.length}`);
      }
    },
    { timeout: 10 * 60 * 1000, maxWait: 60_000 },
  );

  console.log(`Backup de ${backup.createdAt} restaurado.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
