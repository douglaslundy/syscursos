"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import { saveLessonNoteAction } from "@/server/actions/student-actions";

type LessonNoteEditorProps = {
  courseId: string;
  lessonId: string;
  initialContent: string;
};

export function LessonNoteEditor({ courseId, lessonId, initialContent }: LessonNoteEditorProps) {
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
          setContent(result.content);
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
    <section className="mt-6 rounded-md border bg-background p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold tracking-normal">Anotacoes da aula</h2>
          <p className="text-sm text-muted-foreground">Autosave ativo enquanto voce escreve.</p>
        </div>
        <span className="text-xs text-muted-foreground">{isPending ? "Salvando..." : message}</span>
      </div>
      <textarea
        className="min-h-48 w-full rounded-md border bg-background p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        maxLength={12000}
        onChange={(event) => setContent(event.target.value)}
        placeholder="Escreva seu resumo desta aula..."
        value={content}
      />
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{content.length}/12000</span>
        <button
          className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
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
