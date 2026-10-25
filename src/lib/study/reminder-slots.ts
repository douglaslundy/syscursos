// Lembretes de estudo: ate 3 por dia, em horarios fixos ou em intervalo a partir de um horario. Horario de Brasilia.
export const MAX_REMINDERS = 3;
export const INTERVAL_OPTIONS = [30, 60, 90, 120, 180, 240] as const;
// Passado esse tempo, um lembrete que nao foi entregue (agente fora do ar) e descartado em vez de chegar atrasado.
export const STALE_MINUTES = 90;

export type ReminderConfig = { mode: "off" | "times" | "interval"; count: number; times: string[]; start: string; intervalMin: number };

const CLOCK = /^([01]\d|2[0-3]):([0-5]\d)$/;
const toMinutes = (clock: string) => Number(clock.slice(0, 2)) * 60 + Number(clock.slice(3));
const toClock = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

// Horarios finais do dia (ordenados, sem repetir) ou null se a configuracao for invalida.
export function computeSlots(config: ReminderConfig): string[] | null {
  if (config.mode === "off") return [];
  if (!Number.isInteger(config.count) || config.count < 1 || config.count > MAX_REMINDERS) return null;

  if (config.mode === "times") {
    const times = config.times.slice(0, config.count);

    if (times.length !== config.count || !times.every((time) => CLOCK.test(time))) return null;

    const unique = Array.from(new Set(times)).sort();

    return unique.length === config.count ? unique : null;
  }

  if (!CLOCK.test(config.start) || !(INTERVAL_OPTIONS as readonly number[]).includes(config.intervalMin)) return null;

  const slots = Array.from({ length: config.count }, (_, index) => toMinutes(config.start) + index * config.intervalMin);

  // Nao atravessa a meia-noite: o ultimo lembrete tem que caber no mesmo dia.
  return slots.every((minute) => minute < 24 * 60) ? slots.map(toClock) : null;
}

const SAO_PAULO = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

// "2026-10-25 14:30" no relogio de Brasilia.
export function localStamp(now: Date) {
  return SAO_PAULO.format(now).replace(/ | /g, " ");
}

// Lembrete a enviar agora: o ultimo horario que ja passou hoje, ainda fresco e ainda nao enviado. lastStamp = "AAAA-MM-DD HH:MM".
export function dueReminder(slots: string[], now: Date, lastStamp: string | null) {
  const stamp = localStamp(now);
  const day = stamp.slice(0, 10);
  const nowMinutes = toMinutes(stamp.slice(11, 16));
  const passed = slots.filter((slot) => toMinutes(slot) <= nowMinutes && nowMinutes - toMinutes(slot) <= STALE_MINUTES);
  const slot = passed[passed.length - 1];

  if (!slot) return null;

  const key = `${day} ${slot}`;

  return lastStamp !== null && lastStamp >= key ? null : key;
}
