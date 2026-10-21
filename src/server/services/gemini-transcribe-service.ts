// Verifique o nome do modelo na documentacao do Gemini se a chamada passar a falhar com 404.
export const GEMINI_MODEL = "gemini-2.5-flash";

const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const PROMPT =
  "Transcreva fielmente a fala deste audio em portugues do Brasil. Responda somente com o texto falado, em um unico paragrafo, sem marcacoes de tempo, sem comentarios e sem descrever sons. Se nao houver fala, responda com texto vazio.";

export type GeminiResult =
  | { ok: true; text: string }
  | { ok: false; reason: "invalid_key" | "quota" | "network" | "failed" };

type GeminiResponse = { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };

async function generate(key: string, parts: Array<Record<string, unknown>>): Promise<GeminiResult> {
  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({ contents: [{ parts }] }),
      signal: AbortSignal.timeout(55_000),
    });

    if (response.status === 400 || response.status === 401 || response.status === 403) {
      const body = await response.text();
      return { ok: false, reason: /api key|permission|forbidden/i.test(body) ? "invalid_key" : "failed" };
    }

    if (response.status === 429) return { ok: false, reason: "quota" };
    if (!response.ok) return { ok: false, reason: "failed" };

    const data = (await response.json()) as GeminiResponse;
    const text = (data.candidates?.[0]?.content?.parts ?? []).map((part) => part.text ?? "").join(" ").replace(/\s+/g, " ").trim();
    return { ok: true, text };
  } catch (error) {
    console.error("Gemini request failed.", error);
    return { ok: false, reason: "network" };
  }
}

export function transcribeWav(key: string, wav: Buffer) {
  return generate(key, [{ text: PROMPT }, { inline_data: { mime_type: "audio/wav", data: wav.toString("base64") } }]);
}

const YOUTUBE_PROMPT =
  "Transcreva fielmente a fala deste trecho de video em portugues do Brasil. Responda somente com o texto falado, em paragrafos corridos, sem marcacoes de tempo, sem comentarios e sem descrever sons ou imagens. Se nao houver fala, responda com texto vazio.";

// O Gemini le o video publico do YouTube pelos servidores do Google, sem passar pelo bloqueio do YouTube a nuvem.
export function transcribeYoutubeRange(key: string, videoId: string, startSeconds: number, endSeconds: number) {
  return generate(key, [
    { text: YOUTUBE_PROMPT },
    {
      fileData: { fileUri: `https://www.youtube.com/watch?v=${videoId}` },
      videoMetadata: { startOffset: `${startSeconds}s`, endOffset: `${endSeconds}s` },
    },
  ]);
}

export function pingGemini(key: string) {
  return generate(key, [{ text: "Responda apenas: ok" }]);
}
