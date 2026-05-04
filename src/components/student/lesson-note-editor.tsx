import { NoteAutosaveEditor } from "@/components/student/note-autosave-editor";

type LessonNoteEditorProps = {
  courseId: string;
  lessonId: string;
  initialContent: string;
};

export function LessonNoteEditor({ courseId, lessonId, initialContent }: LessonNoteEditorProps) {
  return (
    <NoteAutosaveEditor
      courseId={courseId}
      description="Autosave ativo enquanto voce escreve."
      initialContent={initialContent}
      lessonId={lessonId}
      placeholder="Escreva seu resumo desta aula..."
      textareaId="lesson-note-content"
      title="Anotacoes da aula"
    />
  );
}
