import Link from "next/link";

import { ScheduleForm } from "@/components/student/schedule-form";
import {
  COURSE_COLORS,
  StudyCalendar,
  formatClock,
  formatDate,
  formatMinutes,
} from "@/components/student/study-calendar";
import { SubmitButton } from "@/components/admin/submit-button";
import { removeStudyPlanAction, saveStudyPlanAction } from "@/server/actions/study-plan-actions";
import { MAX_SCHEDULE_COURSES, getStudyScheduleView } from "@/server/services/study-plan-service";

type SchedulePageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

const messages: Record<string, { text: string; ok: boolean }> = {
  saved: { text: "Cronograma atualizado.", ok: true },
  removed: { text: "Cronograma apagado.", ok: true },
  invalid: { text: "Escolha de 1 a 5 cursos e informe os minutos por dia ou a data final.", ok: false },
  invalid_courses: { text: "Um dos cursos escolhidos nao esta disponivel para voce.", ok: false },
  too_many: { text: "Escolha no maximo 5 cursos.", ok: false },
  no_lessons: { text: "Voce ja concluiu todas as aulas dos cursos escolhidos.", ok: false },
  past_date: { text: "A data final precisa ser hoje ou depois.", ok: false },
  no_study_days: { text: "Nao ha dias de estudo ate essa data. Ajuste seus dias em Meus dados.", ok: false },
  after_expiry: { text: "O cronograma termina depois do fim da matricula de algum curso. Aumente o tempo por dia ou escolha uma data anterior.", ok: false },
  too_long: { text: "Com esse tempo por dia o cronograma passa de 10 anos. Aumente os minutos por dia.", ok: false },
};

export default async function SchedulePage({ searchParams }: SchedulePageProps) {
  const view = await getStudyScheduleView();
  const status = typeof searchParams?.status === "string" ? messages[searchParams.status] : undefined;
  const { prefs, plan, options } = view;
  const editing = !plan || searchParams?.edit === "1";
  const selected = plan ? plan.courses.filter((course) => course.remainingLessons > 0).map((course) => course.id) : [];
  const defaultMinutes = Math.max(10, prefs.studyEndMinute - prefs.studyStartMinute);
  const hasOtherCourses = plan ? options.some((option) => option.lessons > 0 && !selected.includes(option.id)) : false;

  return (
    <section>
      <Link className="text-sm font-medium text-copy-secondary hover:text-brand-primary" href="/app">
        Voltar para meus cursos
      </Link>
      <p className="mt-3 text-sm font-medium text-brand-primary">Cronograma de estudos</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-normal text-copy-primary md:text-4xl">Meu cronograma</h1>
      <p className="mt-3 text-sm text-copy-secondary">
        Seus dias e horarios de estudo ficam em{" "}
        <Link className="text-brand-primary underline" href="/app/me">
          Meus dados
        </Link>
        . Aulas sem duracao cadastrada contam 10 min.
      </p>

      {status ? (
        <div
          className={`mt-4 rounded-md border px-4 py-3 text-sm ${status.ok ? "border-green-500 text-green-500" : "border-destructive text-destructive"}`}
        >
          {status.text}
        </div>
      ) : null}

      {options.length === 0 ? (
        <p className="mt-6 text-sm text-copy-secondary">Voce ainda nao tem cursos disponiveis para planejar.</p>
      ) : editing ? (
        <ScheduleForm
          action={saveStudyPlanAction}
          defaultMinutes={defaultMinutes}
          maxCourses={MAX_SCHEDULE_COURSES}
          minDate={view.today}
          options={options}
          modules={plan?.modes ?? {}}
          selected={selected}
        />
      ) : plan ? (
        <div className="mt-6 space-y-6">
          <div className="rounded-md border border-stroke-subtle bg-surface p-4 text-sm text-copy-secondary">
            <p>
              <span className="font-semibold text-copy-primary">{formatMinutes(plan.dailyMinutes)} por dia</span>, comecando as{" "}
              {formatClock(prefs.studyStartMinute)}, dividido entre os cursos abaixo.
            </p>
            {plan.finishDate ? (
              <p className="mt-1">
                Termino estimado: <span className="font-semibold text-copy-primary">{formatDate(plan.finishDate)}</span>
                {plan.targetDate !== plan.finishDate ? ` (meta: ${formatDate(plan.targetDate)})` : null}.
              </p>
            ) : null}
            {plan.overdue > 0 ? (
              <p className="mt-1 text-destructive">
                {plan.overdue} aulas atrasadas. Assista-as ou refaca o cronograma (ele substitui o atual).
              </p>
            ) : null}
            <ul className="mt-3 flex flex-wrap gap-2">
              {plan.courses.map((course, index) => (
                <li
                  className={`rounded-md px-2 py-1 text-xs font-semibold text-slate-900 ${COURSE_COLORS[index % COURSE_COLORS.length].split(" ")[0]}`}
                  key={course.id}
                >
                  {course.title}
                  {course.remainingLessons === 0 ? " (concluido)" : ` (${course.remainingLessons} aulas)`}
                  {plan.modes[course.id] === "modules" ? " - por modulos" : ""}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-copy-muted">
              Clique numa aula para abri-la. Ponto verde: assistida, cinza: pendente, vermelho: atrasada.
            </p>
          </div>

          {plan.freeSlots > 0 && plan.activeCourses > 0 && hasOtherCourses ? (
            <div className="rounded-md border border-brand-primary px-4 py-3 text-sm text-copy-secondary">
              Seu cronograma tem {plan.activeCourses} {plan.activeCourses === 1 ? "curso" : "cursos"}. Voce ainda pode inserir mais{" "}
              {plan.freeSlots} {plan.freeSlots === 1 ? "curso" : "cursos"}.{" "}
              <Link className="font-medium text-brand-primary underline" href="/app/schedule?edit=1">
                Adicionar curso
              </Link>
            </div>
          ) : null}
          {plan.activeCourses === 0 ? (
            <div className="rounded-md border border-green-500 px-4 py-3 text-sm text-green-500">
              Todos os cursos do cronograma foram concluidos. Crie um novo cronograma com outros cursos.
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Link
              className="inline-flex min-h-10 items-center rounded-md border border-stroke-subtle px-4 text-sm font-medium text-copy-secondary hover:bg-surface-hover hover:text-copy-primary"
              href="/app/schedule?edit=1"
            >
              Refazer cronograma
            </Link>
            <form action={removeStudyPlanAction}>
              <SubmitButton destructive confirmMessage="Apagar o cronograma?">
                Apagar cronograma
              </SubmitButton>
            </form>
          </div>

          <StudyCalendar courses={plan.courses} days={plan.days} today={view.today} />
        </div>
      ) : null}
    </section>
  );
}
