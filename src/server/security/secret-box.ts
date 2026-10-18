import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

// AES-256-GCM. Chave derivada de SETTINGS_ENCRYPTION_KEY ou, na falta, da service role do Supabase.
// Se essa chave mudar, os segredos salvos ficam ilegiveis e precisam ser informados de novo.
function key() {
  const secret = process.env.SETTINGS_ENCRYPTION_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secret) {
    throw new Error("SETTINGS_ENCRYPTION_KEY or SUPABASE_SERVICE_ROLE_KEY is required to store secrets.");
  }

  return createHash("sha256").update(secret).digest();
}

export function encryptSecret(plain: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const body = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), body].map((part) => part.toString("base64")).join(".");
}

export function decryptSecret(stored: string) {
  try {
    const [iv, tag, body] = stored.split(".").map((part) => Buffer.from(part, "base64"));
    const decipher = createDecipheriv("aes-256-gcm", key(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(body), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}
