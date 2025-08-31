import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query as { id: string };
  if (req.method === 'PATCH') {
    const { title, description, priceCents, subjectId, levelId, fileKey } = req.body as any;
    const updated = await prisma.resource.update({ where: { id }, data: { title, description, priceCents: Number(priceCents), subjectId: subjectId || null, levelId: levelId || null, fileKey } });
    return res.status(200).json({ resource: updated });
  }
  if (req.method === 'DELETE') {
    await prisma.resource.delete({ where: { id } });
    return res.status(204).end();
  }
  res.status(405).end();
}
