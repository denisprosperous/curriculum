import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/db';

type GenerateBody = {
  subjectId: string;
  levelId: string;
  startDate: string; // ISO
  endDate: string;   // ISO
  lessonsPerWeek: number;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
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
  const weeks = Math.max(1, Math.ceil(days / 7));
  const totalSlots = weeks * lessonsPerWeek;

  const objectives = curriculum.topics.flatMap((t) =>
    t.subtopics.flatMap((s) => s.objectives.map((o) => ({ topic: t.name, subtopic: s.name, objective: o.statement })))
  );

  const schedule: { week: number; entries: typeof objectives }[] = [];
  for (let w = 1; w <= weeks; w++) schedule.push({ week: w, entries: [] });

  for (let i = 0; i < Math.min(totalSlots, objectives.length); i++) {
    const weekIndex = Math.floor(i / lessonsPerWeek);
    schedule[weekIndex]?.entries.push(objectives[i]);
  }

  return res.status(200).json({
    curriculumId: curriculum.id,
    weeks,
    lessonsPerWeek,
    schedule,
    unallocated: objectives.slice(totalSlots),
  });
}
