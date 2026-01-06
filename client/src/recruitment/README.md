# Recruitment Frontend (Static)

This folder contains a standalone recruiter-facing recruitment UI that integrates with the existing NestJS API.

## Location

- `client/src/recruitment/index.html` – Jobs list + per-job Kanban board (drag/drop)
- `client/src/recruitment/candidates.html` – Candidate list + details/edit
- `client/src/recruitment/documents.html` – Document upload + lookup helpers
- `client/src/recruitment/apply.html` – Public application form (no auth)

## Requirements

- Backend running at `http://localhost:3000` with global prefix `/api`.
- A valid JWT access token for a user with role `RECRUITER` or `HR_ADMIN`.

## How to run

### Option A (recommended): Static server

Use any static server (VSCode Live Server, etc.) pointing to `client/src/recruitment/`.

Example (VSCode Live Server):
- Open `client/src/recruitment/index.html`
- Click **Go Live**

### Option B: Open file directly

Double-click `index.html` to open it using `file://…`.

This is supported: the frontend will automatically use `http://localhost:3000/api` as API base when opened via `file://`.

## Authentication (JWT)

- Paste your token into the **JWT token** field (top bar)
- Click **Save**

The token is stored in `localStorage` under key `hrms.jwt`.

You can also deep-link a token for quick testing:

- `index.html?token=<JWT>`

## Core flows to test

### 1) Verify auth

- Open `index.html`
- Paste token
- Click **Check**

This calls:
- `GET /api/auth/me`

### 2) Create a job posting (draft)

- Click **New job**
- Fill title (+ optional fields)
- Click **Save**

Calls:
- `POST /api/job-postings`

### 3) Publish / Pause / Close

From the jobs table, click:
- **Publish** -> `PATCH /api/job-postings/:id/publish`
- **Pause** -> `PATCH /api/job-postings/:id/pause`
- **Close** -> `PATCH /api/job-postings/:id/close`

### 4) Open Kanban for a job

- Click **Kanban** on a job row

Calls:
- `GET /api/applications/posting/:postingId?page=1&limit=200`

### 5) Drag & drop an application

- Drag a card within a column => updates `boardPosition`
- Drag a card to another column => updates `status` then `boardPosition`

Calls:
- `PATCH /api/applications/:id/status` with `{ "status": "INTERVIEW" }`
- `PATCH /api/applications/:id/position` with `{ "boardPosition": 1.5 }`

### 6) Application details

- Click any card

Calls:
- `GET /api/applications/:id`
- `GET /api/applications/:applicationId/interactions`

From the modal you can:
- Add feedback/score -> `PATCH /api/applications/:id/feedback`
- Add interaction -> `POST /api/applications/:applicationId/interactions`
- Upload doc -> `POST /api/documents/upload` (entityType=`application`)

### 7) Candidates

Open `candidates.html`.

Calls:
- `GET /api/candidates?page=1&limit=10&fullName=…&email=…`

Click **View** or **Edit**.

Calls:
- `GET /api/candidates/:id`

### 8) Documents

Open `documents.html`.

Upload calls:
- `POST /api/documents/upload` (multipart)

Lookup calls:
- `GET /api/documents/:id`

Entity listing (workaround):
- Candidate docs are loaded via `GET /api/candidates/:id` (returns `documents[]`)
- Application doc is loaded via `GET /api/applications/:id` (returns `document`)

## Notes / Known backend constraints

- There is currently **no** `GET /api/documents` list endpoint. The UI therefore supports:
  - Lookup by document ID
  - Listing docs via candidate/application details endpoints

- Document `uploadUrl` values are normalized in the frontend to match the server static prefix. The backend serves static assets at `/public`, and documents are stored under `public/uploads/docs/`.

## File structure

- `styles.css` – small custom styles (kanban ghost, scroll)
- `scripts/core.js` – API base detection, JWT storage, `fetch` wrapper
- `scripts/ui.js` – toast + loading overlay + modal helpers
- `scripts/api.js` – API wrapper functions
- `scripts/jobs.js` – jobs table + create/edit modal + Kanban open
- `scripts/kanban.js` – Kanban rendering + SortableJS integration + application details modal
- `scripts/candidates.js` – candidate list + details/edit
- `scripts/documents.js` – upload + lookup
- `scripts/apply.js` – public apply form
