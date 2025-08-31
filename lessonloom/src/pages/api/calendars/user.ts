import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = (req.query.userId as string) || (req.body?.userId as string);
  if (!userId) return res.status(400).json({ message: 'Missing userId' });
  if (req.method === 'GET') {
    const calendars = await prisma.userCalendar.findMany({ where: { userId }, include: { holidays: true } });
    return res.status(200).json({ calendars });
  }
  if (req.method === 'POST') {
    const { countryId, templateId, name, year } = req.body as { countryId: string; templateId?: string; name: string; year: number };
    if (!countryId || !name || !year) return res.status(400).json({ message: 'Missing fields' });
    let base: any = {};
    if (templateId) {
      const t = await prisma.academicCalendarTemplate.findUnique({ where: { id: templateId }, include: { holidays: true } });
      if (t) {
        base = {
          term1Start: t.term1Start, term1End: t.term1End,
          term2Start: t.term2Start, term2End: t.term2End,
          term3Start: t.term3Start, term3End: t.term3End,
        };
      }
    }
    const created = await prisma.userCalendar.create({
      data: {
        userId, countryId, name, year,
        term1Start: base.term1Start ?? new Date(`${year}-09-01`),
        term1End: base.term1End ?? new Date(`${year}-12-15`),
        term2Start: base.term2Start ?? new Date(`${year + 1}-01-10`),
        term2End: base.term2End ?? new Date(`${year + 1}-03-30`),
        term3Start: base.term3Start ?? new Date(`${year + 1}-04-20`),
        term3End: base.term3End ?? new Date(`${year + 1}-06-30`),
      },
    });
    return res.status(201).json({ calendar: created });
  }
  if (req.method === 'PATCH') {
    const { calendarId, updates } = req.body as { calendarId: string; updates: any };
    if (!calendarId) return res.status(400).json({ message: 'Missing calendarId' });
    const updated = await prisma.userCalendar.update({ where: { id: calendarId }, data: updates });
    return res.status(200).json({ calendar: updated });
  }
  res.status(405).end();
}
