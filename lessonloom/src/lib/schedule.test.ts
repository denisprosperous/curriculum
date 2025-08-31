import { buildSchedule, type Objective } from './schedule';

describe('buildSchedule', () => {
  it('allocates by weekday and skips holidays', () => {
    const start = new Date('2024-09-02'); // Monday
    const end = new Date('2024-09-13'); // Two weeks
    const objectives: Objective[] = Array.from({ length: 10 }).map((_, i) => ({ topic: 'T', subtopic: 'S', objective: `O${i+1}` }));
    const weekdays = [1,3,5]; // Sun..Sat
    const holidayDates = [new Date('2024-09-06')]; // Friday week 1
    const sched = buildSchedule({ start, end, lessonsPerWeek: 3, weekdays, holidayDates }, objectives);
    expect(sched).toHaveLength(2);
    expect(sched[0].entries).toHaveLength(2); // Fri skipped
    expect(sched[1].entries).toHaveLength(3);
    expect(sched[0].entries[0].lessonDate.toISOString().slice(0,10)).toBe('2024-09-02');
    expect(sched[0].entries[1].lessonDate.toISOString().slice(0,10)).toBe('2024-09-04');
  });
});

