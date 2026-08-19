import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl || process.env.NODE_ENV !== "production") {
    return databaseUrl;
  }

  try {
    const url = new URL(databaseUrl);

    if (!url.searchParams.has("connection_limit")) {
      // Supavisor (VPS) atende este tenant com default_pool_size=40 no modo
      // session. 5 por instancia da margem pra requisicoes concorrentes na
      // mesma instancia sem serializar tudo numa unica conexao (antes era 1).
      url.searchParams.set("connection_limit", "5");
    }

    return url.toString();
  } catch {
    return databaseUrl;
  }
}

function createPrismaClient() {
  const databaseUrl = getDatabaseUrl();

  if (!databaseUrl) {
    return new PrismaClient();
  }

  return new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });
}

export const prisma =
  globalForPrisma.prisma ?? createPrismaClient();

globalForPrisma.prisma = prisma;
