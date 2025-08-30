import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ ok: true, name: 'LessonLoom', time: new Date().toISOString() });
}
