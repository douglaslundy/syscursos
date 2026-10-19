"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { clock, joinSegments } from "@/lib/transcription/format";
import { encodeWav } from "@/lib/transcription/wav";
import { saveRecordedTranscriptAction } from "@/server/actions/transcript-actions";

const SEGMENT_SECONDS = 60;
const SAMPLE_RATE = 16_000;
const MIN_SAMPLES = SAMPLE_RATE / 2;

type Method = "browser" | "gemini";
type Phase = "idle" | "loading" | "recording" | "paused" | "finishing" | "review" | "saving" | "done" | "error";
type Part = { start: number; text: string };

type TranscriberProps = {
  courseId: string;
  lessonId: string;
  method: Method;
};

type DisplayOptions = DisplayMediaStreamOptions & { preferCurrentTab?: boolean };

function supported() {
  // Celular nao compartilha audio da guia (mesmo com "site para computador"): a captura so funciona no Chrome/Edge desktop.
  const touchOnly = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches && !window.matchMedia("(any-pointer: fine)").matches;
  const mobileAgent = typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  return (
    typeof navigator !== "undefined" &&
    !touchOnly &&
    !mobileAgent &&
    !!navigator.mediaDevices?.getDisplayMedia &&
    typeof MediaRecorder !== "undefined"
  );
}

async function decodeToPcm(blob: Blob) {
  const context = new AudioContext({ sampleRate: SAMPLE_RATE });
  try {
    const decoded = await context.decodeAudioData(await blob.arrayBuffer());
    return decoded.getChannelData(0);
  } finally {
    void context.close();
  }
}

const primaryButton =
  "rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-copy-primary disabled:opacity-60";
const secondaryButton =
  "rounded-md border border-stroke-subtle px-4 py-2 text-sm font-medium text-copy-secondary hover:bg-surface-hover";

export function LessonTranscriber({ courseId, lessonId, method }: TranscriberProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(0);
  const [total, setTotal] = useState(0);
  const [draft, setDraft] = useState("");
  const [canRecord, setCanRecord] = useState(true);

  const workerRef = useRef<Worker | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const rotateRef = useRef<number | null>(null);
  const tickRef = useRef<number | null>(null);
  const queueRef = useRef<Promise<void>>(Promise.resolve());
  const partsRef = useRef<Array<Part | undefined>>([]);
  const failedRef = useRef(0);
  const nextIdRef = useRef(0);
  const pendingRef = useRef(new Map<number, (text: string) => void>());
  const stoppingRef = useRef(false);
  const elapsedRef = useRef(0);
  const seqRef = useRef(0);

  const stopTimers = useCallback(() => {
    if (rotateRef.current) window.clearTimeout(rotateRef.current);
    if (tickRef.current) window.clearInterval(tickRef.current);
    rotateRef.current = null;
    tickRef.current = null;
  }, []);

  const cleanup = useCallback(() => {
    stopTimers();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    workerRef.current?.terminate();
    workerRef.current = null;
  }, [stopTimers]);

  useEffect(() => {
    setCanRecord(supported());
    return cleanup;
  }, [cleanup]);

  function loadWorker() {
    return new Promise<Worker>((resolve, reject) => {
      const worker = new Worker("/whisper-worker.js", { type: "module" });
      worker.onmessage = (event: MessageEvent<{ type: string; percent?: number; id?: number; text?: string; message?: string }>) => {
        const data = event.data;

        if (data.type === "progress") setMessage(`Baixando o modelo de transcricao: ${data.percent}%`);
        else if (data.type === "ready") resolve(worker);
        else if (data.type === "result" && data.id !== undefined) pendingRef.current.get(data.id)?.(data.text ?? "");
        else if (data.type === "error") {
          if (data.id !== undefined) pendingRef.current.get(data.id)?.("");
          else reject(new Error(data.message));
        }
      };
      worker.onerror = () => reject(new Error("worker"));
      worker.postMessage({ type: "load" });
    });
  }

  function runWhisper(pcm: Float32Array) {
    return new Promise<string>((resolve) => {
      const id = nextIdRef.current++;
      pendingRef.current.set(id, (text) => {
        pendingRef.current.delete(id);
        resolve(text);
      });
      workerRef.current?.postMessage({ type: "run", id, audio: pcm }, [pcm.buffer]);
    });
  }

  async function runGemini(pcm: Float32Array) {
    const body = encodeWav(pcm, SAMPLE_RATE);
    const url = `/app/transcribe/gemini?courseId=${courseId}&lessonId=${lessonId}`;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const response = await fetch(url, { method: "POST", body, headers: { "content-type": "audio/wav" } });

        if (response.ok) return ((await response.json()) as { text: string }).text;
        if (response.status === 429) await new Promise((resolve) => setTimeout(resolve, 15_000));
      } catch {
        // tenta de novo
      }
    }

    throw new Error("gemini");
  }

  function enqueue(seq: number, start: number, blob: Blob) {
    setTotal((value) => value + 1);
    queueRef.current = queueRef.current.then(async () => {
      let text: string;

      try {
        const pcm = await decodeToPcm(blob);

        text = pcm.length < MIN_SAMPLES ? "" : method === "browser" ? await runWhisper(pcm) : await runGemini(pcm);
      } catch {
        failedRef.current += 1;
        text = "[trecho nao transcrito]";
      }

      partsRef.current[seq] = { start, text };
      setDone((value) => value + 1);
    });
  }

  function startSegment(seq: number, start: number) {
    const stream = streamRef.current;

    if (!stream) return;

    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : undefined;
    const recorder = new MediaRecorder(new MediaStream(stream.getAudioTracks()), { mimeType, audioBitsPerSecond: 32_000 });
    const chunks: Blob[] = [];

    recorder.ondataavailable = (event) => chunks.push(event.data);
    recorder.onstop = () => enqueue(seq, start, new Blob(chunks, { type: recorder.mimeType }));
    recorder.start();
    recorderRef.current = recorder;
    seqRef.current = seq;
    // O proximo trecho comeca antes de fechar o atual, para nao perder fala na troca.
    rotateRef.current = window.setTimeout(() => {
      if (stoppingRef.current) return;
      startSegment(seq + 1, start + SEGMENT_SECONDS);
      recorder.stop();
    }, SEGMENT_SECONDS * 1000);
  }

  function startTick() {
    tickRef.current = window.setInterval(() => {
      elapsedRef.current += 1;
      setElapsed(elapsedRef.current);
    }, 1000);
  }

  // Fecha o trecho em andamento e espera ele entrar na fila.
  function closeCurrentSegment() {
    const recorder = recorderRef.current;

    if (!recorder || recorder.state === "inactive") return Promise.resolve();

    return new Promise<void>((resolve) => {
      const previous = recorder.onstop;
      recorder.onstop = (event) => {
        previous?.call(recorder, event);
        resolve();
      };
      recorder.stop();
    });
  }

  async function pause() {
    stopTimers();
    await closeCurrentSegment();
    setPhase("paused");
    setMessage("Gravacao pausada. Pause tambem o video e clique em Retomar quando continuar a aula.");
  }

  function resume() {
    startSegment(seqRef.current + 1, elapsedRef.current);
    startTick();
    setPhase("recording");
    setMessage("");
  }

  // Para a gravacao e mostra o texto para conferir; nada e salvo ate o aluno confirmar.
  async function finish() {
    if (stoppingRef.current) return;

    stoppingRef.current = true;
    setPhase("finishing");
    setMessage("Terminando os ultimos trechos...");
    stopTimers();
    await closeCurrentSegment();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    await queueRef.current;
    workerRef.current?.terminate();
    workerRef.current = null;

    const text = joinSegments(partsRef.current.filter((part): part is Part => part !== undefined));

    if (!text) {
      setPhase("error");
      setMessage("Nao foi captada nenhuma fala. Confira se a aula tocou com som e se o audio da guia foi compartilhado.");
      return;
    }

    setDraft(text);
    setPhase("review");
    setMessage(
      failedRef.current > 0
        ? `${failedRef.current} trecho(s) de 1 minuto falharam e estao marcados no texto.`
        : "Confira o texto, corrija se precisar e salve.",
    );
  }

  function discard() {
    stoppingRef.current = true;
    cleanup();
    partsRef.current = [];
    setDraft("");
    setMessage("");
    setPhase("idle");
  }

  async function save() {
    setPhase("saving");
    setMessage("Salvando a transcricao...");

    const result = await saveRecordedTranscriptAction({ courseId, lessonId, text: draft });

    if (result === "ok" || result === "exists") {
      setPhase("done");
      setMessage("Transcricao salva.");
      router.refresh();
    } else {
      setPhase("review");
      setMessage("Nao foi possivel salvar. Tente de novo.");
    }
  }

  async function start() {
    stoppingRef.current = false;
    partsRef.current = [];
    failedRef.current = 0;
    queueRef.current = Promise.resolve();
    elapsedRef.current = 0;
    setDone(0);
    setTotal(0);
    setElapsed(0);

    try {
      // Pede a captura antes de baixar o modelo: o navegador so abre o seletor logo apos o clique, e nao vale baixar o modelo se o aluno cancelar.
      const options: DisplayOptions = { video: true, audio: true, preferCurrentTab: true };
      const stream = await navigator.mediaDevices.getDisplayMedia(options);

      if (stream.getAudioTracks().length === 0) {
        stream.getTracks().forEach((track) => track.stop());
        throw new Error("no_audio");
      }

      streamRef.current = stream;
      if (method === "browser") {
        setPhase("loading");
        setMessage("Preparando o modelo de transcricao (so demora na primeira vez)...");
        workerRef.current = await loadWorker();
      }

      // Se o compartilhamento for encerrado pelo navegador, o que foi captado vai para conferencia, nao e salvo direto.
      stream.getAudioTracks()[0].onended = () => void finish();
      startSegment(0, 0);
      startTick();
      setPhase("recording");
      setMessage("");
    } catch (error) {
      cleanup();
      setPhase("error");
      setMessage(
        error instanceof Error && error.message === "no_audio"
          ? 'Sem audio. Na janela do navegador, escolha a guia desta aula e marque "Compartilhar audio da guia".'
          : error instanceof DOMException && error.name === "NotAllowedError"
            ? "Compartilhamento cancelado."
            : "Nao foi possivel iniciar. Use o Chrome ou o Edge no computador.",
      );
    }
  }

  if (!canRecord) {
    return (
      <p className="mt-2 text-sm text-copy-secondary">
        Para transcrever esta aula, use o Chrome ou o Edge em um computador.
      </p>
    );
  }

  const active = phase === "recording" || phase === "paused";
  const idle = phase === "idle" || phase === "error" || phase === "done";

  return (
    <div className="mt-2 space-y-3 text-sm text-copy-secondary">
      {idle ? (
        <p>
          Como fazer: clique em Transcrever, escolha a guia desta aula e marque &quot;Compartilhar audio da guia&quot;.
          Depois volte o video ao inicio e de play. A transcricao acompanha a aula em tempo real: deixe a guia aberta,
          com som, ate o fim e clique em Finalizar. Se precisar parar, use Pausar e depois Retomar.{" "}
          {method === "browser"
            ? "O texto e feito no seu computador; na primeira vez e baixado um modelo de 80 a 150 MB."
            : "O audio e enviado em pedacos de 1 minuto ao Gemini e nao fica guardado."}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        {idle ? (
          <button className={primaryButton} onClick={() => void start()} type="button">
            Transcrever esta aula
          </button>
        ) : null}
        {phase === "recording" ? (
          <button className={secondaryButton} onClick={() => void pause()} type="button">
            Pausar
          </button>
        ) : null}
        {phase === "paused" ? (
          <button className={primaryButton} onClick={resume} type="button">
            Retomar
          </button>
        ) : null}
        {active ? (
          <>
            <button className={primaryButton} onClick={() => void finish()} type="button">
              Finalizar
            </button>
            <button
              className={secondaryButton}
              onClick={() => {
                if (window.confirm("Descartar esta gravacao e comecar de novo?")) discard();
              }}
              type="button"
            >
              Descartar e recomecar
            </button>
            <span>
              {phase === "paused" ? "Pausado em" : "Gravando"} {clock(elapsed)} - {done}/{total} trechos transcritos
            </span>
          </>
        ) : null}
      </div>

      {phase === "review" || phase === "saving" ? (
        <div className="space-y-3">
          <textarea
            className="h-64 w-full rounded-md border border-stroke-subtle bg-surface-elevated p-3 text-sm leading-6 text-copy-secondary"
            disabled={phase === "saving"}
            onChange={(event) => setDraft(event.target.value)}
            value={draft}
          />
          <div className="flex flex-wrap gap-3">
            <button className={primaryButton} disabled={phase === "saving" || !draft.trim()} onClick={() => void save()} type="button">
              Salvar transcricao
            </button>
            <button className={secondaryButton} disabled={phase === "saving"} onClick={discard} type="button">
              Descartar e recomecar
            </button>
          </div>
        </div>
      ) : null}

      {message ? (
        <p className={phase === "error" ? "text-destructive" : phase === "done" ? "text-green-500" : ""}>{message}</p>
      ) : null}
    </div>
  );
}
