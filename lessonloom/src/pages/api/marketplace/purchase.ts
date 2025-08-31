import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { userId, resourceId } = req.body as { userId: string; resourceId: string };
  if (!userId || !resourceId) return res.status(400).json({ message: 'Missing fields' });
  const resource = await prisma.resource.findUnique({ where: { id: resourceId } });
  if (!resource) return res.status(404).json({ message: 'Resource not found' });
  // Payment stub: mark succeeded and create license
  const purchase = await prisma.purchase.create({ data: { userId, resourceId, amountCents: resource.priceCents, currency: 'USD', status: 'succeeded' } });
  await prisma.license.upsert({ where: { userId_resourceId: { userId, resourceId } }, update: {}, create: { userId, resourceId } });
  await prisma.paymentTransaction.create({ data: { userId, amountCents: resource.priceCents, currency: 'USD', provider: 'stub', status: 'succeeded' } });
  res.status(201).json({ purchaseId: purchase.id });
}
