import { SubmitButton } from "@/components/admin/submit-button";
import { saveLessonAction } from "@/server/actions/admin-actions";

type LessonFormProps = {
  moduleId: string;
  suggestedPosition: number;
  formResetToken?: string;
  redirectTo?: string;
  lesson?: {
    id: string;
    title: string;
    description: string;
    youtubeUrl: string;
    youtubeVideoId: string;
    coverImageUrl: string;
    position: number;
    status: string;
  };
};

export function LessonForm({
  moduleId,
  lesson,
  suggestedPosition,
  formResetToken = "idle",
  redirectTo,
}: LessonFormProps) {
  const baseKey = `${moduleId}-${lesson?.id ?? "new"}-${formResetToken}`;
  return (
    <form
      action={saveLessonAction}
      autoComplete="off"
      className="grid gap-3 md:grid-cols-[1fr_100px_140px_auto]"
      encType="multipart/form-data"
      key={baseKey}
    >
      <input name="moduleId" type="hidden" value={moduleId} />
      {redirectTo ? <input name="redirectTo" type="hidden" value={redirectTo} /> : null}
      {lesson ? <input name="id" type="hidden" value={lesson.id} /> : null}
      <input
        className="rounded-md border px-3 py-2 text-sm outline-none"
        defaultValue={lesson?.title ?? ""}
        key={`${baseKey}-title`}
        name="title"
        placeholder="Titulo"
      />
      <input
        className="rounded-md border px-3 py-2 text-sm outline-none"
        defaultValue={lesson?.position ?? suggestedPosition}
        key={`${baseKey}-position`}
        min={1}
        name="position"
        type="number"
      />
      <select
        className="rounded-md border px-3 py-2 text-sm outline-none"
        defaultValue={lesson?.status ?? "ACTIVE"}
        key={`${baseKey}-status`}
        name="status"
      >
        <option value="ACTIVE">Ativo</option>
        <option value="INACTIVE">Inativo</option>
      </select>
      <SubmitButton>{lesson ? "Salvar" : "Criar"}</SubmitButton>
      <input
        className="rounded-md border px-3 py-2 text-sm outline-none md:col-span-2"
        defaultValue={lesson?.youtubeUrl ?? ""}
        key={`${baseKey}-youtubeUrl`}
        name="youtubeUrl"
        placeholder="YouTube, Google Drive ou OneDrive"
        type="url"
      />
      <input
        className="rounded-md border px-3 py-2 text-sm outline-none"
        defaultValue={lesson?.youtubeVideoId ?? ""}
        key={`${baseKey}-youtubeVideoId`}
        name="youtubeVideoId"
        placeholder="Video ID do YouTube (opcional)"
      />
      <input
        className="rounded-md border px-3 py-2 text-sm outline-none md:col-span-3"
        defaultValue={lesson?.coverImageUrl ?? ""}
        key={`${baseKey}-coverImageUrl`}
        name="coverImageUrl"
        placeholder="URL HTTPS da capa da aula (opcional)"
        type="url"
      />
      <input
        accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
        className="rounded-md border px-3 py-2 text-sm outline-none md:col-span-3"
        key={`${baseKey}-coverImageFile`}
        name="coverImageFile"
        type="file"
      />
      <textarea
        className="rounded-md border px-3 py-2 text-sm outline-none md:col-span-3"
        defaultValue={lesson?.description ?? ""}
        key={`${baseKey}-description`}
        name="description"
        placeholder="Descricao"
      />
    </form>
  );
}
