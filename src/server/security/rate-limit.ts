import { headers } from "next/headers";

import { prisma } from "@/lib/db/prisma";

// `hit` conta em memoria (por instancia serverless) e serve de reserva; `hitGlobal` conta no banco e vale para todas as instancias.
const buckets = new Map<string, number[]>();
const MAX_KEYS = 5_000;

export function hit(key: string, max: number, windowMs: number, now = Date.now()) {
  const recent = (buckets.get(key) ?? []).filter((time) => now - time < windowMs);

  if (recent.length >= max) {
    buckets.set(key, recent);
    return false;
  }

  if (buckets.size >= MAX_KEYS) buckets.clear();
  buckets.set(key, [...recent, now]);
  return true;
}

// Limite global no banco. Se o banco falhar, cai no contador em memoria para nao travar o login.
// shortcut: contar e inserir nao e atomico, entao rajadas simultaneas podem passar do limite por alguns pedidos.
export async function hitGlobal(key: string, max: number, windowMs: number) {
  try {
    const since = new Date(Date.now() - windowMs);
    const recent = await prisma.rateLimitEvent.count({ where: { key, createdAt: { gte: since } } });

    if (recent >= max) return false;

    await prisma.rateLimitEvent.create({ data: { key } });

    // Limpeza ocasional para a tabela nao crescer sem fim.
    if (Math.random() < 0.01) {
      await prisma.rateLimitEvent.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 24 * 3_600_000) } } });
    }

    return true;
  } catch (error) {
    console.error("Rate limit store failed; using in-memory counter.", error);
    return hit(key, max, windowMs);
  }
}

export function resetRateLimits() {
  buckets.clear();
}

export async function clientIp() {
  const list = await headers();
  const forwarded = list.get("x-forwarded-for")?.split(",")[0]?.trim();

  return forwarded || list.get("x-real-ip") || "unknown";
}

const TEN_MINUTES = 10 * 60_000;

// Login: 20 tentativas por IP e 6 por e-mail a cada 10 minutos.
export async function allowLogin(email: string) {
  const ip = await clientIp();

  return (await hitGlobal(`login:ip:${ip}`, 20, TEN_MINUTES)) && (await hitGlobal(`login:email:${email.toLowerCase().slice(0, 150)}`, 6, TEN_MINUTES));
}

// Cadastro: 5 por IP a cada 10 minutos.
export async function allowRegister() {
  return hitGlobal(`register:ip:${await clientIp()}`, 5, TEN_MINUTES);
}
