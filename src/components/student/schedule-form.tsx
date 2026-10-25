"use client";

import { useState } from "react";

import { DateInput } from "@/components/ui/date-input";
import { formatMinutes } from "@/components/student/study-calendar";

type Option = { id: string; title: string; lessons: number; seconds: number };

type ScheduleFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  options: Option[];
  selected: string[];
  modules: Record<string, "sequential" | "modules">;
  maxCourses: number;
  minDate: string;
  defaultMinutes: number;
};

const inputClass =
  "w-full rounded-md border border-stroke-subtle bg-surface px-3 py-2 text-sm text-copy-primary disabled:opacity-40";

export function ScheduleForm({ action, options, selected, modules, maxCourses, minDate, defaultMinutes }: ScheduleFormProps) {
  const [chosen, setChosen] = useState<string[]>(selected);
  const [courseModes, setCourseModes] = useState(modules);
  const [mode, setMode] = useState<"minutes" | "date">("minutes");
  const full = chosen.length >= maxCourses;

  function toggle(id: string) {
    setChosen((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  return (
    <form action={action} className="mt-6 space-y-6 rounded-md border border-stroke-subtle bg-surface p-4">
      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-copy-primary">
          1. Escolha os cursos ({chosen.length}/{maxCourses})
        </legend>
        <p className="text-xs text-copy-muted">
          Ate {maxCourses} cursos. O tempo de cada dia e dividido igualmente entre eles: um curso menor termina antes e seu
          tempo passa para os outros.
        </p>
        {options.map((option) => {
          const checked = chosen.includes(option.id);
          const blocked = option.lessons === 0 || (full && !checked);

          return (
            <label
              className={`flex items-start gap-3 rounded-md border border-stroke-subtle px-3 py-2 text-sm ${blocked ? "opacity-50" : "cursor-pointer hover:bg-surface-hover"}`}
              key={option.id}
            >
              <input
                checked={checked}
                className="mt-1"
                disabled={blocked}
                name="courseIds"
                onChange={() => toggle(option.id)}
                type="checkbox"
                value={option.id}
              />
              <span>
                <span className="font-medium text-copy-primary">{option.title}</span>
                <span className="block text-xs text-copy-muted">
                  {option.lessons === 0
                    ? "Curso concluido"
                    : `${option.lessons} aulas restantes, cerca de ${formatMinutes(Math.ceil(option.seconds / 60))}`}
                </span>
              </span>
            </label>
          );
        })}
      </fieldset>

      {chosen.length > 0 ? (
        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-copy-primary">2. Como dividir as aulas de cada curso?</legend>
          {options
            .filter((option) => chosen.includes(option.id))
            .map((option) => {
              const value = courseModes[option.id] ?? "sequential";

              return (
                <div className="space-y-1 rounded-md border border-stroke-subtle px-3 py-2 text-sm" key={option.id}>
                  <p className="font-medium text-copy-primary">{option.title}</p>
                  {(["sequential", "modules"] as const).map((item) => (
                    <label className="flex items-start gap-2 text-copy-secondary" key={item}>
                      <input
                        checked={value === item}
                        className="mt-1"
                        name={`mode_${option.id}`}
                        onChange={() => setCourseModes((current) => ({ ...current, [option.id]: item }))}
                        type="radio"
                        value={item}
                      />
                      <span>
                        {item === "sequential" ? "Sequencial (padrao): uma aula depois da outra" : "Dividir por modulos"}
                        <span className="block text-xs text-copy-muted">
                          {item === "sequential"
                            ? "Segue a ordem do curso."
                            : "Os modulos avancam juntos, com o mesmo tempo por semana para cada um."}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              );
            })}
        </fieldset>
      ) : null}

      {chosen.length > 0 ? (
        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-copy-primary">3. Como quer estudar?</legend>
          <label className="flex items-center gap-2 text-sm text-copy-secondary">
            <input checked={mode === "minutes"} onChange={() => setMode("minutes")} type="radio" />
            Quantos minutos por dia
          </label>
          <input
            className={inputClass}
            disabled={mode !== "minutes"}
            max={960}
            min={1}
            name="minutesPerDay"
            placeholder={`Ex.: ${defaultMinutes}`}
            required={mode === "minutes"}
            type="number"
          />
          <label className="flex items-center gap-2 text-sm text-copy-secondary">
            <input checked={mode === "date"} onChange={() => setMode("date")} type="radio" />
            Ou ate que data quer terminar
          </label>
          <DateInput
            className={inputClass}
            disabled={mode !== "date"}
            min={minDate}
            name="targetDate"
            required={mode === "date"}
          />
          <button className="rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-copy-primary" type="submit">
            Gerar cronograma
          </button>
        </fieldset>
      ) : (
        <p className="text-sm text-copy-muted">Marque pelo menos um curso para continuar.</p>
      )}
    </form>
  );
}
