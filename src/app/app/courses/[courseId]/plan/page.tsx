import Link from "next/link";

import { StudyCalendar, formatClock, formatDate, formatMinutes } from "@/components/student/study-calendar";
import { saveStudyPlanAction } from "@/server/actions/study-plan-actions";
import { getStudyPlanView } from "@/server/services/study-plan-service";
import { studentCourseParamsSchema } from "@/server/validators/student";

type StudyPlanPageProps = {
  params: { courseId: string };
  searchParams?: Record<string, string | string[] | undefined>;
};

const messages: Record<string, { text: string; ok: boolean }> = {
  saved: { text: "Plano de estudos atualizado.", ok: true },
  invalid: { text: "Preencha apenas um campo: data final, quantidade de dias ou horas por dia.", ok: false },
  no_lessons: { text: "Voce ja concluiu todas as aulas deste curso.", ok: false },
  past_date: { text: "A data final precisa ser hoje ou depois.", ok: false },
  no_study_days: { text: "Nao ha dias de estudo ate essa data. Ajuste seus dias em Meus dados.", ok: false },
  after_expiry: { text: "A data final passa do fim da sua matricula. Escolha uma data anterior.", ok: false },
};

const inputClass = "w-full rounded-md border border-stroke-subtle bg-surface px-3 py-2 text-sm text-copy-primary";

export default async function StudyPlanPage({ params, searchParams }: StudyPlanPageProps) {
  const { courseId } = studentCourseParamsSchema.parse(params);
  const view = await getStudyPlanView(courseId);
  const status = typeof searchParams?.status === "string" ? messages[searchParams.status] : undefined;
  const { prefs, remaining, plan } = view;
  const defaultHours = Math.max(0.5, (prefs.studyEndMinute - prefs.studyStartMinute) / 60);

  return (
    <section>
      <Link className="text-sm font-medium text-copy-secondary hover:text-brand-primary" href={`/app/courses/${courseId}`}>
        Voltar para o curso
      </Link>
      <p className="mt-3 text-sm font-medium text-brand-primary">Cronograma de estudos</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-normal text-copy-primary md:text-4xl">{view.course.title}</h1>
      <p className="mt-3 text-sm text-copy-secondary">
        Faltam {remaining.lessons} aulas, cerca de {formatMinutes(Math.ceil(remaining.seconds / 60))} de conteudo. Seus dias e
        horarios ficam em{" "}
        <Link className="text-brand-primary underline" href="/app/me">
          Meus dados
        </Link>
        .
      </p>
      {remaining.estimatedLessons > 0 ? (
        <p className="mt-1 text-xs text-copy-muted">
          {remaining.estimatedLessons} aulas sem duracao cadastrada contam 10 min cada.
        </p>
      ) : null}

      {status ? (
        <div
          className={`mt-4 rounded-md border px-4 py-3 text-sm ${status.ok ? "border-success text-success" : "border-destructive text-destructive"}`}
        >
          {status.text}
        </div>
      ) : null}

      {remaining.lessons === 0 ? (
        <p className="mt-6 text-sm text-copy-secondary">Curso concluido. Nada a planejar.</p>
      ) : (
        <form action={saveStudyPlanAction} className="mt-6 grid gap-3 rounded-md border border-stroke-subtle bg-surface p-4 md:grid-cols-3">
          <input name="courseId" type="hidden" value={courseId} />
          <p className="text-sm text-copy-secondary md:col-span-3">Preencha apenas um dos campos abaixo.</p>
          <label className="grid gap-1 text-sm text-copy-secondary">
            Concluir ate a data
            <input className={inputClass} min={view.today} name="targetDate" type="date" />
          </label>
          <label className="grid gap-1 text-sm text-copy-secondary">
            Concluir em quantos dias
            <input className={inputClass} max={3650} min={1} name="days" placeholder="Ex.: 60" type="number" />
          </label>
          <label className="grid gap-1 text-sm text-copy-secondary">
            Horas de estudo por dia
            <input className={inputClass} inputMode="decimal" name="hoursPerDay" placeholder={`Ex.: ${defaultHours}`} />
          </label>
          <button
            className="rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-copy-primary md:col-span-3 md:justify-self-start"
            type="submit"
          >
            Gerar cronograma
          </button>
        </form>
      )}

      {plan ? (
        <div className="mt-8 space-y-6">
          <div className="rounded-md border border-stroke-subtle bg-surface p-4 text-sm text-copy-secondary">
            <p>
              <span className="font-semibold text-copy-primary">{formatMinutes(plan.dailyMinutes)} por dia</span>, comecando as{" "}
              {formatClock(prefs.studyStartMinute)}.
            </p>
            {plan.finishDate ? (
              <p className="mt-1">
                Termino estimado: <span className="font-semibold text-copy-primary">{formatDate(plan.finishDate)}</span>
                {plan.targetDate ? ` (meta: ${formatDate(plan.targetDate)})` : null}.
              </p>
            ) : null}
            {plan.overdue > 0 ? (
              <p className="mt-1 text-destructive">
                {plan.overdue} aulas atrasadas. Assista-as ou replaneje com uma nova data.
              </p>
            ) : null}
            <p className="mt-2 text-xs text-copy-muted">
              Clique numa aula para abri-la. Ponto verde: assistida, cinza: pendente, vermelho: atrasada.
            </p>
          </div>
          <StudyCalendar courseId={courseId} days={plan.days} today={view.today} />
        </div>
      ) : null}
    </section>
  );
}
