"use client";

import { useState } from "react";

import { SubmitButton } from "@/components/admin/submit-button";

type ReschedulePanelProps = {
  action: (formData: FormData) => void | Promise<void>;
  minDate: string;
  minDays: number;
  maxDays: number;
  overdue: number;
};

const inputClass = "w-full rounded-md border border-stroke-subtle bg-surface px-3 py-2 text-sm text-copy-primary";

export function ReschedulePanel({ action, minDate, minDays, maxDays, overdue }: ReschedulePanelProps) {
  const [kind, setKind] = useState<"catchup" | "block">("catchup");

  return (
    <form action={action} className="space-y-4 rounded-md border border-brand-primary bg-surface p-4">
      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-copy-primary">Como deseja reprogramar?</legend>
        <label className="flex cursor-pointer items-start gap-3 rounded-md border border-stroke-subtle px-3 py-2 text-sm hover:bg-surface-hover">
          <input checked={kind === "catchup"} className="mt-1" name="kind" onChange={() => setKind("catchup")} type="radio" value="catchup" />
          <span>
            <span className="font-medium text-copy-primary">Recalcular a partir de hoje</span>
            <span className="block text-xs text-copy-muted">
              {overdue > 0
                ? `Voce tem ${overdue} ${overdue === 1 ? "aula atrasada" : "aulas atrasadas"}: elas entram de novo no calendario, junto com as demais aulas nao assistidas.`
                : "Reorganiza as aulas nao assistidas a partir de hoje."}
            </span>
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-3 rounded-md border border-stroke-subtle px-3 py-2 text-sm hover:bg-surface-hover">
          <input checked={kind === "block"} className="mt-1" name="kind" onChange={() => setKind("block")} type="radio" value="block" />
          <span>
            <span className="font-medium text-copy-primary">Reservar um periodo sem estudo</span>
            <span className="block text-xs text-copy-muted">
              Nenhuma aula cai no periodo; o cronograma segue depois dele. Minimo de {minDays} dias.
            </span>
          </span>
        </label>
      </fieldset>

      {kind === "block" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm text-copy-secondary">
            Inicio da reserva
            <input className={inputClass} defaultValue={minDate} min={minDate} name="start" required type="date" />
          </label>
          <label className="space-y-1 text-sm text-copy-secondary">
            Quantidade de dias (minimo {minDays})
            <input className={inputClass} defaultValue={minDays} max={maxDays} min={minDays} name="days" required type="number" />
          </label>
        </div>
      ) : null}

      <SubmitButton>Reprogramar</SubmitButton>
    </form>
  );
}
