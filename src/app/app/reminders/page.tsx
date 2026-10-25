import { Feedback } from "@/components/admin/feedback";
import { TimeInput } from "@/components/ui/time-input";
import { INTERVAL_OPTIONS, MAX_REMINDERS } from "@/lib/study/reminder-slots";
import { saveReminderAction } from "@/server/actions/reminder-actions";
import { getReminderConfig } from "@/server/services/reminder-config-service";
import { getWhatsappStatus } from "@/server/services/whatsapp-link-service";

const input = "rounded-md border px-3 py-2 text-sm outline-none";

export default async function RemindersPage(props: { searchParams: Promise<Record<string, string | string[] | undefined> | undefined> }) {
  const searchParams = await props.searchParams;
  const [config, whatsapp] = await Promise.all([getReminderConfig(), getWhatsappStatus().catch(() => ({ linked: false, masked: null }))]);
  const status = typeof searchParams?.status === "string" ? searchParams.status : undefined;
  const times = Array.from({ length: MAX_REMINDERS }, (_, index) => (config.mode === "times" ? (config.times[index] ?? "") : ""));

  return (
    <section>
      <div className="mb-8">
        <p className="text-sm font-medium text-primary">Area do aluno</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal md:text-4xl">Lembretes</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          O agente do WhatsApp lembra voce de estudar, responder o quiz e revisar. Escolha ate {MAX_REMINDERS} lembretes por dia, em horarios fixos ou em
          intervalo a partir de um horario (horario de Brasilia).
        </p>
      </div>
      <Feedback status={status} />
      {whatsapp.linked ? null : (
        <p className="mb-4 max-w-2xl rounded-md border bg-background p-3 text-sm">
          Seu WhatsApp ainda nao esta vinculado, entao nenhum lembrete chega. Vincule em Meus dados &gt; Estudar pelo WhatsApp.
        </p>
      )}
      <form action={saveReminderAction} className="grid max-w-2xl gap-4 rounded-md border bg-background p-4">
        <label className="grid gap-1 text-sm">
          Como quer ser lembrado
          <select className={input} defaultValue={config.mode} name="mode">
            <option value="off">Sem lembretes</option>
            <option value="times">Em horarios que eu escolher</option>
            <option value="interval">Em intervalo de tempo</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          Quantas vezes por dia (maximo {MAX_REMINDERS})
          <select className={input} defaultValue={String(config.count)} name="count">
            {Array.from({ length: MAX_REMINDERS }, (_, index) => (
              <option key={index + 1} value={index + 1}>
                {index + 1}
              </option>
            ))}
          </select>
        </label>
        <fieldset className="grid gap-2">
          <legend className="text-sm font-medium">Horarios fixos (os primeiros da quantidade escolhida)</legend>
          <div className="flex flex-wrap gap-2">
            {times.map((time, index) => (
              <TimeInput aria-label={`Horario ${index + 1}`} className={input} defaultValue={time} key={index} name={`time${index + 1}`} />
            ))}
          </div>
        </fieldset>
        <fieldset className="grid gap-2">
          <legend className="text-sm font-medium">Ou por intervalo: comecar as e repetir a cada</legend>
          <div className="flex flex-wrap gap-2">
            <TimeInput aria-label="Comecar as" className={input} defaultValue={config.start} name="start" />
            <select aria-label="Intervalo" className={input} defaultValue={String(config.intervalMin)} name="intervalMin">
              {INTERVAL_OPTIONS.map((minutes) => (
                <option key={minutes} value={minutes}>
                  {minutes % 60 === 0 ? `${minutes / 60} h` : `${minutes} min`}
                </option>
              ))}
            </select>
          </div>
        </fieldset>
        {config.slots.length > 0 ? <p className="text-sm">Seus lembretes todo dia: {config.slots.join(", ")}.</p> : null}
        <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" type="submit">
          Salvar
        </button>
      </form>
    </section>
  );
}
