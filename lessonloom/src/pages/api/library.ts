import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = (req.query.userId as string) || (req.body?.userId as string);
  if (!userId) return res.status(400).json({ message: 'Missing userId' });
  const items = await prisma.license.findMany({ where: { userId }, include: { resource: true }, orderBy: { createdAt: 'desc' } });
  res.status(200).json({ items });
}
