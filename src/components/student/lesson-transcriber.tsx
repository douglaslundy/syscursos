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
type Phase = "idle" | "loading" | "recording" | "finishing" | "saving" | "done" | "error";

type TranscriberProps = {
  courseId: string;
  lessonId: string;
  method: Method;
};

type DisplayOptions = DisplayMediaStreamOptions & { preferCurrentTab?: boolean };

function supported() {
  return typeof navigator !== "undefined" && !!navigator.mediaDevices?.getDisplayMedia && typeof MediaRecorder !== "undefined";
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

export function LessonTranscriber({ courseId, lessonId, method }: TranscriberProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(0);
  const [total, setTotal] = useState(0);
  const [canRecord, setCanRecord] = useState(true);

  const workerRef = useRef<Worker | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const rotateRef = useRef<number | null>(null);
  const tickRef = useRef<number | null>(null);
  const queueRef = useRef<Promise<void>>(Promise.resolve());
  const partsRef = useRef<Array<string | null>>([]);
  const failedRef = useRef(0);
  const nextIdRef = useRef(0);
  const pendingRef = useRef(new Map<number, (text: string) => void>());
  const stoppingRef = useRef(false);

  const cleanup = useCallback(() => {
    if (rotateRef.current) window.clearTimeout(rotateRef.current);
    if (tickRef.current) window.clearInterval(tickRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    workerRef.current?.terminate();
    workerRef.current = null;
  }, []);

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

  function enqueue(index: number, blob: Blob) {
    setTotal((value) => value + 1);
    queueRef.current = queueRef.current.then(async () => {
      try {
        const pcm = await decodeToPcm(blob);

        partsRef.current[index] = pcm.length < MIN_SAMPLES ? "" : method === "browser" ? await runWhisper(pcm) : await runGemini(pcm);
      } catch {
        failedRef.current += 1;
        partsRef.current[index] = "[trecho nao transcrito]";
      }

      setDone((value) => value + 1);
    });
  }

  function startSegment(index: number) {
    const stream = streamRef.current;

    if (!stream) return;

    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : undefined;
    const recorder = new MediaRecorder(new MediaStream(stream.getAudioTracks()), { mimeType, audioBitsPerSecond: 32_000 });
    const chunks: Blob[] = [];

    recorder.ondataavailable = (event) => chunks.push(event.data);
    recorder.onstop = () => enqueue(index, new Blob(chunks, { type: recorder.mimeType }));
    recorder.start();
    recorderRef.current = recorder;
    // O proximo trecho comeca antes de fechar o atual, para nao perder fala na troca.
    rotateRef.current = window.setTimeout(() => {
      if (stoppingRef.current) return;
      startSegment(index + 1);
      recorder.stop();
    }, SEGMENT_SECONDS * 1000);
  }

  async function finish() {
    if (stoppingRef.current) return;

    stoppingRef.current = true;
    setPhase("finishing");
    setMessage("Terminando os ultimos trechos...");
    if (rotateRef.current) window.clearTimeout(rotateRef.current);
    if (tickRef.current) window.clearInterval(tickRef.current);

    const recorder = recorderRef.current;

    if (recorder && recorder.state !== "inactive") {
      // Espera o ultimo trecho entrar na fila antes de esvaziar a fila.
      await new Promise<void>((resolve) => {
        const previous = recorder.onstop;
        recorder.onstop = (event) => {
          previous?.call(recorder, event);
          resolve();
        };
        recorder.stop();
      });
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    await queueRef.current;

    const text = joinSegments(partsRef.current, SEGMENT_SECONDS);

    workerRef.current?.terminate();
    workerRef.current = null;

    if (!text) {
      setPhase("error");
      setMessage("Nao foi captada nenhuma fala. Confira se a aula tocou com som e se o audio da guia foi compartilhado.");
      return;
    }

    setPhase("saving");
    setMessage("Salvando a transcricao...");

    const result = await saveRecordedTranscriptAction({ courseId, lessonId, text });

    if (result === "ok" || result === "exists") {
      setPhase("done");
      setMessage(
        failedRef.current > 0
          ? `Transcricao salva, mas ${failedRef.current} trecho(s) de 1 minuto falharam e ficaram marcados.`
          : "Transcricao salva.",
      );
      router.refresh();
    } else {
      setPhase("error");
      setMessage("Nao foi possivel salvar a transcricao.");
    }
  }

  async function start() {
    stoppingRef.current = false;
    partsRef.current = [];
    failedRef.current = 0;
    queueRef.current = Promise.resolve();
    setDone(0);
    setTotal(0);
    setElapsed(0);

    try {
      if (method === "browser") {
        setPhase("loading");
        setMessage("Preparando o modelo de transcricao (so demora na primeira vez)...");
        workerRef.current = await loadWorker();
      }

      const options: DisplayOptions = { video: true, audio: true, preferCurrentTab: true };
      const stream = await navigator.mediaDevices.getDisplayMedia(options);

      if (stream.getAudioTracks().length === 0) {
        stream.getTracks().forEach((track) => track.stop());
        throw new Error("no_audio");
      }

      streamRef.current = stream;
      stream.getAudioTracks()[0].onended = () => void finish();
      startSegment(0);
      tickRef.current = window.setInterval(() => setElapsed((value) => value + 1), 1000);
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

  const busy = phase === "loading" || phase === "recording" || phase === "finishing" || phase === "saving";

  return (
    <div className="mt-2 space-y-3 text-sm text-copy-secondary">
      <p>
        Como fazer: clique em Iniciar, escolha a guia desta aula e marque &quot;Compartilhar audio da guia&quot;. Depois
        de iniciar, volte ao inicio do video e de play. A transcricao acompanha a aula em tempo real: deixe a guia
        aberta, com som, ate o fim e clique em Finalizar.{" "}
        {method === "browser"
          ? "O texto e feito no seu computador; na primeira vez e baixado um modelo de 80 a 150 MB."
          : "O audio e enviado em pedacos de 1 minuto ao Gemini e nao fica guardado."}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        {phase === "recording" ? (
          <button
            className="rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-copy-primary"
            onClick={() => void finish()}
            type="button"
          >
            Finalizar e salvar
          </button>
        ) : (
          <button
            className="rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-copy-primary disabled:opacity-60"
            disabled={busy}
            onClick={() => void start()}
            type="button"
          >
            Transcrever esta aula
          </button>
        )}
        {phase === "recording" ? (
          <span>
            Gravando {clock(elapsed)} - {done}/{total} trechos transcritos
          </span>
        ) : null}
      </div>
      {message ? (
        <p className={phase === "error" ? "text-destructive" : phase === "done" ? "text-green-500" : ""}>{message}</p>
      ) : null}
    </div>
  );
}
