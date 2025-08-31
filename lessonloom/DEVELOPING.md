# Developing

## Setup
1. Copy `.env.example` to `.env` and set `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, and DB URL.
2. Install deps: `npm ci`
3. Migrate and seed: `npm run migrate:dev && npm run seed`
4. Start dev: `npm run dev`

## Testing
- Unit tests: `npm test`
- Add tests in `src/**/*.test.ts`

## Schedules
- Generation uses `src/lib/schedule.ts` to map objectives to weekdays between start and end, skipping holidays from an optional `UserCalendar`.

## API endpoints
- Auth: `/api/auth/[...nextauth]`
- Catalog: `/api/catalog`
- Schemes: GET/DELETE `/api/schemes/[id]`, GET `/api/schemes` (paginated), PATCH `/api/schemes/[id]`
- Generate: POST `/api/generate-scheme`
- Export: `/api/export/pdf`, `/api/export/docx`
- Calendars: GET/POST `/api/user-calendars`

## Deployment
- Dockerfile included. Ensure environment variables are set. For production DB, switch Prisma provider to Postgres and set `DATABASE_URL` accordingly.

