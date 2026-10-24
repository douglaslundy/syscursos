import { isTechniqueId, parseActiveTechniques, type SummaryTechniqueId } from "@/lib/ai/techniques";
import { appSettings } from "@/server/services/app-settings";
import { requireRole } from "@/server/auth/guards";
import { decryptSecret, encryptSecret } from "@/server/security/secret-box";
import { callProvider, type AiProviderId } from "@/server/services/ai/providers";
import { getGeminiApiKey, getOpenAiApiKey } from "@/server/services/settings-service";

const OPENAI_KEY = "openai_api_key";
const ANTHROPIC_KEY = "anthropic_api_key";
const GEMINI_KEY = "gemini_api_key"; // a mesma chave usada na transcricao
const ACTIVE_KEY = "ai_active_provider";
const TECHNIQUES_KEY = "ai_summary_techniques";

export const AI_PROVIDERS: readonly AiProviderId[] = ["openai", "gemini", "anthropic"];
export type AiKeyTestResult = "ok" | "empty" | "invalid" | "quota" | "network";

async function readSecret(key: string) {
  const row = await appSettings.findUnique({ where: { key } });
  return { value: row ? decryptSecret(row.value) : null, stored: row !== null };
}

export async function getAnthropicApiKey() {
  return (await readSecret(ANTHROPIC_KEY)).value;
}

async function providerKey(provider: AiProviderId) {
  if (provider === "openai") return getOpenAiApiKey();

  return provider === "anthropic" ? getAnthropicApiKey() : getGeminiApiKey();
}

async function configuredProviders() {
  const keys = await Promise.all(AI_PROVIDERS.map(providerKey));
  return AI_PROVIDERS.filter((_, index) => keys[index] !== null);
}

// Provedor ativo: o escolhido pelo admin se a chave ainda existe; sem escolha, o unico configurado.
export async function getActiveAiProvider(): Promise<AiProviderId | null> {
  const [row, configured] = await Promise.all([appSettings.findUnique({ where: { key: ACTIVE_KEY } }), configuredProviders()]);
  const chosen = AI_PROVIDERS.find((provider) => provider === row?.value);

  if (chosen && configured.includes(chosen)) return chosen;

  return !row && configured.length === 1 ? configured[0] : null;
}

export async function getActiveTechniques(): Promise<SummaryTechniqueId[]> {
  const row = await appSettings.findUnique({ where: { key: TECHNIQUES_KEY } });
  return parseActiveTechniques(row?.value);
}

// Chave do provedor ativo, para uso do servidor.
export async function getActiveAiCredentials() {
  const provider = await getActiveAiProvider();
  const key = provider ? await providerKey(provider) : null;

  return provider && key ? { provider, key } : null;
}

export async function getAiSettingsStatus() {
  await requireRole("ADMIN");
  const [openai, gemini, anthropic, active, techniques] = await Promise.all([
    readSecret(OPENAI_KEY),
    readSecret(GEMINI_KEY),
    readSecret(ANTHROPIC_KEY),
    getActiveAiProvider(),
    getActiveTechniques(),
  ]);
  const describe = (secret: { value: string | null; stored: boolean }) => ({
    configured: secret.value !== null,
    hint: secret.value ? `...${secret.value.slice(-4)}` : null,
    unreadable: secret.stored && secret.value === null,
  });

  return { openai: describe(openai), gemini: describe(gemini), anthropic: describe(anthropic), active, techniques };
}

export async function saveOpenAiApiKey(key: string) {
  await requireRole("ADMIN");
  const value = encryptSecret(key);
  await appSettings.upsert({ where: { key: OPENAI_KEY }, create: { key: OPENAI_KEY, value }, update: { value } });
}

export async function removeOpenAiApiKey() {
  await requireRole("ADMIN");
  await appSettings.deleteMany({ where: { key: OPENAI_KEY } });
  await appSettings.deleteMany({ where: { key: ACTIVE_KEY, value: "openai" } });
  await appSettings.deleteMany({ where: { key: "transcription_method", value: "openai" } });
}

export async function saveGeminiAiKey(key: string) {
  await requireRole("ADMIN");
  const value = encryptSecret(key);
  await appSettings.upsert({ where: { key: GEMINI_KEY }, create: { key: GEMINI_KEY, value }, update: { value } });
}

export async function saveAnthropicApiKey(key: string) {
  await requireRole("ADMIN");
  const value = encryptSecret(key);
  await appSettings.upsert({ where: { key: ANTHROPIC_KEY }, create: { key: ANTHROPIC_KEY, value }, update: { value } });
}

export async function removeAnthropicApiKey() {
  await requireRole("ADMIN");
  await appSettings.deleteMany({ where: { key: ANTHROPIC_KEY } });
  await appSettings.deleteMany({ where: { key: ACTIVE_KEY, value: "anthropic" } });
}

export async function testAiKey(provider: AiProviderId, candidate: string | null): Promise<AiKeyTestResult> {
  await requireRole("ADMIN");
  const key = candidate || (await providerKey(provider));

  if (!key) return "empty";

  const result = await callProvider(provider, key, { system: "Responda apenas: ok", user: "ok", json: false });

  if (result.ok) return "ok";

  return result.reason === "invalid_key" ? "invalid" : result.reason === "quota" ? "quota" : "network";
}

export async function saveActiveAiProvider(provider: AiProviderId): Promise<"saved" | "need_key"> {
  await requireRole("ADMIN");

  if (!(await providerKey(provider))) return "need_key";

  await appSettings.upsert({
    where: { key: ACTIVE_KEY },
    create: { key: ACTIVE_KEY, value: provider },
    update: { value: provider },
  });
  return "saved";
}

export async function saveActiveTechniques(ids: string[]) {
  await requireRole("ADMIN");
  const value = JSON.stringify(Array.from(new Set(ids.filter(isTechniqueId))));
  await appSettings.upsert({ where: { key: TECHNIQUES_KEY }, create: { key: TECHNIQUES_KEY, value }, update: { value } });
}
