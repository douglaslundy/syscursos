import { SubmitButton } from "@/components/admin/submit-button";
import { LessonTranscriber } from "@/components/student/lesson-transcriber";
import { generateTranscriptAction, resetTranscriptAction } from "@/server/actions/transcript-actions";

const messages: Record<string, { text: string; ok: boolean }> = {
  ok: { text: "Transcricao gerada.", ok: true },
  reset: { text: "Transcricao apagada. Voce pode transcrever de novo.", ok: true },
  not_owner: { text: "Esta transcricao foi feita por outro aluno e so ele pode apagar.", ok: false },
  exists: { text: "Esta aula ja tem transcricao.", ok: true },
  unavailable: {
    text: "Nao foi possivel obter a legenda deste video (sem legenda ou YouTube indisponivel). Tente mais tarde.",
    ok: false,
  },
};

type LessonTranscriptProps = {
  courseId: string;
  lessonId: string;
  transcript: string | null;
  isYouTube: boolean;
  canReset: boolean;
  method: "browser" | "gemini";
  status?: string;
};

export function LessonTranscript({ courseId, lessonId, transcript, isYouTube, canReset, method, status }: LessonTranscriptProps) {
  const message = status ? messages[status] : undefined;

  return (
    <section className="mt-6 rounded-md border border-stroke-subtle bg-surface p-4" id="transcricao">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-copy-muted">Transcricao da aula</h2>
        {transcript && canReset ? (
          <form action={resetTranscriptAction}>
            <input name="courseId" type="hidden" value={courseId} />
            <input name="lessonId" type="hidden" value={lessonId} />
            <SubmitButton destructive confirmMessage="Apagar esta transcricao para fazer de novo? Vale para todos os alunos.">
              Apagar e refazer
            </SubmitButton>
          </form>
        ) : null}
        {transcript || !isYouTube ? null : (
          <form action={generateTranscriptAction}>
            <input name="courseId" type="hidden" value={courseId} />
            <input name="lessonId" type="hidden" value={lessonId} />
            <SubmitButton>Gerar transcricao</SubmitButton>
          </form>
        )}
      </div>
      {message ? (
        <p className={`mt-2 text-sm ${message.ok ? "text-green-500" : "text-destructive"}`}>{message.text}</p>
      ) : null}
      {transcript ? (
        <details className="mt-3" open>
          <summary className="cursor-pointer text-sm text-copy-secondary">Mostrar ou ocultar</summary>
          <p className="mt-2 max-h-96 overflow-y-auto whitespace-pre-wrap text-sm leading-6 text-copy-secondary">
            {transcript}
          </p>
        </details>
      ) : isYouTube ? (
        <p className="mt-2 text-sm text-copy-secondary">
          Gera o texto da fala a partir da legenda do video (aulas do YouTube).
        </p>
      ) : (
        <LessonTranscriber courseId={courseId} lessonId={lessonId} method={method} />
      )}
    </section>
  );
}
