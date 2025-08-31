import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { userId, resourceId, mode } = req.body as { userId: string; resourceId: string; mode?: 'live' | 'stub' };
  if (!userId || !resourceId) return res.status(400).json({ message: 'Missing fields' });
  const resource = await prisma.resource.findUnique({ where: { id: resourceId } });
  if (!resource) return res.status(404).json({ message: 'Resource not found' });

  const useLive = process.env.FLUTTERWAVE_SECRET_KEY && mode === 'live';
  if (!useLive) {
    const purchase = await prisma.purchase.create({ data: { userId, resourceId, amountCents: resource.priceCents, currency: 'KES', status: 'succeeded' } });
    await prisma.license.upsert({ where: { userId_resourceId: { userId, resourceId } }, update: {}, create: { userId, resourceId } });
    await prisma.paymentTransaction.create({ data: { userId, amountCents: resource.priceCents, currency: 'KES', provider: 'flutterwave_stub', status: 'succeeded' } });
    return res.status(200).json({ ok: true, purchaseId: purchase.id, stub: true });
  }
  return res.status(200).json({ ok: true, checkoutUrl: '/library' });
}
