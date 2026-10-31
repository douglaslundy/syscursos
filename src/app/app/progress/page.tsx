import Link from "next/link";

import { saveWeeklyGoalAction } from "@/server/actions/study-actions";
import { getProgressSummary } from "@/server/services/study-stats-service";

export default async function ProgressPage() {
  const summary = await getProgressSummary();
  const goalPercent = summary.weeklyGoalMinutes > 0 ? Math.min(100, Math.round((summary.weekMinutes / summary.weeklyGoalMinutes) * 100)) : null;
  const peak = Math.max(30, ...summary.recent.map((item) => item.minutes));

  return (
    <section>
      <div className="mb-8">
        <p className="text-sm font-medium text-primary">Constancia</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal md:text-4xl">Meu progresso</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Sequencia atual" value={`${summary.streak} ${summary.streak === 1 ? "dia" : "dias"}`} hint={`Recorde: ${summary.longestStreak}`} />
        <Stat label="Hoje" value={`${summary.todayMinutes} min`} hint="Tempo com aulas abertas" />
        <Stat label="Esta semana" value={`${summary.weekMinutes} min`} hint={`${summary.weekLessons} aulas concluidas`} />
        <Stat label="Media nos quizzes" value={summary.quizAverage === null ? "-" : `${summary.quizAverage}%`} hint={`${summary.completedTotal} aulas concluidas no total`} />
      </div>

      <div className="mt-6 rounded-md border border-stroke-subtle bg-surface p-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-copy-muted">Meta semanal</h2>
        {goalPercent !== null ? (
          <div className="mt-3">
            <div className="mb-1 flex justify-between text-sm text-copy-secondary">
              <span>
                {summary.weekMinutes} de {summary.weeklyGoalMinutes} min
              </span>
              <span>{goalPercent}%</span>
            </div>
            <div aria-label="Meta semanal" aria-valuemax={100} aria-valuemin={0} aria-valuenow={goalPercent} className="h-2 overflow-hidden rounded-full bg-surface-elevated" role="progressbar">
              <div className="h-full bg-brand-primary" style={{ width: `${goalPercent}%` }} />
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-copy-secondary">Defina quantos minutos por semana voce quer estudar.</p>
        )}
        <form action={saveWeeklyGoalAction} className="mt-4 flex flex-wrap items-end gap-3">
          <label className="grid gap-1 text-sm font-medium">
            Minutos por semana
            <input className="min-h-11 w-40 rounded-md border px-3 text-sm outline-none" defaultValue={summary.weeklyGoalMinutes || ""} max={10080} min={0} name="minutes" placeholder="Ex.: 300" type="number" />
          </label>
          <button className="inline-flex min-h-11 items-center rounded-md bg-brand-primary px-4 text-sm font-medium text-copy-primary" type="submit">
            Salvar meta
          </button>
        </form>
      </div>

      <div className="mt-6 rounded-md border border-stroke-subtle bg-surface p-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-copy-muted">Ultimos 14 dias (minutos)</h2>
        <div className="mt-4 flex h-36 items-end gap-1" role="img" aria-label="Minutos estudados por dia nos ultimos 14 dias">
          {summary.recent.map((item) => (
            <div className="flex h-full flex-1 flex-col items-center gap-1" key={item.day} title={`${item.day}: ${item.minutes} min`}>
              {/* A altura em % precisa de um pai com altura definida: o wrapper flex-1 ocupa o espaco acima do dia. */}
              <div className="flex min-h-0 w-full flex-1 items-end">
                <div className="w-full rounded-t bg-brand-primary" style={{ height: `${Math.max(2, (item.minutes / peak) * 100)}%`, opacity: item.minutes > 0 ? 1 : 0.25 }} />
              </div>
              <span className="text-[10px] text-copy-muted">{item.day.slice(8)}</span>
            </div>
          ))}
        </div>
      </div>

      {summary.dueCards > 0 ? (
        <p className="mt-6 text-sm text-copy-secondary">
          Voce tem {summary.dueCards} cartoes para revisar.{" "}
          <Link className="font-medium text-primary" href="/app/review">
            Revisar agora
          </Link>
        </p>
      ) : null}
    </section>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-md border border-stroke-subtle bg-surface p-4">
      <p className="text-xs uppercase tracking-[0.12em] text-copy-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-copy-primary">{value}</p>
      <p className="mt-1 text-xs text-copy-secondary">{hint}</p>
    </div>
  );
}
