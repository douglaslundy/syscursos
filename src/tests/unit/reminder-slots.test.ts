import { describe, expect, it } from "vitest";

import { computeSlots, dueReminder, type ReminderConfig } from "@/lib/study/reminder-slots";

const base: ReminderConfig = { mode: "times", count: 2, times: ["19:00", "08:30"], start: "08:00", intervalMin: 60 };
// 2026-10-25 12:00 UTC = 09:00 em Brasilia.
const at = (hhmm: string) => new Date(`2026-10-25T${hhmm}:00-03:00`);

describe("computeSlots", () => {
  it("ordena horarios fixos", () => expect(computeSlots(base)).toEqual(["08:30", "19:00"]));
  it("rejeita mais de 3, horarios repetidos e formato ruim", () => {
    expect(computeSlots({ ...base, count: 4 })).toBeNull();
    expect(computeSlots({ ...base, times: ["08:00", "08:00"] })).toBeNull();
    expect(computeSlots({ ...base, times: ["8:00", "09:00"] })).toBeNull();
  });
  it("gera intervalo a partir do inicio e nao atravessa a meia-noite", () => {
    expect(computeSlots({ ...base, mode: "interval", count: 3, start: "09:00", intervalMin: 120 })).toEqual(["09:00", "11:00", "13:00"]);
    expect(computeSlots({ ...base, mode: "interval", count: 3, start: "22:00", intervalMin: 60 })).toBeNull();
  });
  it("desligado nao tem horarios", () => expect(computeSlots({ ...base, mode: "off" })).toEqual([]));
});

describe("dueReminder", () => {
  const slots = ["08:30", "19:00"];

  it("devolve o horario que acabou de passar", () => expect(dueReminder(slots, at("08:40"), null)).toBe("2026-10-25 08:30"));
  it("nao repete o que ja foi enviado", () => expect(dueReminder(slots, at("08:40"), "2026-10-25 08:30")).toBeNull());
  it("descarta lembrete vencido ha mais de 90 minutos", () => expect(dueReminder(slots, at("10:30"), null)).toBeNull());
  it("nada antes do primeiro horario", () => expect(dueReminder(slots, at("07:00"), null)).toBeNull());
  it("o do dia anterior nao bloqueia o de hoje", () => expect(dueReminder(slots, at("19:05"), "2026-10-24 19:00")).toBe("2026-10-25 19:00"));
});
