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

* **requireOrgMember / requireOrgAdmin** (`src/middleware/orgAccess.ts`) —
  proves the caller belongs to the organization named in the URL. Since
  Decision 004 closed direct database access, **this is the only thing keeping
  one customer's data away from another's.** A non-member gets 404, not 403, so
  a stranger cannot discover which organizations exist.

### Adding an endpoint

1. Create a router in `backend/src/routes/`. Nest org-scoped routers under
   `orgsRouter` with `Router({ mergeParams: true })`.
2. Mount it in `backend/src/routes/index.ts` (or under `orgs.ts` if nested).
3. Put `requireAuth` on any route that is not public.
4. **On anything org-scoped, also put `requireOrgMember` or `requireOrgAdmin`.**
   Forgetting it is not a small bug — it exposes every customer's data to every
   other customer. There is no second safety net.
5. Throw the helpers from `src/lib/errors.ts` (`notFound()`, `forbidden()`, …)
   instead of writing status codes by hand — that is what keeps every error
   response identical.
6. For anything the plan limits, create it through `createCounted()` in
   `src/lib/quota.ts` rather than writing the document directly, so the check
   and the write stay in one transaction.
7. Add tests next to the code as `*.test.ts`, **including a test that another
   organization's member gets 404.**

---

## Testing

Vitest plus supertest. Tests live beside the code they cover
(`src/**/*.test.ts`) and are excluded from the build, along with the shared
helpers in `src/test/`.

Tests never contact Google Cloud: `src/lib/firebase.js` is replaced with a
double. That keeps the suite fast, free, and runnable with no credentials.

`src/test/fakeFirestore.ts` is an in-memory stand-in for Firestore covering
documents, subcollections, equality queries, batches, transactions, and the
`increment` / `arrayUnion` / `serverTimestamp` field values. Use it rather than
hand-rolling a mock per test file. It keys documents by their full path
(`orgs/org_a/interiors/int_1`), so `store.seed(path, data)` sets up state and
`store.docs.get(path)` checks the result. `store.writes` is every write made,
which is how a test proves that a refused request wrote nothing.

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

## Database rules

The rules in force are `firestore.rules` at the repository root, tracked in git.
They deny clients all access to Firestore (Decision 004) — the backend is the
only path to the data.

```bash
firebase deploy --only firestore:rules --project zeker-505918
```

`scripts/setup-firestore-rules.*` deploy that same tracked file. Note that
`gcloud firestore databases update` has **no** `--rules` option, despite what
the original setup script assumed; use the Firebase CLI.

---

## Frontend

Not scaffolded yet — `frontend/` holds only environment files. When that work
starts:

* Sign-up, sign-in, password reset and token refresh use the Firebase Auth Web
  SDK directly. This API has no such endpoints (Decision 002).
* The frontend cannot use the Firestore Web SDK for data — it talks only to
  this API.
* After a successful Firebase sign-in, call `POST /auth/session` once, then
  `GET /auth/me` to learn which organizations the person belongs to.
* Error responses carry a machine-readable `error` code. The Spanish wording
  the customer reads belongs in the interface, not in the API.

---

**Owner:** Backend Developer / Full-Stack Developer
**Last updated:** 2026-08-25
**Related:** `architecture.md`, `api.md`, `../security/data-minimization.md`
