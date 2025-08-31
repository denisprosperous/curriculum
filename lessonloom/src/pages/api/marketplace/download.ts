import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId, resourceId, preview } = (req.method === 'GET' ? req.query : req.body) as any;
  if (!userId || !resourceId) return res.status(400).json({ message: 'Missing fields' });
  const hasLicense = await prisma.license.findUnique({ where: { userId_resourceId: { userId, resourceId } } });
  if (!hasLicense && !preview) return res.status(403).json({ message: 'No license' });
  // Stub content
  const resource = await prisma.resource.findUnique({ where: { id: resourceId } });
  if (!resource) return res.status(404).json({ message: 'Resource not found' });
  const content = `Title: ${resource.title}\nSKU: ${resource.sku}\n\nThis is a ${(preview ? 'WATERMARKED PREVIEW' : 'FULL')} file stub.`;
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Content-Disposition', `attachment; filename="${resource.sku}${preview ? '-preview' : ''}.txt"`);
  res.send(content);
}
