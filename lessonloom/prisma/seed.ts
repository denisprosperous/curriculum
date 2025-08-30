import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function ensureBaselineCurriculum(client: PrismaClient, subjectId: string, levelId: string) {
  const cur = await client.curriculum.upsert({
    where: { subjectId_levelId_year: { subjectId, levelId, year: 2024 } },
    update: {},
    create: { subjectId, levelId, year: 2024 },
  });
  const existingTopics = await client.topic.count({ where: { curriculumId: cur.id } });
  if (existingTopics === 0) {
    const topic = await client.topic.create({
      data: { name: 'Introduction and Diagnostic', orderIndex: 1, curriculumId: cur.id },
    });
    const sub = await client.subtopic.create({
      data: { name: 'Baseline and review', orderIndex: 1, topicId: topic.id },
    });
    await client.objective.createMany({
      data: [
        { statement: 'Review prior knowledge and diagnostic assessment', orderIndex: 1, subtopicId: sub.id },
        { statement: 'Set term learning goals and expectations', orderIndex: 2, subtopicId: sub.id },
      ],
    });
  }
}

async function upsertSubjectWithLevels(client: PrismaClient, examBoardId: string, subject: { code: string; name: string }) {
  const s = await client.subject.upsert({
    where: { code_examBoardId: { code: subject.code, examBoardId } },
    update: {},
    create: { code: subject.code, name: subject.name, examBoardId },
  });
  const lower = await client.level.upsert({
    where: { code_subjectId: { code: 'LOWER', subjectId: s.id } },
    update: {},
    create: { code: 'LOWER', name: 'Lower Secondary', subjectId: s.id },
  });
  const upper = await client.level.upsert({
    where: { code_subjectId: { code: 'UPPER', subjectId: s.id } },
    update: {},
    create: { code: 'UPPER', name: 'Upper Secondary', subjectId: s.id },
  });
  await ensureBaselineCurriculum(client, s.id, lower.id);
  await ensureBaselineCurriculum(client, s.id, upper.id);
}

async function createCountryBundle(params: {
  code: string;
  name: string;
  board: { code: string; name: string };
  subjects: { code: string; name: string }[];
  calendar: {
    name: string;
    year: number;
    term1Start: string; term1End: string;
    term2Start?: string; term2End?: string;
    term3Start?: string; term3End?: string;
    holidays?: { name: string; date: string }[];
  };
}) {
  return prisma.$transaction(async (tx) => {
    const country = await tx.country.upsert({
      where: { code: params.code },
      update: {},
      create: { code: params.code, name: params.name },
    });
    const board = await tx.examBoard.upsert({
      where: { code_countryId: { code: params.board.code, countryId: country.id } },
      update: {},
      create: { code: params.board.code, name: params.board.name, countryId: country.id },
    });
    for (const subj of params.subjects) {
      await upsertSubjectWithLevels(tx as unknown as PrismaClient, board.id, subj);
    }
    const cal = await tx.academicCalendarTemplate.upsert({
      where: { countryId_year_name: { countryId: country.id, year: params.calendar.year, name: params.calendar.name } },
      update: {},
      create: {
        countryId: country.id,
        name: params.calendar.name,
        year: params.calendar.year,
        term1Start: new Date(params.calendar.term1Start),
        term1End: new Date(params.calendar.term1End),
        term2Start: params.calendar.term2Start ? new Date(params.calendar.term2Start) : null,
        term2End: params.calendar.term2End ? new Date(params.calendar.term2End) : null,
        term3Start: params.calendar.term3Start ? new Date(params.calendar.term3Start) : null,
        term3End: params.calendar.term3End ? new Date(params.calendar.term3End) : null,
      },
    });
    if (params.calendar.holidays?.length) {
      for (const h of params.calendar.holidays) {
        await tx.holiday.upsert({
          where: { templateId_name_date: { templateId: cal.id, name: h.name, date: new Date(h.date) } },
          update: {},
          create: { templateId: cal.id, name: h.name, date: new Date(h.date) },
        });
      }
    }
    return country;
  });
}

async function main() {
  // Cameroon
  await createCountryBundle({
    code: 'CM', name: 'Cameroon',
    board: { code: 'GCE', name: 'Cameroon GCE' },
    subjects: [
      { code: 'MATH', name: 'Mathematics' },
      { code: 'ENG', name: 'English Language' },
      { code: 'BIO', name: 'Biology' },
      { code: 'CHEM', name: 'Chemistry' },
      { code: 'PHYS', name: 'Physics' },
    ],
    calendar: {
      name: 'National 2024/25', year: 2024,
      term1Start: '2024-09-02', term1End: '2024-12-13',
      term2Start: '2025-01-06', term2End: '2025-03-28',
      term3Start: '2025-04-21', term3End: '2025-06-27',
      holidays: [
        { name: 'Independence Day', date: '2025-05-20' },
        { name: 'Christmas Day', date: '2024-12-25' },
        { name: "New Year's Day", date: '2025-01-01' },
      ],
    },
  });

  // Ghana
  await createCountryBundle({
    code: 'GH', name: 'Ghana',
    board: { code: 'WAEC', name: 'WAEC (WASSCE/BECE)' },
    subjects: [ { code: 'MATH', name: 'Mathematics' } ],
    calendar: {
      name: 'National 2024/25', year: 2024,
      term1Start: '2024-09-16', term1End: '2024-12-06',
      term2Start: '2025-01-13', term2End: '2025-03-28',
      term3Start: '2025-04-28', term3End: '2025-07-05',
    },
  });

  // Nigeria
  await createCountryBundle({
    code: 'NG', name: 'Nigeria',
    board: { code: 'WAEC', name: 'WAEC (SSCE)' },
    subjects: [ { code: 'MATH', name: 'Mathematics' } ],
    calendar: {
      name: 'National 2024/25', year: 2024,
      term1Start: '2024-09-09', term1End: '2024-12-13',
      term2Start: '2025-01-06', term2End: '2025-03-28',
      term3Start: '2025-04-28', term3End: '2025-07-12',
    },
  });

  // Kenya
  await createCountryBundle({
    code: 'KE', name: 'Kenya',
    board: { code: 'KNEC', name: 'KNEC (KCSE)' },
    subjects: [ { code: 'MATH', name: 'Mathematics' } ],
    calendar: {
      name: 'National 2024', year: 2024,
      term1Start: '2024-01-08', term1End: '2024-04-05',
      term2Start: '2024-05-06', term2End: '2024-08-02',
      term3Start: '2024-08-26', term3End: '2024-10-25',
    },
  });

  // Uganda
  await createCountryBundle({
    code: 'UG', name: 'Uganda',
    board: { code: 'NCDC', name: 'NCDC (UCE/UACE)' },
    subjects: [ { code: 'MATH', name: 'Mathematics' } ],
    calendar: {
      name: 'National 2024', year: 2024,
      term1Start: '2024-02-05', term1End: '2024-05-03',
      term2Start: '2024-05-27', term2End: '2024-08-23',
      term3Start: '2024-09-16', term3End: '2024-12-06',
    },
  });

  // South Africa
  await createCountryBundle({
    code: 'ZA', name: 'South Africa',
    board: { code: 'CAPS', name: 'CAPS (DBE/IEB)' },
    subjects: [ { code: 'MATH', name: 'Mathematics' } ],
    calendar: {
      name: 'National 2024', year: 2024,
      term1Start: '2024-01-17', term1End: '2024-03-20',
      term2Start: '2024-04-03', term2End: '2024-06-14',
      term3Start: '2024-07-09', term3End: '2024-09-20',
    },
  });

  console.log('Seeded baseline data for CM, GH, NG, KE, UG, ZA.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

