// Datas como "AAAA-MM-DD" no fuso de Sao Paulo, para a sequencia nao virar a meia-noite UTC.
const DAY_MS = 86_400_000;

export function dayKey(date: Date) {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo" }).format(date);
}

const shift = (key: string, days: number) => dayKey(new Date(new Date(`${key}T12:00:00Z`).getTime() + days * DAY_MS));

// Dias seguidos estudados ate hoje. Se hoje ainda nao teve estudo, a sequencia de ontem continua valendo.
export function currentStreak(studiedDays: Iterable<string>, today: Date) {
  const days = new Set(studiedDays);
  let cursor = dayKey(today);

  if (!days.has(cursor)) cursor = shift(cursor, -1);

  let streak = 0;

  while (days.has(cursor)) {
    streak += 1;
    cursor = shift(cursor, -1);
  }

  return streak;
}

// Maior sequencia ja feita.
export function longestStreak(studiedDays: Iterable<string>) {
  const sorted = Array.from(new Set(studiedDays)).sort();
  let best = 0;
  let run = 0;
  let previous: string | null = null;

  for (const day of sorted) {
    run = previous && shift(previous, 1) === day ? run + 1 : 1;
    best = Math.max(best, run);
    previous = day;
  }

  return best;
}

// Segunda-feira da semana de `date` (a semana de estudo comeca na segunda).
export function weekStart(date: Date) {
  const key = dayKey(date);
  const weekday = new Date(`${key}T12:00:00Z`).getUTCDay();

  return shift(key, -((weekday + 6) % 7));
}
