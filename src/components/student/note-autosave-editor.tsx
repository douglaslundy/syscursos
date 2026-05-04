"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import { saveLessonNoteAction } from "@/server/actions/student-actions";

type NoteAutosaveEditorProps = {
  courseId: string;
  lessonId: string;
  initialContent: string;
  title: string;
  description: string;
  textareaId: string;
  placeholder: string;
  className?: string;
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
            `Salvo em ${new Intl.DateTimeFormat("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            }).format(new Date(result.updatedAt))}`,
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

  return (
    <section className={className}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-normal">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <span aria-live="polite" className="text-xs text-muted-foreground">
          {isPending ? "Salvando..." : message}
        </span>
      </div>
      <label className="sr-only" htmlFor={textareaId}>
        {title}
      </label>
      <textarea
        className="min-h-56 w-full resize-y rounded-md border bg-background p-3 text-sm leading-6 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        id={textareaId}
        maxLength={12000}
        onChange={(event) => setContent(event.target.value)}
        placeholder={placeholder}
        value={content}
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">{content.length}/12000</span>
        <button
          className="inline-flex min-h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isPending || content === lastSavedContent}
          onClick={() => save(content)}
          type="button"
        >
          Salvar agora
        </button>
      </div>
    </section>
  );
}
