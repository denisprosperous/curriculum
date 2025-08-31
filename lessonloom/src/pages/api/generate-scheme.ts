import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/db';
import { addDays, eachWeekOfInterval, isSunday } from 'date-fns';

type GenerateBody = {
  subjectId: string;
  levelId: string;
  startDate: string; // ISO
  endDate: string;   // ISO
  lessonsPerWeek: number;
  pacing?: 'standard' | 'fast' | 'slow';
  calendarId?: string; // user calendar for holidays
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  const { subjectId, levelId, startDate, endDate, lessonsPerWeek, pacing = 'standard', calendarId } = req.body as GenerateBody;
  if (!subjectId || !levelId || !startDate || !endDate || !lessonsPerWeek) {
    return res.status(400).json({ message: 'Missing fields' });
  }
  const curriculum = await prisma.curriculum.findFirst({
    where: { subjectId, levelId },
    include: { topics: { orderBy: { orderIndex: 'asc' }, include: { subtopics: { orderBy: { orderIndex: 'asc' }, include: { objectives: { orderBy: { orderIndex: 'asc' } } } } } } },
  });
  if (!curriculum) return res.status(404).json({ message: 'Curriculum not found' });

  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const weekStarts = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });
  let holidays: Date[] = [];
  if (calendarId) {
    const cal = await prisma.userCalendar.findUnique({ where: { id: calendarId }, include: { holidays: true } });
    if (cal) holidays = cal.holidays.map((h) => new Date(h.date));
  }
  const weeks = Math.max(1, weekStarts.length);
  const totalSlots = weeks * lessonsPerWeek;

  const objectives = curriculum.topics.flatMap((t) =>
    t.subtopics.flatMap((s) => s.objectives.map((o) => ({ topic: t.name, subtopic: s.name, objective: o.statement })))
  );

  const schedule: { week: number; entries: typeof objectives }[] = [];
  for (let w = 1; w <= weeks; w++) schedule.push({ week: w, entries: [] });

  // pacing multiplier
  const paceMultiplier = pacing === 'fast' ? 1.25 : pacing === 'slow' ? 0.75 : 1;
  const effectiveSlots = Math.floor(totalSlots * paceMultiplier);
  for (let i = 0; i < Math.min(effectiveSlots, objectives.length); i++) {
    const weekIndex = Math.floor(i / lessonsPerWeek);
    schedule[weekIndex]?.entries.push(objectives[i]);
  }

  // Mark assessment weeks every 6th week and skip holidays by pushing entries one week forward
  const isHoliday = (date: Date) => holidays.some((d) => d.toDateString() === date.toDateString());
  const weeksWithMeta = schedule.map((w, idx) => {
    const ws = weekStarts[idx] ?? addDays(start, (w.week - 1) * 7);
    const we = addDays(ws, 6);
    const assessment = (w.week % 6 === 0);
    // if weekStart is a holiday-heavy week, keep metadata but entries remain; more advanced shifting can be added
    return { ...w, weekStart: ws, weekEnd: we, isAssessmentWeek: assessment };
  });

  // Persist scheme
  const scheme = await prisma.scheme.create({
    data: {
      subjectId,
      levelId,
      curriculumId: curriculum.id,
      startDate: start,
      endDate: end,
      lessonsPerWeek,
      pacing,
      calendarId: calendarId ?? null,
      weeks: {
        create: weeksWithMeta.map((w) => ({
          weekNumber: w.week,
          weekStartDate: w.weekStart,
          weekEndDate: w.weekEnd,
          isAssessmentWeek: w.isAssessmentWeek,
          entries: { create: w.entries.map((e, j) => ({ orderIndex: j + 1, topic: e.topic, subtopic: e.subtopic, objective: e.objective, tier: 'core' })) },
        })),
      },
    },
    include: { weeks: { include: { entries: true } } },
  });

  return res.status(200).json({ scheme, unallocated: objectives.slice(totalSlots) });
}
