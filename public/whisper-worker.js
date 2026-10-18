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

async function load() {
  if (transcriber) return;
  if (typeof navigator !== "undefined" && "gpu" in navigator) {
    try {
      transcriber = await pipeline("automatic-speech-recognition", MODEL, {
        device: "webgpu",
        dtype: { encoder_model: "fp32", decoder_model_merged: "q4" },
        progress_callback: report,
      });
      return;
    } catch {
      transcriber = null;
    }
  }
  transcriber = await pipeline("automatic-speech-recognition", MODEL, { dtype: "q8", progress_callback: report });
}

self.onmessage = async (event) => {
  const message = event.data;
  try {
    if (message.type === "load") {
      await load();
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
