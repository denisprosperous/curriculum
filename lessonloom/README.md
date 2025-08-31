## LessonLoom

Generate localized, exam-board–aligned schemes of work and ready-to-teach resources.

### Getting Started

1. Install dependencies:
   - `npm install`
2. Setup env:
   - copy `.env.example` to `.env` and set secrets
3. Initialize DB:
   - Dev: `npm run migrate:dev`
   - Prod: `npm run migrate:deploy`
   - `npm run seed`
4. Run dev server:
   - `npm run dev`

### Tech
- Next.js 14 (App Router)
- Prisma + SQLite (dev)
- Tailwind CSS

### API
- GET `/api/catalog`
- POST `/api/generate-scheme` (auth) { subjectId, levelId, startDate, endDate, lessonsPerWeek, userCalendarId? }
- GET `/api/schemes` (auth)
- GET `/api/schemes/[id]` (auth, owner)
- DELETE `/api/schemes/[id]` (auth, owner)
- GET/POST `/api/export/pdf` (auth, owner)
- GET/POST `/api/export/docx` (auth, owner)

### Deploy
- Dockerfile included. Ensure `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, and DB URL are set.

