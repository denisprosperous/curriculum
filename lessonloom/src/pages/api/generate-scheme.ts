import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/db';
import { eachWeekOfInterval } from 'date-fns';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { buildSchedule } from '@/lib/schedule';

type GenerateBody = {
  subjectId: string;
  levelId: string;
  startDate: string; // ISO
  endDate: string;   // ISO
  lessonsPerWeek: number;
  userCalendarId?: string; // optional: to skip holidays
  weekdays?: number[]; // optional selected weekdays 0-6
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
  const weekStarts = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });

  const objectives = curriculum.topics.flatMap((t) =>
    t.subtopics.flatMap((s) => s.objectives.map((o) => ({ topic: t.name, subtopic: s.name, objective: o.statement })))
  );
  // Build holiday date list if calendar provided
  let holidayDates: Date[] = [];
  if (req.body.userCalendarId) {
    const cal = await prisma.userCalendar.findFirst({
      where: { id: req.body.userCalendarId, userId: session.user.id },
      include: { holidays: true },
    });
    if (cal) holidayDates = cal.holidays.map((h) => new Date(h.date));
  }

  const weekdays = (req.body.weekdays && Array.isArray(req.body.weekdays) && req.body.weekdays.length)
    ? req.body.weekdays as number[]
    : [1, 3, 5]; // default Mon/Wed/Fri-like: but mapping handled in util

  const scheduleBuilt = buildSchedule({ start, end, lessonsPerWeek, weekdays, holidayDates }, objectives);

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
        create: scheduleBuilt.map((w) => ({
          weekNumber: w.weekNumber,
          weekStartDate: w.weekStartDate,
          weekEndDate: w.weekEndDate,
          entries: { create: w.entries.map((e, j) => ({ orderIndex: j + 1, topic: e.topic, subtopic: e.subtopic, objective: e.objective, lessonDate: e.lessonDate })) },
        })),
      },
    },
    include: { weeks: { include: { entries: true } } },
  });

  const totalScheduled = scheduleBuilt.reduce((sum, w) => sum + w.entries.length, 0);
  return res.status(200).json({ scheme, unallocated: objectives.slice(totalScheduled) });
}
