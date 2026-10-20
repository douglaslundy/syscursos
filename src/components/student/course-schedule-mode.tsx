import { SubmitButton } from "@/components/admin/submit-button";
import { setCourseModeAction } from "@/server/actions/study-plan-actions";
import type { CourseMode } from "@/server/services/study-plan-service";

// Pergunta, na pagina do curso, como o cronograma deve dividir as aulas deste curso (so se ele ja esta no cronograma).
export function CourseScheduleMode({ courseId, mode }: { courseId: string; mode: CourseMode }) {
  return (
    <form action={setCourseModeAction} className="mt-4 max-w-xl space-y-2 rounded-md border border-stroke-subtle bg-surface p-4 text-sm">
      <input name="courseId" type="hidden" value={courseId} />
      <p className="font-medium text-copy-primary">No seu cronograma, como dividir as aulas deste curso?</p>
      <label className="flex items-start gap-2 text-copy-secondary">
        <input className="mt-1" defaultChecked={mode === "sequential"} name="mode" type="radio" value="sequential" />
        <span>Sequencial (padrao): uma aula depois da outra, na ordem do curso.</span>
      </label>
      <label className="flex items-start gap-2 text-copy-secondary">
        <input className="mt-1" defaultChecked={mode === "modules"} name="mode" type="radio" value="modules" />
        <span>Dividir por modulos: os modulos avancam juntos, com o mesmo tempo por semana para cada um.</span>
      </label>
      <SubmitButton>Aplicar e refazer cronograma</SubmitButton>
    </form>
  );
}
