# Scribble — AI Clinical Note Management

A web application for home healthcare clinicians to create, transcribe, and manage AI-enhanced visit notes linked to patient records.

---

## Features

- **AI note enhancement** — write or dictate a visit note and get a structured clinical summary using context-aware field labels (Complaint, Vital Signs, Medications, Plan, and more)
- **Audio transcription** — record directly in the browser or upload a file; transcribed via OpenAI Whisper
- **Clinical templates** — four pre-filled templates (general visit, wound assessment, medication review, vital signs monitoring) to jumpstart documentation
- **In-app note viewer** — click any note to view, edit, re-enhance, or delete it in a modal without leaving the current page
- **Patient management** — create and manage patient records; every note is linked to a patient
- **Dashboard** — practice-wide stats (total patients, notes today, notes this week) and a feed of recent activity
- **Quick actions** — floating button to create a note or patient from any page
- **Docker** — fully containerized with Docker Compose; single command to run the full stack locally
- **CI pipeline** — GitHub Actions runs all integration tests and a production build on every push to `main`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite 5, Tailwind CSS v4, shadcn/ui, React Router v6 |
| Backend | Node.js 20, TypeScript, Express, Zod |
| Database | PostgreSQL 16, Prisma ORM |
| AI | OpenAI Whisper (`whisper-1`) for transcription, GPT-4o-mini for note enhancement |
| Audio storage | Local disk (dev) · AWS S3 / Cloudflare R2 (production) |
| Auth | JWT · bcryptjs |
| Testing | Vitest · Supertest (32 server integration tests) |
| CI | GitHub Actions (tests + lint/build on every push) |
| Containers | Docker · Docker Compose |

---

## Setup

### Prerequisites

- Docker and Docker Compose
- An OpenAI API key with access to `whisper-1` and `gpt-4o-mini`

### 1. Clone and configure

```bash
git clone <repo-url>
cd lime
cp .env.example .env
```

Set your OpenAI key in `.env`:

```env
OPENAI_API_KEY=sk-...
```

### 2. Start (first run)

Pass `SEED=on` the first time to populate the database with demo patients and an admin account:

```bash
SEED=on docker compose up -d --build
```

Seeding is idempotent. Subsequent runs:

```bash
docker compose up -d
```

### 3. Open the app

| Service | URL |
|---|---|
| Web UI | http://localhost:8080 |
| API | http://localhost:4000 |

Default credentials:

```
Email:    admin@scribe.local
Password: admin123
```

### Development (hot-reload)

```bash
SEED=on docker compose --profile dev up -d --build
```

Starts a Vite dev server at http://localhost:5173 with HMR and API proxy.

---

## Optional: S3 Audio Storage

Audio files are stored on local disk by default. To use S3:

```env
S3_BUCKET=my-scribble-audio
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

For a local S3-compatible service (e.g. LocalStack), also set `S3_ENDPOINT=http://localhost:4566`.

---

## Notes & Assumptions

- **Single user** — one hardcoded admin account. No registration or multi-user support.
- **Synchronous AI** — transcription and enhancement run inline during the request. A production system should use a background job queue.
- **No audio playback** — audio is stored for transcription only; the UI does not play it back.
- **Notes are paginated** — 10 per page. The patient list is not paginated (full list loaded sorted by last name — fine at demo scale).
- **25 MB audio limit** — matches the OpenAI Whisper API constraint.
- **JWT in localStorage** — sufficient for a demo; production should use `HttpOnly` cookies.
