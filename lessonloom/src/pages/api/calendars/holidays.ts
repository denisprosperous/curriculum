import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { calendarId } = req.method === 'GET' ? (req.query as any) : (req.body as any);
  if (!calendarId) return res.status(400).json({ message: 'Missing calendarId' });
  if (req.method === 'GET') {
    const holidays = await prisma.userHoliday.findMany({ where: { calendarId }, orderBy: { date: 'asc' } });
    return res.status(200).json({ holidays });
  }
  if (req.method === 'POST') {
    const { name, date } = req.body as { name: string; date: string };
    const h = await prisma.userHoliday.create({ data: { calendarId, name, date: new Date(date) } });
    return res.status(201).json({ holiday: h });
  }
  if (req.method === 'DELETE') {
    const { holidayId } = req.body as { holidayId: string };
    await prisma.userHoliday.delete({ where: { id: holidayId } });
    return res.status(204).end();
  }
  res.status(405).end();
}
