// Calculo puro do planejador de estudos: sem banco, sem relogio. Datas sao "YYYY-MM-DD".
export const FALLBACK_LESSON_SECONDS = 10 * 60;
const MAX_PLAN_DAYS = 3650;

export type PlannerLesson = {
  id: string;
  title: string;
  moduleTitle: string;
  seconds: number;
};

export type ScheduledLesson = PlannerLesson & { startMinute: number; endMinute: number };

export type PlanDay = {
  date: string;
  startMinute: number;
  minutes: number;
  lessons: ScheduledLesson[];
};

type ScheduleInput = {
  lessons: PlannerLesson[];
  startDate: string;
  weekdays: number[];
  startMinute: number;
};

export function addDays(date: string, days: number) {
  const value = toUtc(date);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function diffDays(from: string, to: string) {
  return Math.round((toUtc(to).getTime() - toUtc(from).getTime()) / 86_400_000);
}

export function weekdayOf(date: string) {
  return toUtc(date).getUTCDay();
}

export function totalSeconds(lessons: PlannerLesson[]) {
  return lessons.reduce((sum, lesson) => sum + lesson.seconds, 0);
}

// Distribui as aulas em ordem nos dias de estudo; uma aula nunca e dividida entre dias.
export function buildSchedule(input: ScheduleInput & { dailyMinutes: number }): PlanDay[] {
  const { lessons, startDate, weekdays, startMinute, dailyMinutes } = input;
  const days: PlanDay[] = [];

  if (weekdays.length === 0 || dailyMinutes <= 0) {
    return days;
  }

  const capSeconds = dailyMinutes * 60;
  let index = 0;

  for (let offset = 0; offset < MAX_PLAN_DAYS && index < lessons.length; offset += 1) {
    const date = addDays(startDate, offset);

    if (!weekdays.includes(weekdayOf(date))) {
      continue;
    }

    const day: PlanDay = { date, startMinute, minutes: 0, lessons: [] };
    let used = 0;

    while (index < lessons.length && (day.lessons.length === 0 || used + lessons[index].seconds <= capSeconds)) {
      const lessonStart = startMinute + Math.ceil(used / 60);
      used += lessons[index].seconds;
      day.lessons.push({ ...lessons[index], startMinute: lessonStart, endMinute: startMinute + Math.ceil(used / 60) });
      index += 1;
    }

    day.minutes = Math.ceil(used / 60);
    days.push(day);
  }

  return days;
}

// Menor carga diaria (em minutos) que termina o conteudo ate a data alvo. Null: nenhum dia de estudo disponivel.
export function minutesPerDayForDeadline(input: ScheduleInput & { targetDate: string }) {
  const { lessons, startDate, weekdays, targetDate } = input;
  let studyDays = 0;

  for (let offset = 0; offset <= diffDays(startDate, targetDate); offset += 1) {
    if (weekdays.includes(weekdayOf(addDays(startDate, offset)))) studyDays += 1;
  }

  if (studyDays === 0) {
    return null;
  }

  const total = totalSeconds(lessons);
  let minutes = Math.max(1, Math.ceil(total / 60 / studyDays));

  // Aulas inteiras podem estourar o dia; sobe 1 min ate caber no prazo.
  while (minutes * 60 < total) {
    const days = buildSchedule({ ...input, dailyMinutes: minutes });
    const last = days[days.length - 1];

    if (!last || last.date <= targetDate) break;
    minutes += 1;
  }

  return minutes;
}

function toUtc(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}
