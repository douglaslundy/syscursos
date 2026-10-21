// Whisper no navegador (transformers.js). Roda no computador do aluno; o audio nao sai dele.
// Modelo baixado do Hugging Face na 1a vez e guardado no cache do navegador.
import { pipeline } from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.5.1";

const MODEL = "onnx-community/whisper-base";
let transcriber = null;

function report(event) {
  if (event.status === "progress" && typeof event.progress === "number") {
    postMessage({ type: "progress", percent: Math.round(event.progress) });
  }
}

// O transformers.js guarda os arquivos do modelo no Cache API ("transformers-cache") e reemite o progresso ao ler do cache,
// entao so da para saber se vai baixar olhando o cache antes de carregar.
async function isCached() {
  try {
    if (!("caches" in self)) return false;
    const cache = await caches.open("transformers-cache");
    return (await cache.keys()).some((request) => request.url.includes(MODEL) && request.url.endsWith(".onnx"));
  } catch {
    return false;
  }
}

async function load(skipGpu) {
  if (transcriber) return;
  if (!skipGpu && typeof navigator !== "undefined" && "gpu" in navigator) {
    try {
      transcriber = await pipeline("automatic-speech-recognition", MODEL, {
        device: "webgpu",
        dtype: { encoder_model: "fp32", decoder_model_merged: "q4" },
        progress_callback: report,
      });
      return;
    } catch {
      transcriber = null;
      postMessage({ type: "gpu_failed" });
    }
  }
  transcriber = await pipeline("automatic-speech-recognition", MODEL, { dtype: "q8", progress_callback: report });
}

self.onmessage = async (event) => {
  const message = event.data;
  try {
    if (message.type === "load") {
      postMessage({ type: "cache", cached: await isCached() });
      await load(message.skipGpu === true);
      postMessage({ type: "ready" });
    } else if (message.type === "run") {
      const output = await transcriber(message.audio, {
        language: "portuguese",
        task: "transcribe",
        chunk_length_s: 30,
        stride_length_s: 5,
      });
      postMessage({ type: "result", id: message.id, text: String(output.text ?? "").trim() });
    }
  } catch (error) {
    postMessage({ type: "error", id: message.id, message: String(error && error.message ? error.message : error) });
  }
};
