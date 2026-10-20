import Link from "next/link";

import { cn } from "@/lib/utils";
import type { CronogramaDay, CronogramaLesson } from "@/server/services/study-plan-service";
import { addDays, weekdayOf } from "@/server/services/study-planner";

const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
const MONTH_LABELS = [
  "Janeiro",
  "Fevereiro",
  "Marco",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];
const VISIBLE_PER_DAY = 3;
// Uma cor por curso do cronograma (ate 5), na ordem em que foram escolhidos.
export const COURSE_COLORS = [
  "bg-sky-100 hover:bg-sky-200",
  "bg-emerald-100 hover:bg-emerald-200",
  "bg-amber-100 hover:bg-amber-200",
  "bg-violet-100 hover:bg-violet-200",
  "bg-rose-100 hover:bg-rose-200",
];
type CalendarCourse = { id: string; title: string };

export function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}min`;
  return rest === 0 ? `${hours}h` : `${hours}h${String(rest).padStart(2, "0")}`;
}

export function formatClock(minuteOfDay: number) {
  const value = minuteOfDay % 1440;
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}

export function formatDate(date: string) {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

function monthsOf(days: CronogramaDay[]) {
  const months: string[] = [];

  for (const day of days) {
    const key = day.date.slice(0, 7);
    if (!months.includes(key)) months.push(key);
  }

  return months;
}

function monthCells(month: string) {
  const first = `${month}-01`;
  const [year, monthNumber] = month.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const blanks = Array.from({ length: weekdayOf(first) }, () => null);
  return [...blanks, ...Array.from({ length: daysInMonth }, (_, index) => addDays(first, index))];
}

function LessonChip({
  colorClass,
  date,
  lesson,
  today,
}: {
  colorClass: string;
  date: string;
  lesson: CronogramaLesson;
  today: string;
}) {
  const state = lesson.completed ? "done" : date < today ? "late" : "pending";
  const label = { done: "Assistida", late: "Atrasada", pending: "Pendente" }[state];

  return (
    <Link
      className={cn("block rounded-md px-2 py-1 text-left text-slate-900 transition", colorClass)}
      href={`/app/courses/${lesson.courseId}/lessons/${lesson.id}`}
      title={`${lesson.title} - ${label}`}
    >
      <span className="flex items-center gap-1.5">
        <span
          aria-label={label}
          className={cn(
            "h-2 w-2 shrink-0 rounded-full",
            state === "done" && "bg-green-500",
            state === "late" && "bg-red-500",
            state === "pending" && "bg-slate-400",
          )}
        />
        <span className={cn("truncate text-xs font-semibold", state === "done" && "line-through opacity-70")}>
          {lesson.title}
        </span>
      </span>
      <span className="block pl-3.5 text-[11px] text-slate-600">
        {formatClock(lesson.startMinute)} - {formatClock(lesson.endMinute)}
      </span>
    </Link>
  );
}

export function StudyCalendar({ courses, days, today }: { courses: CalendarCourse[]; days: CronogramaDay[]; today: string }) {
  const byDate = new Map(days.map((day) => [day.date, day]));
  const colorOf = (courseId: string) => COURSE_COLORS[Math.max(0, courses.findIndex((course) => course.id === courseId)) % COURSE_COLORS.length];

  return (
    <div className="space-y-8 overflow-x-auto">
      {monthsOf(days).map((month) => {
        const [year, monthNumber] = month.split("-").map(Number);

        return (
          <section className="min-w-[860px]" key={month}>
            <h3 className="mb-2 text-base font-semibold text-copy-primary">
              {MONTH_LABELS[monthNumber - 1]} {year}
            </h3>
            <div className="grid grid-cols-7 border-l border-t border-stroke-subtle text-center text-xs text-copy-muted">
              {WEEKDAY_LABELS.map((label) => (
                <div className="border-b border-r border-stroke-subtle py-1" key={label}>
                  {label}
                </div>
              ))}
              {monthCells(month).map((date, index) => {
                const lessons = (date ? byDate.get(date)?.lessons : undefined) ?? [];
                const extra = lessons.slice(VISIBLE_PER_DAY);

                return (
                  <div
                    className="min-h-28 space-y-1 border-b border-r border-stroke-subtle p-1.5 text-left"
                    key={date ?? `blank-${index}`}
                  >
                    {date ? (
                      <div
                        className={cn(
                          "mb-1 text-center text-xs font-semibold text-copy-secondary",
                          date === today && "mx-auto w-fit rounded-md border border-brand-primary px-1.5 text-brand-primary",
                        )}
                      >
                        {Number(date.slice(8))}
                      </div>
                    ) : null}
                    {date
                      ? lessons
                          .slice(0, VISIBLE_PER_DAY)
                          .map((lesson) => (
                            <LessonChip colorClass={colorOf(lesson.courseId)} date={date} key={lesson.id} lesson={lesson} today={today} />
                          ))
                      : null}
                    {date && extra.length > 0 ? (
                      <details className="space-y-1">
                        <summary className="cursor-pointer text-xs text-copy-secondary underline">
                          Mais {extra.length}
                        </summary>
                        <div className="mt-1 space-y-1">
                          {extra.map((lesson) => (
                            <LessonChip colorClass={colorOf(lesson.courseId)} date={date} key={lesson.id} lesson={lesson} today={today} />
                          ))}
                        </div>
                      </details>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
