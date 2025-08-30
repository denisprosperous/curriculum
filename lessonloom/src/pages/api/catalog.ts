import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/db';

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  const countries = await prisma.country.findMany({
    include: {
      examBoards: { include: { subjects: { include: { levels: true } } } },
    },
    orderBy: { name: 'asc' },
  });
  res.status(200).json({ countries });
}
