import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/db';

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  const items = await prisma.resource.findMany({
    include: { subject: { include: { examBoard: { include: { country: true } } } }, level: true },
    orderBy: { createdAt: 'desc' },
  });
  res.status(200).json({ items });
}
