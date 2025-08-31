import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { prisma } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ message: 'Unauthorized' });

  if (req.method === 'GET') {
    const schemes = await prisma.scheme.findMany({
      where: { userId: session.user.id },
      include: { subject: true, level: true },
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json({ schemes });
  }

  return res.status(405).json({ message: 'Method not allowed' });
}

