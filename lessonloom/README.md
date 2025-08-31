## LessonLoom

Generate localized, exam-board–aligned schemes of work and ready-to-teach resources.

### Getting Started

1. Install dependencies:
   - `npm install`
2. Setup env:
   - copy `.env.example` to `.env` and set secrets
3. Initialize DB:
   - Start Postgres: `docker compose up -d db`
   - Dev: `npm run migrate:dev`
   - `npm run seed`
   - Prod: `npm run migrate:deploy`
4. Run dev server:
   - `npm run dev`

### Tech
- Next.js 14 (App Router)
- Prisma + Postgres
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
- Dockerfile included. Ensure `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, and Postgres `DATABASE_URL` are set.

