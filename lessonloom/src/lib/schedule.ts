import { addDays, eachWeekOfInterval, isWithinInterval } from 'date-fns';

export type Objective = { topic: string; subtopic: string; objective: string };

export type ScheduleParams = {
  start: Date;
  end: Date;
  lessonsPerWeek: number;
  weekdays: number[]; // 0-6 Sun-Sat, but we will map to actual days
  holidayDates?: Date[];
};

export type WeekSchedule = { weekNumber: number; weekStartDate: Date; weekEndDate: Date; entries: (Objective & { lessonDate: Date })[] };

export function buildSchedule(params: ScheduleParams, objectives: Objective[]): WeekSchedule[] {
  const { start, end, lessonsPerWeek, weekdays, holidayDates = [] } = params;
  const weekStarts = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });
  const weeks = Math.max(1, weekStarts.length);
  const normalizedWeekdays = [...weekdays].sort((a, b) => a - b).map((d) => (d + 7) % 7);

  const schedule: WeekSchedule[] = [];
  let objectiveIndex = 0;

  for (let w = 0; w < weeks; w++) {
    const weekStart = weekStarts[w] ?? addDays(start, w * 7);
    const weekEnd = addDays(weekStart, 6);

    const validDays: Date[] = normalizedWeekdays
      .map((weekday) => addDays(weekStart, weekday === 0 ? 6 : weekday - 1)) // convert Sun=0..Sat=6 to Mon=1..Sun=0 mapping
      .filter((d) => isWithinInterval(d, { start, end }))
      .filter((d) => !holidayDates.some((h) => sameDate(h, d)));

    const selectedDays = validDays.slice(0, lessonsPerWeek);
    const entries = selectedDays.map((day) => {
      const obj = objectives[objectiveIndex++];
      return obj ? { ...obj, lessonDate: day } : null;
    }).filter(Boolean) as (Objective & { lessonDate: Date })[];

    schedule.push({ weekNumber: w + 1, weekStartDate: weekStart, weekEndDate: weekEnd, entries });
  }

  return schedule;
}

function sameDate(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

