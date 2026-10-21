import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

// A pagina da aula le 5+ configuracoes (metodo de transcricao, chaves, provedor de IA, tecnicas) a cada visita.
// Cache em memoria por instancia: leituras valem por 30 s e qualquer escrita feita por aqui limpa o cache.
// shortcut: outra instancia serverless pode servir o valor antigo por ate 30 s apos o admin salvar; aceitavel para configuracao.
const TTL_MS = 30_000;
const cache = new Map<string, { row: { value: string } | null; expires: number }>();

export const appSettings = {
  async findUnique(args: { where: { key: string } }) {
    const hit = cache.get(args.where.key);

    if (hit && hit.expires > Date.now()) return hit.row;

    const row = await prisma.appSetting.findUnique(args);

    cache.set(args.where.key, { row, expires: Date.now() + TTL_MS });
    return row;
  },
  async upsert(args: Prisma.AppSettingUpsertArgs) {
    try {
      return await prisma.appSetting.upsert(args);
    } finally {
      cache.clear();
    }
  },
  async deleteMany(args: Prisma.AppSettingDeleteManyArgs) {
    try {
      return await prisma.appSetting.deleteMany(args);
    } finally {
      cache.clear();
    }
  },
};
