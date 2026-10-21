import { headers } from "next/headers";

// Limite em memoria, por instancia serverless. Barra tentativa em massa de um mesmo IP/e-mail, mas nao e global.
// shortcut: contador por instancia; para limite global trocar por Redis/Upstash quando houver trafego alto.
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

  return hit(`login:ip:${ip}`, 20, TEN_MINUTES) && hit(`login:email:${email.toLowerCase()}`, 6, TEN_MINUTES);
}

// Cadastro: 5 por IP a cada 10 minutos.
export async function allowRegister() {
  return hit(`register:ip:${await clientIp()}`, 5, TEN_MINUTES);
}
