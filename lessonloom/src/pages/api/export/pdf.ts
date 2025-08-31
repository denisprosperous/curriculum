import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/db';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ message: 'Unauthorized' });
  const schemeId = (req.query.schemeId as string) || (req.body?.schemeId as string);
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).end();
  if (!schemeId) return res.status(400).json({ message: 'Missing schemeId' });
  const scheme = await prisma.scheme.findUnique({
    where: { id: schemeId },
    include: { subject: true, level: true, weeks: { orderBy: { weekNumber: 'asc' }, include: { entries: { orderBy: { orderIndex: 'asc' } } } } },
  });
  if (!scheme) return res.status(404).json({ message: 'Scheme not found' });
  if (scheme.userId && scheme.userId !== session.user.id) return res.status(403).json({ message: 'Forbidden' });

  const pdf = await PDFDocument.create();
  let page = pdf.addPage([595.28, 841.89]); // A4 portrait
  const { width, height } = page.getSize();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  let y = height - 40;
  const drawText = (text: string, size = 12, bold = false) => {
    page.drawText(text, { x: 40, y, size, font, color: rgb(0, 0, 0) });
    y -= size + 6;
  };

  drawText(`${scheme.subject.name} – ${scheme.level.name} Scheme of Work`, 16);
  drawText(`Dates: ${scheme.startDate.toISOString().slice(0,10)} to ${scheme.endDate.toISOString().slice(0,10)}`);
  drawText(`Lessons per week: ${scheme.lessonsPerWeek}`);
  y -= 6;
  for (const week of scheme.weeks) {
    drawText(`Week ${week.weekNumber}`, 14);
    if (week.entries.length === 0) {
      drawText('No entries');
      continue;
    }
    for (const entry of week.entries) {
      if (y < 60) {
        page = pdf.addPage([595.28, 841.89]);
        y = page.getSize().height - 40;
      }
      drawText(`${entry.orderIndex}. ${entry.topic} – ${entry.subtopic}: ${entry.objective}`);
    }
    y -= 6;
  }

  const bytes = await pdf.save();
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="scheme-${schemeId}.pdf"`);
  res.send(Buffer.from(bytes));
}
