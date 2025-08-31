import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { prisma } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ message: 'Unauthorized' });

  const { id } = req.query as { id: string };

  if (req.method === 'GET') {
    const scheme = await prisma.scheme.findFirst({
      where: { id, userId: session.user.id },
      include: {
        subject: true,
        level: true,
        weeks: { orderBy: { weekNumber: 'asc' }, include: { entries: { orderBy: { orderIndex: 'asc' } } } },
      },
    });
    if (!scheme) return res.status(404).json({ message: 'Not found' });
    return res.status(200).json({ scheme });
  }

  if (req.method === 'DELETE') {
    const existing = await prisma.scheme.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.user.id) return res.status(404).json({ message: 'Not found' });
    await prisma.scheme.delete({ where: { id } });
    return res.status(204).end();
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

