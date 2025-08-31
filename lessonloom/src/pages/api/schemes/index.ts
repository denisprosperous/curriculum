import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { prisma } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ message: 'Unauthorized' });

  if (req.method === 'GET') {
    const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
    const pageSize = 10;
    const where = { userId: session.user.id };
    const [total, schemes] = await Promise.all([
      prisma.scheme.count({ where }),
      prisma.scheme.findMany({
        where,
        include: { subject: true, level: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    return res.status(200).json({ schemes, page, totalPages, total });
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

