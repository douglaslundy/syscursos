"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { SAMPLE_RATE, decodeToPcm, supported, youtubeErrorMessage } from "@/lib/transcription/browser";
import { SILENCE_LEVEL, rms, shouldAutoFinish } from "@/lib/transcription/auto-finish";
import { nextChunk } from "@/lib/transcription/chunks";
import { type TranscriptDraft, clearDraft, loadDraft, saveDraft } from "@/lib/transcription/draft";
import { clock, joinSegments } from "@/lib/transcription/format";
import { VIDEO_ENDED_EVENT, setTranscribing } from "@/lib/transcription/guard";
import { encodeWav } from "@/lib/transcription/wav";
import { saveRecordedTranscriptAction } from "@/server/actions/transcript-actions";

const SEGMENT_SECONDS = 60;
const MIN_SAMPLES = SAMPLE_RATE / 2;
const NO_GPU_KEY = "syscursos:whisper-no-gpu";
const ENDED_GRACE_MS = 2500;

type Method = "browser" | "gemini";
type Phase = "idle" | "loading" | "recording" | "paused" | "finishing" | "importing" | "review" | "saving" | "done" | "error";
type Part = { start: number; text: string };

// Fases com trabalho em andamento ou texto ainda nao salvo: a aula nao pode avancar sozinha.
const BUSY_PHASES: Phase[] = ["loading", "recording", "paused", "finishing", "importing", "review", "saving"];

type TranscriberProps = {
  courseId: string;
  lessonId: string;
  method: Method;
  durationSeconds: number | null;
  // Aula do YouTube com chave do Gemini: da para transcrever sem gravar o audio.
  youtubeGemini: boolean;
};

type DisplayOptions = DisplayMediaStreamOptions & { preferCurrentTab?: boolean };

const primaryButton =
  "rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-copy-primary disabled:opacity-60";
const secondaryButton =
  "rounded-md border border-stroke-subtle px-4 py-2 text-sm font-medium text-copy-secondary hover:bg-surface-hover";

export function LessonTranscriber({ courseId, lessonId, method, durationSeconds, youtubeGemini }: TranscriberProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(0);
  const [total, setTotal] = useState(0);
  const [draft, setDraft] = useState("");
  const [canRecord, setCanRecord] = useState(true);
  const [saved, setSaved] = useState<TranscriptDraft | null>(null);

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
  const phaseRef = useRef<Phase>("idle");
  const cachedRef = useRef(false);
  const silentRef = useRef(0);
  const monitorRef = useRef<{ context: AudioContext; analyser: AnalyserNode } | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const finishRef = useRef<(notice?: string) => Promise<void>>(async () => undefined);

  const changePhase = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

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
    abortRef.current?.abort();
    abortRef.current = null;
    void monitorRef.current?.context.close();
    monitorRef.current = null;
  }, [stopTimers]);

  useEffect(() => {
    setCanRecord(supported());
    setSaved(loadDraft(lessonId));
    return () => {
      cleanup();
      setTranscribing(false);
    };
  }, [cleanup, lessonId]);

  // Avisa o resto da pagina (player, "proxima aula") e o navegador enquanto ha transcricao a perder.
  const busy = BUSY_PHASES.includes(phase);

  useEffect(() => {
    setTranscribing(busy);

    if (!busy) return;

    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [busy]);

  // O texto em conferencia tambem fica guardado no navegador ate ser salvo no banco.
  useEffect(() => {
    if (phase !== "review") return;

    const timer = window.setTimeout(() => saveDraft(lessonId, draft), 500);
    return () => window.clearTimeout(timer);
  }, [phase, draft, lessonId]);

  // O player do YouTube avisa quando o video acaba; um instante depois a gravacao e encerrada, para pegar o fim da fala.
  useEffect(() => {
    let timer: number | undefined;
    const onEnded = () => {
      if (phaseRef.current === "recording") timer = window.setTimeout(() => void finishRef.current("Fim da aula detectado: gravacao finalizada. "), ENDED_GRACE_MS);
    };

    window.addEventListener(VIDEO_ENDED_EVENT, onEnded);
    return () => {
      window.removeEventListener(VIDEO_ENDED_EVENT, onEnded);
      window.clearTimeout(timer);
    };
  }, []);

  function loadWorker() {
    return new Promise<Worker>((resolve, reject) => {
      const worker = new Worker("/whisper-worker.js", { type: "module" });
      worker.onmessage = (event: MessageEvent<{ type: string; percent?: number; id?: number; text?: string; message?: string; cached?: boolean }>) => {
        const data = event.data;

        if (data.type === "cache") {
          cachedRef.current = data.cached === true;
          setMessage(
            cachedRef.current
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
          if (!cachedRef.current) setMessage(`Baixando o modelo de transcricao: ${data.percent}%`);
        } else if (data.type === "ready") resolve(worker);
        else if (data.type === "result" && data.id !== undefined) pendingRef.current.get(data.id)?.(data.text ?? "");
        else if (data.type === "error") {
          if (data.id !== undefined) pendingRef.current.get(data.id)?.("");
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
      saveDraft(lessonId, joinSegments(partsRef.current.filter((part): part is Part => part !== undefined)));
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

  // Nivel do som da guia agora (0 a 1); sem medidor devolve 1 para nunca contar silencio.
  function currentLevel() {
    const monitor = monitorRef.current;

    if (!monitor) return 1;

    const samples = new Float32Array(monitor.analyser.fftSize);
    monitor.analyser.getFloatTimeDomainData(samples);
    return rms(samples);
  }

  function startTick() {
    silentRef.current = 0;
    tickRef.current = window.setInterval(() => {
      elapsedRef.current += 1;
      setElapsed(elapsedRef.current);
      silentRef.current = currentLevel() < SILENCE_LEVEL ? silentRef.current + 1 : 0;

      // O Drive nao avisa quando o video acaba: com a duracao da aula conhecida, o fim e tempo cumprido + silencio.
      if (shouldAutoFinish({ elapsed: elapsedRef.current, durationSeconds, silentSeconds: silentRef.current })) {
        void finishRef.current("Fim da aula detectado: gravacao finalizada. ");
      }
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
    changePhase("paused");
    setMessage("Gravacao pausada. Pause tambem o video e clique em Retomar quando continuar a aula.");
  }

  function resume() {
    startSegment(seqRef.current + 1, elapsedRef.current);
    startTick();
    changePhase("recording");
    setMessage("");
  }

  // Mostra o texto para conferir; nada vai ao banco ate o aluno confirmar, mas o rascunho fica no navegador.
  function toReview(text: string, note: string, notice = "") {
    saveDraft(lessonId, text);
    setDraft(text);
    changePhase("review");
    setMessage(notice + note);
  }

  async function finish(notice = "") {
    if (stoppingRef.current) return;

    stoppingRef.current = true;
    changePhase("finishing");
    setMessage("Terminando os ultimos trechos...");
    stopTimers();
    await closeCurrentSegment();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    await queueRef.current;
    workerRef.current?.terminate();
    workerRef.current = null;
    void monitorRef.current?.context.close();
    monitorRef.current = null;

    const text = joinSegments(partsRef.current.filter((part): part is Part => part !== undefined));

    if (!text) {
      changePhase("error");
      setMessage("Nao foi captada nenhuma fala. Confira se a aula tocou com som e se o audio da guia foi compartilhado.");
      return;
    }

    toReview(
      text,
      failedRef.current > 0
        ? `${failedRef.current} trecho(s) de 1 minuto falharam e estao marcados no texto.`
        : "Confira o texto, corrija se precisar e salve.",
      notice,
    );
  }

  finishRef.current = finish;

  async function requestYoutubeChunk(startSeconds: number, endSeconds: number, signal: AbortSignal) {
    const url = `/app/transcribe/youtube-gemini?courseId=${courseId}&lessonId=${lessonId}&start=${startSeconds}&end=${endSeconds}`;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await fetch(url, { method: "POST", signal });

      if (response.ok) return ((await response.json()) as { text: string }).text;

      const error = ((await response.json().catch(() => ({}))) as { error?: string }).error ?? "failed";

      if (response.status === 429 || error === "quota") {
        if (attempt === 2) throw new Error("quota");

        await new Promise((resolve) => setTimeout(resolve, 15_000));
        continue;
      }

      if (["invalid_key", "not_configured", "forbidden", "unsupported"].includes(error)) throw new Error(error);

      // Sem a duracao, o Gemini recusa o trecho que passa do fim do video: o que veio ate la e a aula.
      if (attempt === 2) throw new Error(durationSeconds ? "failed" : "range");
    }

    throw new Error("failed");
  }

  // Aulas do YouTube: o Gemini le o video pelos servidores do Google, em trechos de 5 min, sem gravar nada aqui.
  async function importFromYoutube() {
    const controller = new AbortController();
    const parts: Part[] = [];
    let cursor = 0;
    let emptyRun = 0;

    abortRef.current = controller;
    changePhase("importing");

    try {
      for (let chunk = nextChunk(cursor, durationSeconds); chunk; chunk = nextChunk(cursor, durationSeconds)) {
        setMessage(`Transcrevendo pelo Gemini: ${clock(chunk.start)}${durationSeconds ? ` de ${clock(durationSeconds)}` : ""}...`);

        const text = await requestYoutubeChunk(chunk.start, chunk.end, controller.signal);

        if (text) parts.push({ start: chunk.start, text });

        saveDraft(lessonId, joinSegments(parts));
        emptyRun = text ? 0 : emptyRun + 1;
        cursor = chunk.end;

        // Sem duracao conhecida, dois trechos seguidos sem fala indicam o fim do video.
        if (!durationSeconds && emptyRun >= 2) break;
      }

      const text = joinSegments(parts);

      if (!text) throw new Error("empty");

      toReview(text, "Confira o texto, corrija se precisar e salve.");
    } catch (error) {
      if (controller.signal.aborted) return;

      const partial = joinSegments(parts);

      if (partial && error instanceof Error && error.message === "range") {
        toReview(partial, "Confira o texto, corrija se precisar e salve.");
        return;
      }

      changePhase("error");
      setMessage(youtubeErrorMessage(error));
    } finally {
      abortRef.current = null;
    }
  }

  function discard() {
    stoppingRef.current = true;
    cleanup();
    partsRef.current = [];
    clearDraft(lessonId);
    setSaved(null);
    setDraft("");
    setMessage("");
    changePhase("idle");
  }

  async function save() {
    changePhase("saving");
    setMessage("Salvando a transcricao...");

    const result = await saveRecordedTranscriptAction({ courseId, lessonId, text: draft });

    if (result === "ok" || result === "exists") {
      // So agora o banco tem o texto: o rascunho local pode sair.
      clearDraft(lessonId);
      changePhase("done");
      setMessage("Transcricao salva.");
      router.refresh();
    } else {
      changePhase("review");
      setMessage("Nao foi possivel salvar. Tente de novo; o texto continua guardado neste navegador.");
    }
  }

  function monitorAudio(stream: MediaStream) {
    try {
      const context = new AudioContext();
      const analyser = context.createAnalyser();

      context.createMediaStreamSource(new MediaStream(stream.getAudioTracks())).connect(analyser);
      monitorRef.current = { context, analyser };
    } catch {
      // Sem medidor, so o fim do video (YouTube) e o botao Finalizar encerram.
      monitorRef.current = null;
    }
  }

  async function start() {
    stoppingRef.current = false;
    partsRef.current = [];
    failedRef.current = 0;
    queueRef.current = Promise.resolve();
    elapsedRef.current = 0;
    cachedRef.current = false;
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
      // Pede ao navegador para nao apagar o modelo baixado quando faltar espaco.
      void navigator.storage?.persist?.();
      monitorAudio(stream);

      if (method === "browser") {
        changePhase("loading");
        setMessage("Preparando o modelo de transcricao...");
        workerRef.current = await loadWorker();
      }

      // Se o compartilhamento for encerrado pelo navegador, o que foi captado vai para conferencia, nao e salvo direto.
      stream.getAudioTracks()[0].onended = () => void finish();
      startSegment(0, 0);
      startTick();
      changePhase("recording");
      setMessage("");
    } catch (error) {
      cleanup();
      changePhase("error");
      setMessage(
        error instanceof Error && error.message === "no_audio"
          ? 'Sem audio. Na janela do navegador, escolha a guia desta aula e marque "Compartilhar audio da guia".'
          : error instanceof DOMException && error.name === "NotAllowedError"
            ? "Compartilhamento cancelado."
            : "Nao foi possivel iniciar. Use o Chrome ou o Edge no computador.",
      );
    }
  }

  const active = phase === "recording" || phase === "paused";
  const idle = phase === "idle" || phase === "error" || phase === "done";

  if (!canRecord && !youtubeGemini) {
    return (
      <p className="mt-2 text-sm text-copy-secondary">
        Para transcrever esta aula, use o Chrome ou o Edge em um computador.
      </p>
    );
  }

  return (
    <div className="mt-2 space-y-3 text-sm text-copy-secondary">
      {idle && saved ? (
        <div className="space-y-2 rounded-md border border-brand-primary/40 p-3">
          <p>
            Ha uma transcricao desta aula que nao foi salva (guardada neste navegador em{" "}
            {new Date(saved.savedAt).toLocaleString("pt-BR")}). Pode estar incompleta.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              className={primaryButton}
              onClick={() => toReview(saved.text, "Rascunho recuperado. Confira o texto, corrija se precisar e salve.")}
              type="button"
            >
              Revisar e salvar
            </button>
            <button className={secondaryButton} onClick={discard} type="button">
              Descartar rascunho
            </button>
          </div>
        </div>
      ) : null}

      {idle && canRecord ? (
        <p>
          Como fazer: clique em Transcrever, escolha a guia desta aula e marque &quot;Compartilhar audio da guia&quot;.
          Depois volte o video ao inicio e de play. A transcricao acompanha a aula em tempo real: deixe a guia aberta,
          com som, ate o fim. A gravacao termina sozinha quando a aula acaba (se nao terminar, clique em Finalizar). Se
          precisar parar, use Pausar e depois Retomar.{" "}
          {method === "browser"
            ? "O texto e feito no seu computador; na primeira vez e baixado um modelo de 80 a 150 MB, que fica salvo no navegador."
            : "O audio e enviado em pedacos de 1 minuto ao Gemini e nao fica guardado."}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        {idle && youtubeGemini ? (
          <button className={primaryButton} onClick={() => void importFromYoutube()} type="button">
            Transcrever pelo Gemini (sem gravar)
          </button>
        ) : null}
        {idle && canRecord ? (
          <button className={youtubeGemini ? secondaryButton : primaryButton} onClick={() => void start()} type="button">
            Transcrever gravando o audio
          </button>
        ) : null}
        {phase === "importing" ? (
          <button className={secondaryButton} onClick={discard} type="button">
            Cancelar
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
