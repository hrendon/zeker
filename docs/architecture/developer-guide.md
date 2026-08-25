# Developer Guide — Zeker

How to run, test, and deploy the code. Companion to `architecture.md` (which
explains *why* the system is shaped this way) and `api.md` (the endpoint contract).

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 20 or newer | Verified on 25.x |
| npm | 10 or newer | Ships with Node |
| gcloud CLI | latest | Needed once, for credentials |

---

## One-time setup

The backend authenticates to Google Cloud with **Application Default
Credentials (ADC)**. There is no service account key file to download or
store — see `architecture.md`, "Backend → GCP Authentication".

```bash
gcloud auth application-default login
```

This writes credentials to your user profile. Every Google client library in
the backend picks them up automatically.

---

## Backend

Location: `backend/`

```bash
cd backend
npm install
cp .env.example .env      # then adjust if needed
npm run dev               # http://localhost:3001
```

### Scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Start with reload on file change |
| `npm run build` | Compile TypeScript into `dist/` |
| `npm start` | Run the compiled build (what the container runs) |
| `npm run typecheck` | Type errors only, no output files |
| `npm test` | Run the test suite once |
| `npm run test:watch` | Re-run tests as files change |

### Environment variables

Read from `backend/.env`, falling back to a `.env` at the repository root.
On Cloud Run there is no file — the platform supplies the values.

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `NODE_ENV` | no | `development` | `development` \| `test` \| `production` |
| `PORT` | no | `3001` | Cloud Run overrides this |
| `LOG_LEVEL` | no | `info` | `debug` locally, `info` in production |
| `GCP_PROJECT_ID` | in production | — | GCP project (`zeker-505918`) |
| `CORS_ORIGINS` | no | `http://localhost:3000` | Comma-separated browser origins allowed to call the API |

The app refuses to start if the configuration is invalid, and says which
variable is wrong. It never starts with a half-valid configuration.

### Checking it works

```bash
curl http://localhost:3001/health         # process is up
curl http://localhost:3001/health/ready   # can actually reach Firestore
```

`/health/ready` is the fastest way to confirm your Google Cloud credentials
are working. A `503` there almost always means `gcloud auth
application-default login` has not been run, or has expired.

---

## How a request flows

```text
request id  →  security headers  →  CORS  →  JSON body  →  logging
            →  rate limit  →  route  →  [ requireAuth ]  →  handler
            →  404 handler  →  error handler  →  response
```

* **Request id** — every response carries `X-Request-Id`, and every error body
  repeats it as `request_id`. A caller reporting a problem gives you that id and
  it matches a log line exactly.
* **requireAuth** — verifies the Firebase ID token sent as
  `Authorization: Bearer <token>`. The password never reaches this server.
  Revoked sessions are rejected immediately, not when the token expires.
* **Error handler** — the only place a failure response is written. The shape is
  fixed by `api.md`: `{ error, message, request_id }`. Unexpected errors are
  logged in full and reported to the caller as a plain 500 — internal details
  never leave the server in production.

### Adding an endpoint

1. Create a router in `backend/src/routes/`.
2. Mount it in `backend/src/routes/index.ts`.
3. Put `requireAuth` on any route that is not public.
4. Throw the helpers from `src/lib/errors.ts` (`notFound()`, `forbidden()`, …)
   instead of writing status codes by hand — that is what keeps every error
   response identical.
5. Add tests next to the code as `*.test.ts`.

---

## Testing

Vitest plus supertest. Tests live beside the code they cover
(`src/**/*.test.ts`) and are excluded from the build.

Tests never contact Google Cloud: `src/lib/firebase.js` is replaced with a
double. That keeps the suite fast, free, and runnable with no credentials.

---

## Deployment (Cloud Run)

`backend/Dockerfile` builds in two stages, so the shipped image has no compiler
and no source — production dependencies and compiled output only. It runs as
the non-root `node` user.

```bash
cd backend
gcloud run deploy zeker-api \
  --source . \
  --region us-central1 \
  --service-account zeker-backend@zeker-505918.iam.gserviceaccount.com \
  --set-env-vars NODE_ENV=production,GCP_PROJECT_ID=zeker-505918
```

Cloud Run sets `PORT` itself. No credentials are passed: the attached service
account provides them.

Logs are written as JSON to stdout with a `severity` field, which is what
Google Cloud Logging expects, so levels and messages display correctly.

---

## Frontend

Not scaffolded yet. This section will be filled in when that work starts.

---

**Owner:** Backend Developer / Full-Stack Developer
**Last updated:** 2026-08-21
**Related:** `architecture.md`, `api.md`, `../security/data-minimization.md`
