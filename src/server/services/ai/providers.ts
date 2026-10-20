export type AiProviderId = "openai" | "gemini";
export type AiRequest = { system: string; user: string; json: boolean };
export type AiFailure = "invalid_key" | "quota" | "network" | "failed";
export type AiCallResult =
  | { ok: true; text: string; inputTokens: number; outputTokens: number; model: string }
  | { ok: false; reason: AiFailure };

// Confira os nomes dos modelos na documentacao de cada provedor se a chamada passar a falhar com 404.
export const OPENAI_MODEL = "gpt-4o-mini";
export const GEMINI_TEXT_MODEL = "gemini-2.5-flash";

const TIMEOUT_MS = 55_000;

type OpenAiResponse = {
  choices?: Array<{ message?: { content?: string | null } }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number };
};
type GeminiResponse = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; thoughtsTokenCount?: number; totalTokenCount?: number };
};

async function post(url: string, headers: Record<string, string>, body: unknown) {
  return fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
}

function failureFor(status: number, body: string): AiFailure {
  if (status === 401) return "invalid_key";
  if (status === 429) return "quota";
  if (status === 400 || status === 403) return /api key|permission|forbidden|incorrect/i.test(body) ? "invalid_key" : "failed";
  return "failed";
}

async function callOpenAi(key: string, request: AiRequest): Promise<AiCallResult> {
  const response = await post(
    "https://api.openai.com/v1/chat/completions",
    { authorization: `Bearer ${key}` },
    {
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: request.system },
        { role: "user", content: request.user },
      ],
      ...(request.json ? { response_format: { type: "json_object" } } : {}),
    },
  );

  if (!response.ok) return { ok: false, reason: failureFor(response.status, await response.text()) };

  const data = (await response.json()) as OpenAiResponse;
  const text = data.choices?.[0]?.message?.content?.trim() ?? "";

  if (!text) return { ok: false, reason: "failed" };

  return {
    ok: true,
    text,
    inputTokens: data.usage?.prompt_tokens ?? 0,
    outputTokens: data.usage?.completion_tokens ?? 0,
    model: OPENAI_MODEL,
  };
}

async function callGemini(key: string, request: AiRequest): Promise<AiCallResult> {
  const response = await post(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TEXT_MODEL}:generateContent`,
    { "x-goog-api-key": key },
    {
      systemInstruction: { parts: [{ text: request.system }] },
      contents: [{ role: "user", parts: [{ text: request.user }] }],
      ...(request.json ? { generationConfig: { responseMimeType: "application/json" } } : {}),
    },
  );

  if (!response.ok) return { ok: false, reason: failureFor(response.status, await response.text()) };

  const data = (await response.json()) as GeminiResponse;
  const text = (data.candidates?.[0]?.content?.parts ?? []).map((part) => part.text ?? "").join("").trim();

  if (!text) return { ok: false, reason: "failed" };

  const usage = data.usageMetadata ?? {};
  const inputTokens = usage.promptTokenCount ?? 0;
  // Tokens de raciocinio do Gemini sao cobrados como saida.
  const outputTokens =
    usage.totalTokenCount !== undefined ? usage.totalTokenCount - inputTokens : (usage.candidatesTokenCount ?? 0) + (usage.thoughtsTokenCount ?? 0);

  return { ok: true, text, inputTokens, outputTokens, model: GEMINI_TEXT_MODEL };
}

export async function callProvider(provider: AiProviderId, key: string, request: AiRequest): Promise<AiCallResult> {
  try {
    return provider === "openai" ? await callOpenAi(key, request) : await callGemini(key, request);
  } catch (error) {
    console.error("AI request failed.", { provider, name: error instanceof Error ? error.name : typeof error });
    return { ok: false, reason: "network" };
  }
}
