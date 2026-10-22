import { Feedback } from "@/components/admin/feedback";
import { saveOwnStudentProfileAction } from "@/server/actions/student-actions";
import { savePlaybackRateFormAction } from "@/server/actions/study-actions";
import { saveStudyPreferencesAction } from "@/server/actions/study-plan-actions";
import { PLAYBACK_RATES } from "@/lib/study/playback";
import { getOwnStudentProfile } from "@/server/services/student-service";
import { getPlaybackRate } from "@/server/services/study-stats-service";

type StudentMePageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

function toClock(minute: number) {
  return `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
}

export default async function StudentMePage(props: { searchParams: Promise<StudentMePageProps["searchParams"]> }) {
  const searchParams = await props.searchParams;
  const [profile, playbackRate] = await Promise.all([getOwnStudentProfile(), getPlaybackRate().catch(() => 1)]);
  const status = typeof searchParams?.status === "string" ? searchParams.status : undefined;

  return (
    <section>
      <div className="mb-8">
        <p className="text-sm font-medium text-primary">Area do aluno</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal md:text-4xl">Meus dados</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Atualize suas informacoes pessoais. O CPF nao pode ser alterado por esta tela.
        </p>
      </div>
      <Feedback status={status} />
      <form action={saveOwnStudentProfileAction} className="grid max-w-2xl gap-3 rounded-md border bg-background p-4">
        <input className="rounded-md border px-3 py-2 text-sm outline-none" defaultValue={profile.user.email} disabled type="email" />
        <input className="rounded-md border px-3 py-2 text-sm outline-none" defaultValue={profile.user.name} name="name" required />
        <input className="rounded-md border px-3 py-2 text-sm outline-none" defaultValue={profile.phone ?? ""} name="phone" placeholder="Telefone" />
        <input className="rounded-md border px-3 py-2 text-sm outline-none" defaultValue={profile.document ?? ""} disabled placeholder="CPF" />
        <input
          className="rounded-md border px-3 py-2 text-sm outline-none"
          minLength={8}
          name="password"
          placeholder="Nova senha (opcional)"
          type="password"
        />
        <input
          className="rounded-md border px-3 py-2 text-sm outline-none"
          minLength={8}
          name="confirmPassword"
          placeholder="Repita a nova senha"
          type="password"
        />
        <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" type="submit">
          Salvar
        </button>
      </form>

      <form action={saveStudyPreferencesAction} className="mt-6 grid max-w-2xl gap-3 rounded-md border bg-background p-4">
        <h2 className="text-base font-semibold">Preferencias de estudo</h2>
        <p className="text-sm text-muted-foreground">Usadas no seu cronograma de estudos.</p>
        <fieldset className="flex flex-wrap gap-3 text-sm">
          <legend className="mb-1 text-sm">Dias da semana</legend>
          {WEEKDAYS.map((label, day) => (
            <label className="flex items-center gap-1" key={label}>
              <input defaultChecked={profile.studyWeekdays.includes(day)} name="weekdays" type="checkbox" value={day} />
              {label}
            </label>
          ))}
        </fieldset>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <label className="grid gap-1">
            Inicio
            <input className="rounded-md border px-3 py-2 outline-none" defaultValue={toClock(profile.studyStartMinute)} name="start" required type="time" />
          </label>
          <label className="grid gap-1">
            Fim
            <input className="rounded-md border px-3 py-2 outline-none" defaultValue={toClock(profile.studyEndMinute)} name="end" required type="time" />
          </label>
        </div>
        <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" type="submit">
          Salvar preferencias
        </button>
      </form>

      <form action={savePlaybackRateFormAction} className="mt-6 grid max-w-2xl gap-3 rounded-md border bg-background p-4">
        <h2 className="text-base font-semibold">Velocidade das aulas</h2>
        <p className="text-sm text-muted-foreground">
          Vale para todas as aulas. Se voce mudar a velocidade dentro de uma aula, ela vira o novo padrao.
        </p>
        <select className="min-h-11 max-w-40 rounded-md border px-3 text-sm outline-none" defaultValue={playbackRate} name="rate">
          {PLAYBACK_RATES.map((rate) => (
            <option key={rate} value={rate}>
              {rate}x
            </option>
          ))}
        </select>
        <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" type="submit">
          Salvar velocidade
        </button>
      </form>
    </section>
  );
}
