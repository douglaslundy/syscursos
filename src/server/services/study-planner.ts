// Calculo puro do planejador de estudos: sem banco, sem relogio. Datas sao "YYYY-MM-DD".
export const FALLBACK_LESSON_SECONDS = 10 * 60;
const MAX_PLAN_DAYS = 3650;

export type PlannerLesson = {
  id: string;
  title: string;
  moduleTitle: string;
  seconds: number;
};

export type PlannerCourse = { courseId: string; lessons: PlannerLesson[] };

export type ScheduledLesson = PlannerLesson & { courseId: string; startMinute: number; endMinute: number };

export type PlanDay = {
  date: string;
  startMinute: number;
  minutes: number;
  lessons: ScheduledLesson[];
};

type ScheduleInput = {
  courses: PlannerCourse[];
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

// Cada dia de estudo reparte o tempo igualmente entre os cursos que ainda tem aula; curso pequeno termina antes
// e sua parte passa para os demais. Sobra de um dia vira credito do curso (aula nunca e dividida entre dias).
export function buildSchedule(input: ScheduleInput & { dailyMinutes: number }): PlanDay[] {
  const { courses, startDate, weekdays, startMinute, dailyMinutes } = input;
  const days: PlanDay[] = [];

  if (weekdays.length === 0 || dailyMinutes <= 0) {
    return days;
  }

  const next = courses.map(() => 0);
  const credit = courses.map(() => 0);

  for (let offset = 0; offset < MAX_PLAN_DAYS; offset += 1) {
    const active = courses.flatMap((course, index) => (next[index] < course.lessons.length ? [index] : []));

    if (active.length === 0) break;

    const date = addDays(startDate, offset);

    if (!weekdays.includes(weekdayOf(date))) continue;

    const day: PlanDay = { date, startMinute, minutes: 0, lessons: [] };
    let used = 0;

    for (const index of active) {
      credit[index] += (dailyMinutes * 60) / active.length;
      const { courseId, lessons } = courses[index];

      while (next[index] < lessons.length && lessons[next[index]].seconds <= credit[index]) {
        const lesson = lessons[next[index]];
        const lessonStart = startMinute + Math.ceil(used / 60);
        used += lesson.seconds;
        credit[index] -= lesson.seconds;
        next[index] += 1;
        day.lessons.push({ ...lesson, courseId, startMinute: lessonStart, endMinute: startMinute + Math.ceil(used / 60) });
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
    if (weekdays.includes(weekdayOf(addDays(startDate, offset)))) studyDays += 1;
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
