const NO_GPU_KEY = "syscursos:whisper-no-gpu";

// Uma frase/trecho falado e o segundo (dentro do audio enviado) em que comeca.
export type Segment = { start: number; text: string };

type WorkerMessage = { type: string; percent?: number; id?: number; segments?: Segment[]; message?: string; cached?: boolean };

type Handlers = {
  // Texto de progresso para mostrar ao aluno enquanto o modelo carrega.
  onStatus: (message: string) => void;
  // Frases de um audio enviado; lista vazia quando nao houve fala ou o trecho falhou.
  onResult: (id: number, segments: Segment[]) => void;
};

// Carrega o Whisper (/whisper-worker.js) e resolve quando o modelo esta pronto.
export function loadWhisperWorker({ onStatus, onResult }: Handlers) {
  return new Promise<Worker>((resolve, reject) => {
    const worker = new Worker("/whisper-worker.js", { type: "module" });
    let cached = false;

    worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
      const data = event.data;

      if (data.type === "cache") {
        cached = data.cached === true;
        onStatus(
          cached
            ? "Carregando o modelo de transcricao ja salvo neste navegador..."
            : "Baixando o modelo de transcricao (so na primeira vez; depois fica salvo neste navegador)...",
        );
      } else if (data.type === "gpu_failed") {
        try {
          window.localStorage.setItem(NO_GPU_KEY, "1");
        } catch {
          // sem armazenamento: so perde a lembranca
        }
      } else if (data.type === "progress") {
        // O transformers.js reemite o progresso ao ler do cache: so mostra percentual quando de fato baixa.
        if (!cached) onStatus(`Baixando o modelo de transcricao: ${data.percent}%`);
      } else if (data.type === "ready") resolve(worker);
      else if (data.type === "result" && data.id !== undefined) onResult(data.id, data.segments ?? []);
      else if (data.type === "error") {
        if (data.id !== undefined) onResult(data.id, []);
        else reject(new Error(data.message));
      }
    };
    worker.onerror = () => reject(new Error("worker"));

    let skipGpu = false;

    try {
      skipGpu = window.localStorage.getItem(NO_GPU_KEY) === "1";
    } catch {
      // sem armazenamento: tenta a GPU
    }

    worker.postMessage({ type: "load", skipGpu });
  });
}
