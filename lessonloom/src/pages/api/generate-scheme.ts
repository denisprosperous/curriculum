import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/db';
import { addDays, eachWeekOfInterval, isSunday, isWithinInterval } from 'date-fns';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

type GenerateBody = {
  subjectId: string;
  levelId: string;
  startDate: string; // ISO
  endDate: string;   // ISO
  lessonsPerWeek: number;
  userCalendarId?: string; // optional: to skip holidays
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ message: 'Unauthorized' });
  const { subjectId, levelId, startDate, endDate, lessonsPerWeek } = req.body as GenerateBody;
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
  const weeks = Math.max(1, weekStarts.length);
  const totalSlots = weeks * lessonsPerWeek;

  const objectives = curriculum.topics.flatMap((t) =>
    t.subtopics.flatMap((s) => s.objectives.map((o) => ({ topic: t.name, subtopic: s.name, objective: o.statement })))
  );

  const schedule: { week: number; entries: typeof objectives }[] = [];
  for (let w = 1; w <= weeks; w++) schedule.push({ week: w, entries: [] });

  // Optionally skip lessons falling on holiday weeks (simplified: if a holiday falls within a given week interval, reduce capacity by 1 for that week)
  let holidayCountsByWeek: Record<number, number> = {};
  if (req.body.userCalendarId) {
    const cal = await prisma.userCalendar.findFirst({
      where: { id: req.body.userCalendarId, userId: session.user.id },
      include: { holidays: true },
    });
    if (cal) {
      holidayCountsByWeek = weekStarts.reduce((acc, ws, idx) => {
        const weekStart = ws;
        const weekEnd = addDays(ws, 6);
        const count = cal.holidays.filter((h) =>
          isWithinInterval(h.date, { start: weekStart, end: weekEnd })
        ).length;
        acc[idx] = count;
        return acc;
      }, {} as Record<number, number>);
    }
  }

  const capacities = schedule.map((_, idx) => Math.max(0, lessonsPerWeek - (holidayCountsByWeek[idx] ?? 0)));

  let objectiveIndex = 0;
  for (let weekIndex = 0; weekIndex < weeks; weekIndex++) {
    const cap = capacities[weekIndex] ?? lessonsPerWeek;
    for (let slot = 0; slot < cap && objectiveIndex < objectives.length; slot++) {
      schedule[weekIndex]?.entries.push(objectives[objectiveIndex]);
      objectiveIndex++;
    }
  }

  // Persist scheme
  const scheme = await prisma.scheme.create({
    data: {
      userId: session.user.id,
      subjectId,
      levelId,
      curriculumId: curriculum.id,
      startDate: start,
      endDate: end,
      lessonsPerWeek,
      weeks: {
        create: schedule.map((w, idx) => ({
          weekNumber: w.week,
          weekStartDate: weekStarts[idx] ?? addDays(start, (w.week - 1) * 7),
          weekEndDate: addDays((weekStarts[idx] ?? addDays(start, (w.week - 1) * 7)), 6),
          entries: { create: w.entries.map((e, j) => ({ orderIndex: j + 1, topic: e.topic, subtopic: e.subtopic, objective: e.objective })) },
        })),
      },
    },
    include: { weeks: { include: { entries: true } } },
  });

  return res.status(200).json({ scheme, unallocated: objectives.slice(totalSlots) });
}
