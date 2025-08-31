import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/db';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
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

  const children: Paragraph[] = [];
  children.push(new Paragraph({ text: `${scheme.subject.name} – ${scheme.level.name} Scheme of Work`, heading: HeadingLevel.HEADING_1 }));
  children.push(new Paragraph({ text: `Dates: ${scheme.startDate.toISOString().slice(0,10)} to ${scheme.endDate.toISOString().slice(0,10)}` }));
  children.push(new Paragraph({ text: `Lessons per week: ${scheme.lessonsPerWeek}` }));

  for (const week of scheme.weeks) {
    children.push(new Paragraph({ text: `Week ${week.weekNumber}`, heading: HeadingLevel.HEADING_2 }));
    if (week.entries.length === 0) {
      children.push(new Paragraph({ text: 'No entries', children: [new TextRun('No entries')] }));
      continue;
    }
    for (const entry of week.entries) {
      children.push(new Paragraph({
        children: [
          new TextRun({ text: `${entry.orderIndex}. `, bold: true }),
          new TextRun({ text: `${entry.topic} – ${entry.subtopic}: ${entry.objective}` }),
        ],
      }));
    }
  }

  const doc = new Document({ sections: [{ children }] });
  const buffer = await Packer.toBuffer(doc);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  res.setHeader('Content-Disposition', `attachment; filename="scheme-${schemeId}.docx"`);
  res.send(Buffer.from(buffer));
}
