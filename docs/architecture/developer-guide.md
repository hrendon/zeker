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
8. **If the query combines filters, add its index to `firestore.indexes.json`
   and deploy it.** Firestore needs a composite index for anything beyond plain
   equality — an equality filter plus a range (`where('valid_to','>',now)`) is
   the common case — and without it the query does not run at all. The
   in-memory test double answers such a query happily, so a green test suite is
   no evidence: see "Database rules and indexes" below.

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

## Watching the business

```bash
cd backend && npm run report
```

One page: how many customers, which segment, how many permits, how many checks
at a door, why people were turned away, and who has outgrown the free plan.

**It is an operator tool, not part of the product**, and that is deliberate. It
reads every customer's data, which is precisely what the API is built never to
allow — since Decision 004 the backend is the only thing keeping one customer
out of another's records, and a route that could read across customers would put
a hole in the single wall the whole product rests on.

So it reads Firestore directly, as whoever runs it, through Application Default
Credentials. Access is governed by Google IAM: remove someone's project access
and the report stops working, with nothing to revoke inside Zeker and no
privileged account that could be stolen. It counts, and never prints a visitor's
name, a resident's name or a permit code.

Speed, error rate, cost and the audit trail are not in the database; the report
ends with the Google Cloud links that hold them.

---

## Database rules and indexes

The rules in force are `firestore.rules` at the repository root, tracked in git.
They deny clients all access to Firestore (Decision 004) — the backend is the
only path to the data.

```bash
firebase deploy --only firestore:rules --project zeker-505918
```

`scripts/setup-firestore-rules.*` deploy that same tracked file. Note that
`gcloud firestore databases update` has **no** `--rules` option, despite what
the original setup script assumed; use the Firebase CLI.

### Indexes

`firestore.indexes.json`, also at the root and also tracked, holds every
composite index the code needs.

```bash
firebase deploy --only firestore:indexes --project zeker-505918
firebase firestore:indexes --pretty     # CREATING or READY?
```

**Declaring an index is not deploying it, and the tests cannot tell you the
difference.** The in-memory test double in `backend/src/test/fakeFirestore.ts`
answers any query it understands, including ones real Firestore refuses. On
2026-08-29 the whole suite passed while deleting an apartment failed with
`FAILED_PRECONDITION: The query requires an index` — found only by using the
product against the live database.

Two things follow:

* deploy indexes in the same change that adds the query;
* a new index takes a few minutes to build. Until
  `firebase firestore:indexes --pretty` stops saying `CREATING`, the query
  still fails.

### The same trap, one level up: retention policies

A Firestore **TTL policy** is configured per collection group in Google Cloud,
not in any file in this repository. Writing an `expires_at` field on every
document does not switch it on, and nothing in the tests or the code will tell
you it is off — the documents simply accumulate for ever.

```bash
gcloud firestore fields ttls update expires_at   --collection-group=access_events --project zeker-505918 --enable-ttl
gcloud firestore fields list --collection-group=access_events   # is it ENABLED?
```

⚠️ **`access_events` carries `expires_at` since 2026-08-30, and its policy is
not enabled yet.** Until it is, no check is ever deleted, which contradicts the
90/30-day retention this product promises in
`../security/data-minimization.md`.

---

## Frontend

Next.js (App Router) in `frontend/`. Runs on port 3000 and talks only to the
Zeker API on port 3001.

### Scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Development server on http://localhost:3000 |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript, no output |
| `npm test` | Unit tests (vitest) |

### Environment variables

Copy `frontend/.env.local.example` to `frontend/.env.local`. Every value is
`NEXT_PUBLIC_*` and therefore visible in the browser — that is correct. Firebase
client configuration identifies the project; it does not grant access to it.
Access is decided by Firebase Auth and by `firestore.rules`, which deny browsers
entirely (Decision 004).

`NEXT_PUBLIC_API_URL` must match a value in the backend's `CORS_ORIGINS`, or the
browser will block every call.

### Running both halves

```bash
cd backend  && npm run dev   # port 3001
cd frontend && npm run dev   # port 3000
```

**If the API answers strangely, check that it is actually ours.** On 2026-08-27
a WSL port forwarder (`wslrelay.exe`) was also listening on 3001 and intercepted
requests: `GET /health` returned a plausible `{"status":"ok"}` while
`/health/ready` returned an HTML 404. Two signs it is not the Zeker backend:

* it sets an `X-Powered-By: Express` header — ours removes that header
* a missing route returns an HTML page — ours returns JSON with a `request_id`

To work around it, run both halves on a different port:

```bash
cd backend  && PORT=3002 CORS_ORIGINS=http://localhost:3000 npm run dev
cd frontend && NEXT_PUBLIC_API_URL=http://localhost:3002 npm run dev
```

Environment variables set this way take precedence over `.env.local`, so nothing
needs editing. To see what holds a port on Windows:
`Get-NetTCPConnection -LocalPort 3001 -State Listen`.

### How the frontend is laid out

```
app/                          One folder per screen. URLs are in Spanish.
  entrar/                     Sign in
  crear-cuenta/               Create account
  recuperar/                  Password reset
  inicio/                     Your organizations. Also the switcher.
  organizaciones/
    nueva/                    Create an organization
    [orgId]/sedes/            Sites: list, add, rename, retire, delete
    [orgId]/interiores/       Interiors, with the person in charge
components/
  AuthProvider.tsx            Holds "who is signed in" for the whole app
  OrgShell.tsx                Everything the org-scoped screens share
  ui.tsx                      AuthCard, Field, SubmitButton, Notice, TextLink,
                              UsageMeter, ConfirmDialog, ListRow
lib/
  firebase.ts                 Firebase client setup
  api.ts                      The only place that calls the Zeker API
  errors.ts                   Error code -> Spanish
  strings.ts                  Every word the user reads
  validate.ts                 Form checks
```

### Adding an organization-scoped screen

Wrap it in `OrgGate` (`components/OrgShell.tsx`) and read the id with
`useOrgId()`. `OrgGate` does three things you must not reimplement:

1. **Waits for the sign-in session to be restored before asking the API.**
   Firebase restores it asynchronously, so a page opened directly has no token
   for a moment. Fetching in that gap gets a 401 and tells the person their
   session ended when it did not.
2. **Clears the previous organization before loading the next.** Never render
   data from the organization you just left.
3. **Turns the API's 404 into "not found or no access"** without saying which.
   The API answers the same way whether an organization does not exist or the
   caller is not a member — so nobody can discover which customers exist by
   guessing. Do not undo that in the interface.

### Rules that must not be broken

* **Sign-up, sign-in, password reset and token refresh use the Firebase Auth Web
  SDK directly.** This API has no such endpoints (Decision 002).
* **The frontend never uses the Firestore Web SDK for data.** It talks only to
  this API. Browsers are denied all database access (Decision 004).
* **All API calls go through `lib/api.ts`.** It attaches the Firebase ID token,
  read fresh from the SDK each time. Never store a token yourself.
* **No user-facing text lives in a component.** It goes in `lib/strings.ts`, so
  adding a second language later is one file, not a search of the whole app.
* **No English ever reaches the screen.** The API returns an `error` code plus
  an English `message` meant for developers. `lib/errors.ts` maps the code to
  Spanish; the English message is for logs and bug reports only.
* **Sign-in and password reset never reveal whether an account exists.** Both
  give the same answer either way. Different answers would let anyone check who
  is a customer.
* **Signing out calls the server first.** If `POST /auth/logout` fails, the
  session is still alive and the user is told so — clearing only the browser
  copy would hide a live session on a shared computer.

### Reading a refusal correctly

Two different refusals both come back as **403**. Branch on the error `code`,
never the status:

| Code | Means | What the person should see |
|------|-------|----------------------------|
| `quota_exceeded` | Out of room on the plan | Upgrade to add more |
| `forbidden` | Not an administrator | You cannot do this |
| `conflict` (409) | Something still depends on it | What to remove first |

A `conflict` is not self-explaining — the API says why in English, which never
reaches the screen. The screen knows its own context, so it supplies the Spanish
message: deleting a site names its apartments and permits, adding an interior
names the duplicate number.

### After adding a screen

Run `npm run typecheck`, `npm test` and `npm run build`, and check the screen on
a narrow window — security staff use this on a phone.

---

**Owner:** Backend Developer / Full-Stack Developer
**Last updated:** 2026-08-27
**Related:** `architecture.md`, `api.md`, `../security/data-minimization.md`
