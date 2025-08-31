import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const items = await prisma.resource.findMany({ include: { subject: true, level: true }, orderBy: { createdAt: 'desc' } });
    return res.status(200).json({ items });
  }
  if (req.method === 'POST') {
    const { sku, title, description, priceCents, subjectId, levelId, fileKey } = req.body as any;
    if (!sku || !title || !description || !priceCents || !fileKey) return res.status(400).json({ message: 'Missing fields' });
    const created = await prisma.resource.create({ data: { sku, title, description, priceCents: Number(priceCents), subjectId: subjectId || null, levelId: levelId || null, fileKey } });
    return res.status(201).json({ resource: created });
  }
  res.status(405).end();
}
