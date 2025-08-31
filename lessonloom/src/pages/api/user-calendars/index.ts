import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { prisma } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ message: 'Unauthorized' });

  if (req.method === 'GET') {
    const calendars = await prisma.userCalendar.findMany({ where: { userId: session.user.id }, include: { holidays: true }, orderBy: { createdAt: 'desc' } });
    return res.status(200).json({ calendars });
  }

  if (req.method === 'POST') {
    const { name, year, countryId, templateId } = req.body as { name: string; year: number; countryId: string; templateId?: string };
    if (!name || !year || !countryId) return res.status(400).json({ message: 'Missing fields' });
    let holidays: { name: string; date: Date }[] = [];
    if (templateId) {
      const template = await prisma.academicCalendarTemplate.findUnique({ where: { id: templateId }, include: { holidays: true } });
      if (template) {
        holidays = template.holidays.map((h) => ({ name: h.name, date: h.date }));
      }
    }
    const cal = await prisma.userCalendar.create({
      data: {
        userId: session.user.id,
        countryId,
        name,
        year,
        term1Start: new Date(year, 0, 1),
        term1End: new Date(year, 3, 1),
        holidays: { create: holidays.map((h) => ({ name: h.name, date: h.date })) },
      },
      include: { holidays: true },
    });
    return res.status(201).json({ calendar: cal });
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

