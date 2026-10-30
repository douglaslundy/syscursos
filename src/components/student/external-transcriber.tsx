"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { SAMPLE_RATE, decodeToPcm, supported } from "@/lib/transcription/browser";
import { clearDraft, loadDraft, saveDraft } from "@/lib/transcription/draft";
import { clock, joinSegments } from "@/lib/transcription/format";
import { loadWhisperWorker } from "@/lib/transcription/whisper-client";
import { buttonClass, primaryClass } from "@/components/student/study-modal";

const SEGMENT_SECONDS = 60;
const MIN_SAMPLES = SAMPLE_RATE / 2;

type Phase = "idle" | "loading" | "recording" | "finishing";
type Part = { start: number; text: string };

// Sem preferCurrentTab: o seletor lista as guias, janelas e telas, para escolher o que tocar o video (inclusive outro navegador).
type DisplayOptions = DisplayMediaStreamOptions & { systemAudio?: "include" | "exclude"; selfBrowserSurface?: "include" | "exclude" };

// Transcreve no navegador (Whisper) o audio de uma guia/janela escolhida e entrega o texto a `onText`.
export function ExternalTranscriber({ draftKey, onText }: { draftKey: string; onText: (text: string) => void }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [canRecord, setCanRecord] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);

  const workerRef = useRef<Worker | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const rotateRef = useRef<number | null>(null);
  const tickRef = useRef<number | null>(null);
  const queueRef = useRef<Promise<void>>(Promise.resolve());
  const partsRef = useRef<Part[]>([]);
  const failedRef = useRef(0);
  const nextIdRef = useRef(0);
  const pendingRef = useRef(new Map<number, (text: string) => void>());
  const stoppingRef = useRef(false);
  const elapsedRef = useRef(0);

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
    setSaved(loadDraft(draftKey)?.text ?? null);
    return cleanup;
  }, [cleanup, draftKey]);

  // Gravacao em andamento: protege contra fechar a aba sem querer.
  useEffect(() => {
    if (phase === "idle") return;

    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [phase]);

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

  function enqueue(start: number, blob: Blob) {
    queueRef.current = queueRef.current.then(async () => {
      let text: string;

      try {
        const pcm = await decodeToPcm(blob);

        text = pcm.length < MIN_SAMPLES ? "" : await runWhisper(pcm);
      } catch {
        failedRef.current += 1;
        text = "[trecho nao transcrito]";
      }

      partsRef.current.push({ start, text });
      // Cada trecho pronto ja vai para o rascunho: se a pagina fechar, o que foi transcrito pode ser recuperado.
      saveDraft(draftKey, joinSegments([...partsRef.current].sort((a, b) => a.start - b.start)));
    });
  }

  function startSegment(start: number) {
    const stream = streamRef.current;

    if (!stream) return;

    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : undefined;
    const recorder = new MediaRecorder(new MediaStream(stream.getAudioTracks()), { mimeType, audioBitsPerSecond: 32_000 });
    const chunks: Blob[] = [];

    recorder.ondataavailable = (event) => chunks.push(event.data);
    recorder.onstop = () => enqueue(start, new Blob(chunks, { type: recorder.mimeType }));
    recorder.start();
    recorderRef.current = recorder;
    // O proximo trecho comeca antes de fechar o atual, para nao perder fala na troca.
    rotateRef.current = window.setTimeout(() => {
      if (stoppingRef.current) return;

      startSegment(start + SEGMENT_SECONDS);
      recorder.stop();
    }, SEGMENT_SECONDS * 1000);
  }

  async function finish() {
    if (stoppingRef.current) return;

    stoppingRef.current = true;
    setPhase("finishing");
    setMessage("Terminando os ultimos trechos...");
    stopTimers();

    const recorder = recorderRef.current;

    if (recorder && recorder.state !== "inactive") {
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
    workerRef.current?.terminate();
    workerRef.current = null;

    const text = joinSegments([...partsRef.current].sort((a, b) => a.start - b.start));

    setPhase("idle");
    setSaved(loadDraft(draftKey)?.text ?? null);

    if (!text) return setMessage("Nao foi captada nenhuma fala. Confira se o video tocou com som e se o audio foi compartilhado.");

    onText(text);
    clearDraft(draftKey);
    setSaved(null);
    setMessage(
      failedRef.current > 0
        ? `Transcricao inserida abaixo; ${failedRef.current} trecho(s) de 1 minuto falharam e estao marcados no texto.`
        : "Transcricao inserida abaixo. Confira e corrija se precisar antes de salvar a aula.",
    );
  }

  async function start() {
    stoppingRef.current = false;
    partsRef.current = [];
    failedRef.current = 0;
    queueRef.current = Promise.resolve();
    elapsedRef.current = 0;
    setElapsed(0);
    setMessage("");
    setSaved(null);

    try {
      // O seletor do navegador escolhe a fonte: guia (com "Compartilhar audio da guia") ou, no Windows, tela inteira
      // com "Compartilhar audio do sistema" para captar um video tocando em outro navegador.
      const options: DisplayOptions = { video: true, audio: true, systemAudio: "include", selfBrowserSurface: "exclude" };
      const stream = await navigator.mediaDevices.getDisplayMedia(options);

      if (stream.getAudioTracks().length === 0) {
        stream.getTracks().forEach((track) => track.stop());
        throw new Error("no_audio");
      }

      streamRef.current = stream;
      void navigator.storage?.persist?.();
      setPhase("loading");
      setMessage("Preparando o modelo de transcricao...");
      workerRef.current = await loadWhisperWorker({
        onStatus: setMessage,
        onResult: (id, text) => pendingRef.current.get(id)?.(text),
      });
      // Se o compartilhamento for encerrado pelo navegador, o que foi captado ate ali vira o texto.
      stream.getAudioTracks()[0].onended = () => void finish();
      startSegment(0);
      tickRef.current = window.setInterval(() => {
        elapsedRef.current += 1;
        setElapsed(elapsedRef.current);
      }, 1000);
      setPhase("recording");
      setMessage("");
    } catch (error) {
      cleanup();
      setPhase("idle");
      setMessage(
        error instanceof Error && error.message === "no_audio"
          ? 'Sem audio. Na janela do navegador, escolha a guia (marque "Compartilhar audio da guia") ou a tela inteira (marque "Compartilhar audio do sistema").'
          : error instanceof DOMException && error.name === "NotAllowedError"
            ? "Compartilhamento cancelado."
            : "Nao foi possivel iniciar. Use o Chrome ou o Edge no computador.",
      );
    }
  }

  if (!canRecord) return <p className="text-xs text-muted-foreground">Para transcrever o audio, use o Chrome ou o Edge em um computador.</p>;

  return (
    <div className="grid gap-2 rounded-md border p-3 text-sm">
      <p className="font-medium">Transcrever o audio de uma aula</p>
      <p className="text-xs text-muted-foreground">
        Toque o video em qualquer guia ou janela, clique em Iniciar e escolha a fonte no seletor do navegador. Para um video em outro
        navegador, escolha &quot;Tela inteira&quot; e marque &quot;Compartilhar audio do sistema&quot;. O texto entra no campo Transcricao.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        {phase === "idle" ? (
          <button className={primaryClass} onClick={() => void start()} type="button">
            Iniciar transcricao
          </button>
        ) : null}
        {phase === "recording" ? (
          <>
            <button className={primaryClass} onClick={() => void finish()} type="button">
              Finalizar e inserir
            </button>
            <span>Gravando {clock(elapsed)}</span>
          </>
        ) : null}
        {phase === "loading" || phase === "finishing" ? (
          <button className={buttonClass} disabled type="button">
            Aguarde...
          </button>
        ) : null}
      </div>
      {phase === "idle" && saved ? (
        <div className="grid gap-2 rounded-md border border-brand-primary/40 p-2 text-xs">
          <p>Ha uma transcricao gravada que nao foi inserida (pode estar incompleta).</p>
          <div className="flex gap-2">
            <button
              className={primaryClass}
              onClick={() => {
                onText(saved);
                clearDraft(draftKey);
                setSaved(null);
              }}
              type="button"
            >
              Inserir no campo
            </button>
            <button
              className={buttonClass}
              onClick={() => {
                clearDraft(draftKey);
                setSaved(null);
              }}
              type="button"
            >
              Descartar
            </button>
          </div>
        </div>
      ) : null}
      {message ? <p className="text-xs">{message}</p> : null}
    </div>
  );
}
