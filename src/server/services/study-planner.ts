// Calculo puro do planejador de estudos: sem banco, sem relogio. Datas sao "YYYY-MM-DD".
export const FALLBACK_LESSON_SECONDS = 10 * 60;
const MAX_PLAN_DAYS = 3650;

export type PlannerLesson = {
  id: string;
  title: string;
  moduleTitle: string;
  moduleId?: string;
  seconds: number;
};

// byModule: o tempo do curso e dividido igualmente entre seus modulos (cada modulo segue em ordem); senao, sequencial.
export type PlannerCourse = { courseId: string; lessons: PlannerLesson[]; byModule?: boolean };

export type ScheduledLesson = PlannerLesson & { courseId: string; startMinute: number; endMinute: number };

export type PlanDay = {
  date: string;
  startMinute: number;
  minutes: number;
  lessons: ScheduledLesson[];
};

// Periodo reservado sem estudo, datas inclusivas.
export type BlockedRange = { start: string; end: string };

type ScheduleInput = {
  courses: PlannerCourse[];
  startDate: string;
  weekdays: number[];
  startMinute: number;
  blocked?: BlockedRange[];
};

export function isBlocked(date: string, blocked: BlockedRange[] = []) {
  return blocked.some((range) => date >= range.start && date <= range.end);
}

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

// Aulas do curso em fluxos: um so (sequencial) ou um por modulo, na ordem em que os modulos aparecem.
function streamsOf(course: PlannerCourse) {
  if (!course.byModule) return [course.lessons];

  const byModule = new Map<string, PlannerLesson[]>();

  for (const lesson of course.lessons) {
    const key = lesson.moduleId ?? lesson.moduleTitle;
    byModule.set(key, [...(byModule.get(key) ?? []), lesson]);
  }

  return Array.from(byModule.values());
}

// Cada dia de estudo reparte o tempo igualmente entre os cursos que ainda tem aula (e, no curso dividido por modulos,
// igualmente entre os modulos que ainda tem aula); curso ou modulo pequeno termina antes e sua parte passa aos demais.
// Sobra de um dia vira credito do fluxo (aula nunca e dividida entre dias).
export function buildSchedule(input: ScheduleInput & { dailyMinutes: number }): PlanDay[] {
  const { courses, startDate, weekdays, startMinute, dailyMinutes } = input;
  const days: PlanDay[] = [];

  if (weekdays.length === 0 || dailyMinutes <= 0) {
    return days;
  }

  const streams = courses.map((course) => streamsOf(course).map((lessons) => ({ lessons, next: 0, credit: 0 })));
  const pending = (list: (typeof streams)[number]) => list.filter((stream) => stream.next < stream.lessons.length);

  for (let offset = 0; offset < MAX_PLAN_DAYS; offset += 1) {
    const active = streams.flatMap((list, index) => (pending(list).length > 0 ? [index] : []));

    if (active.length === 0) break;

    const date = addDays(startDate, offset);

    if (!weekdays.includes(weekdayOf(date)) || isBlocked(date, input.blocked)) continue;

    const day: PlanDay = { date, startMinute, minutes: 0, lessons: [] };
    let used = 0;

    for (const index of active) {
      const open = pending(streams[index]);
      const courseId = courses[index].courseId;

      for (const stream of open) {
        stream.credit += (dailyMinutes * 60) / active.length / open.length;

        while (stream.next < stream.lessons.length && stream.lessons[stream.next].seconds <= stream.credit) {
          const lesson = stream.lessons[stream.next];
          const lessonStart = startMinute + Math.ceil(used / 60);
          used += lesson.seconds;
          stream.credit -= lesson.seconds;
          stream.next += 1;
          day.lessons.push({ ...lesson, courseId, startMinute: lessonStart, endMinute: startMinute + Math.ceil(used / 60) });
        }
      }
    }

    if (day.lessons.length > 0) {
      day.minutes = Math.ceil(used / 60);
      days.push(day);
    }
  }

  return days;
}

export function countLessons(courses: PlannerCourse[]) {
  return courses.reduce((sum, course) => sum + course.lessons.length, 0);
}

// Menor carga diaria (em minutos, ate maxMinutes) que termina tudo ate a data alvo. Null: nenhum dia de estudo disponivel.
export function minutesPerDayForDeadline(input: ScheduleInput & { targetDate: string; maxMinutes: number }) {
  const { startDate, weekdays, targetDate, maxMinutes } = input;
  let studyDays = 0;

  for (let offset = 0; offset <= diffDays(startDate, targetDate); offset += 1) {
    const date = addDays(startDate, offset);
    if (weekdays.includes(weekdayOf(date)) && !isBlocked(date, input.blocked)) studyDays += 1;
  }

  if (studyDays === 0) {
    return null;
  }

  const total = countLessons(input.courses);
  const fits = (minutes: number) => {
    const days = buildSchedule({ ...input, dailyMinutes: minutes });
    const scheduled = days.reduce((sum, day) => sum + day.lessons.length, 0);
    return scheduled === total && (days.at(-1)?.date ?? startDate) <= targetDate;
  };

  let low = 1;
  let high = maxMinutes;

  if (!fits(high)) return high;

  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (fits(mid)) high = mid;
    else low = mid + 1;
  }

  return low;
}

function toUtc(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}
