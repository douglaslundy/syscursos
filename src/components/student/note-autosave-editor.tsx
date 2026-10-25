"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import { saveLessonNoteAction } from "@/server/actions/student-actions";
import { formatTimeBr } from "@/lib/format-date";

type NoteAutosaveEditorProps = {
  courseId: string;
  lessonId: string;
  initialContent: string;
  title: string;
  description: string;
  textareaId: string;
  placeholder: string;
  className?: string;
  // Link do PDF das anotacoes; fica desabilitado enquanto nao ha nada salvo.
  pdfHref?: string;
  // Comeca fechado; o aluno abre ao clicar no titulo.
  collapsible?: boolean;
};

export function NoteAutosaveEditor({
  courseId,
  lessonId,
  initialContent,
  title,
  description,
  textareaId,
  placeholder,
  className = "mt-6 rounded-md border bg-card p-5 shadow-sm",
  pdfHref,
  collapsible = false,
}: NoteAutosaveEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [lastSavedContent, setLastSavedContent] = useState(initialContent);
  const [message, setMessage] = useState("Salvo");
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(
    (nextContent: string) => {
      startTransition(async () => {
        setMessage("Salvando...");
        const result = await saveLessonNoteAction({
          courseId,
          lessonId,
          content: nextContent,
        });

        if (result.ok) {
          setLastSavedContent(result.content);
          setContent((currentContent) =>
            currentContent === nextContent ? result.content : currentContent,
          );
          setMessage(
            `Salvo em ${formatTimeBr(result.updatedAt)}`,
          );
          return;
        }

        setMessage(result.message);
      });
    },
    [courseId, lessonId],
  );

  useEffect(() => {
    if (content === lastSavedContent) {
      return;
    }

    setMessage("Alteracoes pendentes");

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      save(content);
    }, 900);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [content, lastSavedContent, save]);

  const header = (
    <div className="flex items-center justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold tracking-normal">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <span aria-live="polite" className="text-xs text-muted-foreground">
        {isPending ? "Salvando..." : message}
      </span>
    </div>
  );
  const fields = (
    <>
      <label className="sr-only" htmlFor={textareaId}>
        {title}
      </label>
      <textarea
        className="min-h-56 w-full resize-y rounded-md border p-3 text-sm leading-6 outline-none focus-visible:ring-2"
        id={textareaId}
        maxLength={12000}
        onChange={(event) => setContent(event.target.value)}
        placeholder={placeholder}
        value={content}
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">{content.length}/12000</span>
        {pdfHref ? (
          lastSavedContent.trim() ? (
            <a
              className="inline-flex min-h-10 items-center justify-center rounded-md border border-stroke-subtle px-4 text-sm font-medium text-copy-secondary transition hover:bg-surface-hover hover:text-copy-primary"
              href={pdfHref}
            >
              Baixar anotacoes em PDF
            </a>
          ) : (
            <span
              aria-disabled="true"
              className="inline-flex min-h-10 cursor-not-allowed items-center justify-center rounded-md border border-stroke-subtle px-4 text-sm font-medium text-copy-muted opacity-50"
              title="Escreva e salve uma anotacao para baixar"
            >
              Baixar anotacoes em PDF
            </span>
          )
        ) : null}
        <button
          className="inline-flex min-h-10 items-center justify-center rounded-md bg-brand-primary px-4 text-sm font-medium text-copy-primary transition hover:bg-brand-primaryHover disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isPending || content === lastSavedContent}
          onClick={() => save(content)}
          type="button"
        >
          Salvar agora
        </button>
      </div>
    </>
  );

  return (
    <section className={className}>
      {collapsible ? (
        <>
          {header}
          <details className="mt-3">
            <summary className="cursor-pointer text-sm text-copy-secondary">Mostrar ou ocultar</summary>
            <div className="mt-3">{fields}</div>
          </details>
        </>
      ) : (
        <>
          <div className="mb-3">{header}</div>
          {fields}
        </>
      )}
    </section>
  );
}
