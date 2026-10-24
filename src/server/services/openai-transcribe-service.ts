import type { GeminiResult } from "@/server/services/gemini-transcribe-service";

// Confira o nome do modelo na documentacao da OpenAI se a chamada passar a falhar com 404.
export const OPENAI_TRANSCRIBE_MODEL = "gpt-4o-mini-transcribe";

type OpenAiTranscription = { text?: string };

// Mesmo contrato do Gemini: recebe o trecho em WAV e devolve so o texto falado.
export async function transcribeWavOpenAi(key: string, wav: Buffer): Promise<GeminiResult> {
  try {
    const form = new FormData();
    form.append("file", new Blob([new Uint8Array(wav)], { type: "audio/wav" }), "audio.wav");
    form.append("model", OPENAI_TRANSCRIBE_MODEL);
    form.append("language", "pt");
    form.append("response_format", "json");

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { authorization: `Bearer ${key}` },
      body: form,
      signal: AbortSignal.timeout(55_000),
    });

    if (response.status === 401 || response.status === 403) return { ok: false, reason: "invalid_key" };
    if (response.status === 429) return { ok: false, reason: "quota" };
    if (!response.ok) return { ok: false, reason: "failed" };

    const data = (await response.json()) as OpenAiTranscription;
    return { ok: true, text: (data.text ?? "").replace(/\s+/g, " ").trim() };
  } catch (error) {
    console.error("OpenAI transcription failed.", { name: error instanceof Error ? error.name : typeof error });
    return { ok: false, reason: "network" };
  }
}
