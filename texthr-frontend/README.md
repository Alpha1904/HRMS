# texthr-frontend

Vanilla JavaScript + Tailwind CSS frontend for the HRMS **Managing Departures** module.

## Requirements

- Backend running at `http://localhost:3000` (NestJS)
- Seeded users (from `server/prisma/seed.ts`)

## Quick start

1. Start backend

- From `server/` run `npm run go` (or `npm run start`)

2. Run the seed (optional)

- From `server/` run `npm run seed`

3. Serve this frontend

This frontend is plain static files.

- Use VS Code Live Server, or
- Any static server of your choice

Open:

- `texthr-frontend/index.html`

## Auth / Token

- Login calls `POST /api/auth/login`
- The backend returns JSON containing `accessToken`
- The frontend stores it in `localStorage` under key `token`
- All API calls send `Authorization: Bearer <token>`

## Configuration

- API base defaults to `http://localhost:3000/api`
- Override by setting `localStorage.apiBase` in the browser console.

## Pages

- `login.html` – login form
- `dashboard.html` – single-page dashboard (hash routing)

Routes:

- `#overview`
- `#departures`
- `#departure/:id`
- `#tasks`

## Covered endpoints (current)

- `POST /api/auth/login`
- `GET /api/auth/me`

Departures:

- `GET /api/departures`
- `POST /api/departures`
- `GET /api/departures/:id`
- `PATCH /api/departures/:id/status`
- `PATCH /api/departures/:id/severance`

Checklist:

- `GET /api/departures/:id/checklist`
- `POST /api/departures/:id/checklist`
- `PATCH /api/checklist/:itemId`

Documents:

- `GET /api/departures/:id/documents`
- `POST /api/departures/:id/documents` (multipart)
- `DELETE /api/departures/documents/:documentId`

Exit interview:

- `POST /api/departures/:id/interview/schedule`
- `PATCH /api/departures/:id/interview/conduct`

Exit survey:

- `POST /api/departures/:id/survey`

Handover:

- `POST /api/departures/:id/handover`
- `PATCH /api/departures/:id/handover/complete`

Timeline:

- Rendered from `GET /api/departures/:id` (includes `history`)
