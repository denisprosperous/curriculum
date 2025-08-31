import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { countryId } = req.query as { countryId?: string };
  const where = countryId ? { countryId } : {};
  const templates = await prisma.academicCalendarTemplate.findMany({
    where,
    orderBy: [{ year: 'desc' }, { name: 'asc' }],
  });
  res.status(200).json({ templates });
}
