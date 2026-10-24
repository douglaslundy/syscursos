"use server";

import { revalidatePath } from "next/cache";

import { createWhatsappLinkCode, unlinkWhatsapp } from "@/server/services/whatsapp-link-service";

export async function createWhatsappCodeAction() {
  return createWhatsappLinkCode();
}

export async function unlinkWhatsappAction() {
  await unlinkWhatsapp();
  revalidatePath("/app/me");
}
