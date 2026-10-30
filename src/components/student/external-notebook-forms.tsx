"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { ExternalTranscriber } from "@/components/student/external-transcriber";
import { clearFieldDrafts, useFieldDraft } from "@/components/student/use-field-draft";
import { buttonClass, primaryClass } from "@/components/student/study-modal";
import { MAX_EXTERNAL_TEXT } from "@/lib/external-notebook";
import {
  addLessonAction,
  createNotebookAction,
  deleteLessonAction,
  deleteNotebookAction,
  renameNotebookAction,
  updateLessonAction,
} from "@/server/actions/external-notebook-actions";
import type { ExternalResult } from "@/server/services/external-notebook-service";

const BASE = "/app/notebooks/external";
const fieldClass = "w-full rounded-md border px-3 py-2 text-sm outline-none";
const errorText: Record<"invalid" | "limit" | "forbidden", string> = {
  invalid: "Confira os campos e tente de novo.",
  limit: "Limite atingido.",
  forbidden: "Voce nao tem acesso a este item.",
};

function messageOf(result: Extract<ExternalResult, { ok: false }>) {
  return result.message ?? errorText[result.error];
}

export function NewNotebookForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createNotebookAction({ title });

      if (result.ok) router.push(`${BASE}/${result.id}`);
      else setError(messageOf(result));
    });
  }

  return (
    <form className="mb-6 flex flex-col gap-3 sm:flex-row" onSubmit={submit}>
      <input aria-label="Nome do curso" className={`${fieldClass} min-h-11 flex-1`} maxLength={150} onChange={(event) => setTitle(event.target.value)} placeholder="Nome do curso (ex.: Direito Constitucional)" required value={title} />
      <button className={primaryClass} disabled={pending} type="submit">
        {pending ? "Criando..." : "Criar caderno"}
      </button>
      {error ? <p className="text-sm text-destructive sm:basis-full">{error}</p> : null}
    </form>
  );
}

export function NotebookActions({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(title);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function rename(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await renameNotebookAction(id, { title: name });

      if (result.ok) {
        setEditing(false);
        router.refresh();
      } else setError(messageOf(result));
    });
  }

  function remove() {
    if (!window.confirm("Excluir este caderno e todas as aulas dele? Isso nao pode ser desfeito.")) return;

    startTransition(async () => {
      if (await deleteNotebookAction(id)) router.push(BASE);
      else setError(errorText.forbidden);
    });
  }

  return (
    <div className="mt-3">
      {editing ? (
        <form className="flex flex-col gap-2 sm:flex-row" onSubmit={rename}>
          <input aria-label="Nome do curso" className={`${fieldClass} min-h-10 flex-1`} maxLength={150} onChange={(event) => setName(event.target.value)} required value={name} />
          <button className={primaryClass} disabled={pending} type="submit">
            Salvar
          </button>
          <button className={buttonClass} onClick={() => setEditing(false)} type="button">
            Cancelar
          </button>
        </form>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button className={buttonClass} onClick={() => setEditing(true)} type="button">
            Renomear
          </button>
          <button className={buttonClass} disabled={pending} onClick={remove} type="button">
            Excluir caderno
          </button>
        </div>
      )}
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

type LessonFormProps = {
  notebookId: string;
  // Presente = edicao.
  lesson?: { id: string; title: string; transcript: string | null; summary: string | null };
};

export function ExternalLessonForm({ notebookId, lesson }: LessonFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(lesson?.title ?? "");
  const [transcript, setTranscript] = useState(lesson?.transcript ?? "");
  const [summary, setSummary] = useState(lesson?.summary ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  // Aula nova e cada aula editada tem rascunho proprio no navegador, ate a aula ser salva.
  const draftKey = `external:${notebookId}:${lesson?.id ?? "new"}`;
  const draftKeys = ["title", "transcript", "summary"].map((field) => `${draftKey}:${field}`);
  const restored = [
    useFieldDraft(draftKeys[0], title, setTitle),
    useFieldDraft(draftKeys[1], transcript, setTranscript),
    useFieldDraft(draftKeys[2], summary, setSummary),
  ].some(Boolean);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const input = { title, transcript, summary };
      const result = lesson ? await updateLessonAction(lesson.id, input) : await addLessonAction(notebookId, input);

      if (!result.ok) return setError(messageOf(result));

      clearFieldDrafts([...draftKeys, `${draftKey}:recording`]);
      router.push(`${BASE}/${notebookId}/lessons/${"id" in result ? result.id : lesson?.id}`);
      router.refresh();
    });
  }

  return (
    <form className="grid gap-4" onSubmit={submit}>
      <label className="grid gap-2 text-sm font-medium">
        Titulo da aula
        <input className={`${fieldClass} min-h-11`} maxLength={200} onChange={(event) => setTitle(event.target.value)} required value={title} />
      </label>
      {restored ? <p className="text-xs text-brand-primary">Rascunho recuperado deste navegador: esta aula ainda nao foi salva.</p> : null}
      <ExternalTranscriber draftKey={`${draftKey}:recording`} onText={(text) => setTranscript((current) => (current.trim() ? `${current.trimEnd()}
${text}` : text))} />
      <label className="grid gap-2 text-sm font-medium">
        Transcricao
        <textarea className={`${fieldClass} min-h-48`} maxLength={MAX_EXTERNAL_TEXT} onChange={(event) => setTranscript(event.target.value)} value={transcript} />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Resumo
        <textarea className={`${fieldClass} min-h-32`} maxLength={MAX_EXTERNAL_TEXT} onChange={(event) => setSummary(event.target.value)} value={summary} />
      </label>
      <p className="text-xs text-muted-foreground">
        Preencha a transcricao ou o resumo (ao menos um). A IA usa a transcricao; sem ela, usa o resumo.
        {lesson ? " Se voce mudar o texto-fonte, os materiais gerados e a revisao desta aula sao refeitos." : ""}
      </p>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button className={primaryClass} disabled={pending} type="submit">
          {pending ? "Salvando..." : "Salvar aula"}
        </button>
        <button className={buttonClass} onClick={() => router.back()} type="button">
          Cancelar
        </button>
      </div>
    </form>
  );
}

export function DeleteLessonButton({ notebookId, lessonId }: { notebookId: string; lessonId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function remove() {
    if (!window.confirm("Excluir esta aula e os materiais gerados? Isso nao pode ser desfeito.")) return;

    startTransition(async () => {
      if (await deleteLessonAction(lessonId)) router.push(`${BASE}/${notebookId}`);
    });
  }

  return (
    <button className={buttonClass} disabled={pending} onClick={remove} type="button">
      Excluir aula
    </button>
  );
}
