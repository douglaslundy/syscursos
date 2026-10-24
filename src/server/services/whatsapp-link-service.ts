import { createHash, randomInt } from "node:crypto";

import { maskPhone, normalizePhone } from "@/lib/study/phone";
import { prisma } from "@/lib/db/prisma";
import { hitGlobal } from "@/server/security/rate-limit";
import { requireStudentProfileId } from "@/server/services/student-service";

// Sem 0/O/1/I para o aluno não errar ao digitar o código no WhatsApp.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 8;
const CODE_TTL_MS = 10 * 60_000;
const MAX_LINK_ATTEMPTS = 5;

export type LinkResult = { ok: true } | { ok: false; error: "invalid_phone" | "invalid_code" | "phone_taken" | "rate_limited" };

const hash = (value: string) => createHash("sha256").update(value).digest("hex");
const clearData = { whatsappPhone: null, whatsappCodeHash: null, whatsappCodeExpiresAt: null };

// Aluno logado no site: gera o código que ele vai mandar ao agente no WhatsApp. Só o hash fica no banco; um novo código invalida o anterior.
export async function createWhatsappLinkCode() {
  const studentId = await requireStudentProfileId();
  const code = Array.from({ length: CODE_LENGTH }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
  const expiresAt = new Date(Date.now() + CODE_TTL_MS);

  await prisma.studentProfile.update({ where: { id: studentId }, data: { whatsappCodeHash: hash(code), whatsappCodeExpiresAt: expiresAt } });

  return { code, expiresAt: expiresAt.toISOString() };
}

// Agente: o telefone vem do canal autenticado do WhatsApp; o código prova que o dono da conta do site é quem controla esse número.
export async function linkWhatsappByCode(rawPhone: string, rawCode: string): Promise<LinkResult> {
  const phone = normalizePhone(rawPhone);

  if (!phone) return { ok: false, error: "invalid_phone" };
  if (!(await hitGlobal(`wa-link:${phone}`, MAX_LINK_ATTEMPTS, CODE_TTL_MS))) return { ok: false, error: "rate_limited" };

  const profile = await prisma.studentProfile.findUnique({ where: { whatsappCodeHash: hash(rawCode.replace(/\s+/g, "").toUpperCase()) }, select: { id: true, whatsappCodeExpiresAt: true } });

  if (!profile?.whatsappCodeExpiresAt || profile.whatsappCodeExpiresAt.getTime() <= Date.now()) return { ok: false, error: "invalid_code" };

  const taken = await prisma.studentProfile.findFirst({ where: { whatsappPhone: phone, id: { not: profile.id } }, select: { id: true } });

  if (taken) return { ok: false, error: "phone_taken" };

  await prisma.studentProfile.update({ where: { id: profile.id }, data: { whatsappPhone: phone, whatsappCodeHash: null, whatsappCodeExpiresAt: null } });

  return { ok: true };
}

// Id do perfil do aluno dono do telefone, se o vínculo existe e a conta continua ativa e dentro do prazo.
export async function findStudentByPhone(rawPhone: string) {
  const phone = normalizePhone(rawPhone);

  if (!phone) return null;

  const profile = await prisma.studentProfile.findUnique({ where: { whatsappPhone: phone }, select: { id: true, user: { select: { status: true, accessExpiresAt: true } } } });

  if (!profile || profile.user.status !== "ACTIVE") return null;
  if (profile.user.accessExpiresAt && profile.user.accessExpiresAt.getTime() <= Date.now()) return null;

  return profile.id;
}

export async function getWhatsappStatus() {
  const studentId = await requireStudentProfileId();
  const profile = await prisma.studentProfile.findUnique({ where: { id: studentId }, select: { whatsappPhone: true } });

  return profile?.whatsappPhone ? { linked: true, masked: maskPhone(profile.whatsappPhone) } : { linked: false, masked: null };
}

export async function unlinkWhatsapp() {
  const studentId = await requireStudentProfileId();

  await prisma.studentProfile.update({ where: { id: studentId }, data: clearData });
}
