# Architecture — Zeker MVP

Technical decisions, stack, and deployment model.

## Decision: GCP Cloud Stack (Free Tier First)

**Rationale:** Lean startup, pay only when/if market validates. GCP free tier covers MVP without cost.

| Service | Free Tier | MVP Fit | Cost if exceeds |
|---------|-----------|---------|-----------------|
| Firestore | 1GB read, 50k write/day | ✅ Perfect for MVP | $0.06/100k writes |
| Cloud Run | 2M req/month, 360k cpu-sec | ✅ Sufficient | $0.000025 per cpu-sec after |
| Firebase Auth | 100 users simultaneous | ✅ Covers schools | $0.005 per user after |
| Cloud KMS | 20k ops/month free | ✅ For key ops | $0.03 per 10k ops after |
| Vercel (Next.js) | Hobby plan unlimited | ✅ Frontend | $0 forever |
| Cloud Storage | 5GB free | ✅ Backups | $0.020 per GB after |

**Assumption:** Staying under these limits during MVP validation (projected: <100 daily users).

---

## Technology Stack

### Backend

```
Runtime:        Node.js 18+
Framework:      Express.js
Language:       TypeScript (optional but recommended)
Database:       Google Firestore (NoSQL)
Auth:           Firebase Auth
Encryption:     GCP KMS (server side only — see Encryption Strategy below)
Hosting:        GCP Cloud Run
Environment:    .env files (Firebase config, secrets)
```

### Frontend

```
Framework:      Next.js 14+ (App Router)
UI Library:     React 18+
Styling:        Tailwind CSS (or similar)
State:          TanStack Query (React Query) + Zustand
Forms:          React Hook Form + Zod
QR Generation:  qrcode.js (client-side)
PWA:            next-pwa (offline support)
Hosting:        Vercel
```

### Shared

```
API Communication:  REST (JSON)
Realtime:          Polling (initially), WebSocket (Phase 2)
Logging:            Google Cloud Logging
Monitoring:         Google Cloud Trace + Firestore analytics
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    User Browser                         │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Vercel (Next.js + React)                          │ │
│  │  - Admin Dashboard                                 │ │
│  │  - Responsable Portal                              │ │
│  │  - Security Validation UI                          │ │
│  │  - PWA (offline-ready)                             │ │
│  └─────────────────┬──────────────────────────────────┘ │
└────────────────────┼──────────────────────────────────────┘
                     │ HTTPS
                     ▼
        ┌────────────────────────────┐
        │  GCP Cloud Run             │
        │  (Node.js + Express)       │
        │                            │
        │  Routes:                   │
        │  - /auth (session/me/out)  │
        │  - /orgs (CRUD)            │
        │  - /locations (CRUD)       │
        │  - /interiors (CRUD)       │
        │  - /authorizations (CRUD)  │
        │  - /validate (scan check)  │
        │  - /events (logs)          │
        └──────┬─────────────────────┘
               │
     ┌─────────┼─────────┬──────────────┐
     │         │         │              │
     ▼         ▼         ▼              ▼
┌─────────┐ ┌──────┐ ┌───────┐ ┌──────────────┐
│Firestore│ │Cloud │ │Firebase│  │GCP KMS      │
│         │ │Logging│Auth    │  │(Encryption) │
│Collections:    │         │         │
│ - orgs   │     │         │         │
│ - users  │     │         │         │
│ - locations     │         │         │
│ - authorizations│         │         │
│ - accessEvents  │         │         │
└─────────┘ └──────┘ └───────┘ └──────────────┘
```

---

## Multi-Tenancy Design

**Isolation Strategy:** Database-level + Application-level

Every collection scoped by `orgId`:

```
/orgs/{orgId}
  /name: string
  /type: string
  /created_at: timestamp
  /admin_users: array
  
/users/{userId}
  /first_name, /last_name: string
  /orgs: array of { org_id, role } — the single source of membership
  (no email stored: Firebase Auth holds it and sends it verified
   with every request — see data-model.md)
  
/orgs/{orgId}/authorizations/{authId}
  /interior_id: string   — the apartment being visited (Decision 003)
  /location_id: string   — copied from the interior; it can never change
  /visitor_name: string  — the ONLY thing kept about the visitor (Decision 005)
  /purpose: string
  /created_by: userId
  /valid_from, /valid_to: ISO 8601 string, UTC (range-queried, so not a timestamp)
  /status: "active" | "revoked"   — never "expired"; that is computed from the dates
  /code: string (8 chars, random, unique in the org)
  (no phone, no identity document, and no stored QR image — the browser
   draws the QR from the code. See data-model.md and decisions/007)
  
/accessEvents/{eventId}
  /orgId: string (partition key)
  /authId: string
  /location_id: string
  /timestamp: timestamp
  /action: "entry" | "exit"
  /status: "allowed" | "denied"
  /reason: string (if denied)
  /security_personnel: userId
```

**Security Rules (Firestore):**

> ⚠️ **Superseded by Decision 004 (2026-08-25).** The per-role rules sketched
> here are **not deployed**. Clients are denied all direct access to Firestore;
> the backend, using the Admin SDK, is the only path to the data. The rules in
> force are in `firestore.rules` at the repository root.
>
> This means multi-tenant isolation is enforced **in backend code**, by
> `requireOrgMember` / `requireOrgAdmin` on every org-scoped route, and is
> covered by tests. There is no second safety net behind it.
>
> A reference design for granular per-role rules is retained in
> `data-model.md`, should browsers ever need direct access.

---

## Authentication & Authorization

### Backend → GCP Authentication (ADC)

Backend uses **Application Default Credentials (ADC)** to authenticate to GCP services:
- **Firestore:** Automatic via Firebase Admin SDK + ADC
- **Cloud KMS:** Automatic via @google-cloud/kms client + ADC
- **Cloud Logging:** Automatic via Google Cloud logging client + ADC

No manual credential management needed. ADC discovers credentials from:
- Local dev: `gcloud auth application-default login` (user credentials)
- Cloud Run: Service account attached to the instance (automatic)
- CI/CD: GCP service account (if running in GCP)

### User → Backend Authentication (Firebase)

Decided in Decision 002: **the browser signs in with Firebase directly. This
API never receives a password.**

1. User enters email + password in the browser
2. The Firebase Auth Web SDK validates them — the credentials go to Firebase,
   never to our server
3. Firebase returns an ID token; the SDK holds and refreshes it
4. The frontend calls `POST /auth/session` once, which creates the user's
   profile on first sign-in and refreshes `last_login` afterwards
5. Every API call carries `Authorization: Bearer {ID token}`
6. `requireAuth` verifies the token via the Firebase Admin SDK with
   `checkRevoked=true`, so a revoked session stops working immediately
7. `POST /auth/logout` revokes the refresh tokens server-side

There is no `/auth/signup`, `/auth/signin` or `/auth/refresh` on this API.
Password strength, reset, email verification and brute-force protection are all
Firebase's, outside our trust boundary.

### Roles (MVP)

- **Admin:** Can create org, locations, view all events, manage users, see reports
- **Responsable:** Can create authorizations, view their own history, revoke
- **Security:** Can only scan/validate, read-only access to authorizations
- **Owner:** Can delete org, change billing (not in MVP)

The role is **per organization**, stored in `users/{uid}.orgs[]` as
`{ org_id, role }`. There is no single global role: one person can administer
one organization and be a resident in another, which a global role cannot
express. This is also the only record of membership — see `data-model.md`.

---

## Encryption Strategy

### At Rest

> ❌ **Superseded and closed (Decision 005).** This plan said the frontend
> encrypts before sending. A browser cannot hold the Cloud KMS key — giving it
> one would hand the key to every user, so it could never have been built as
> written. It was closed by removing the data rather than by moving the
> encryption to the server: **the MVP stores no field that needs
> application-level encryption.**

**What is true today (2026-08-25):** nothing is application-encrypted, because
nothing that would need it is stored yet.

- **User email and phone are not stored at all.** Firebase Auth is the system of
  record for the email and sends it, verified, with every request. This removed
  the need for encryption on the account side entirely.
- **Organization address and phone are not stored.** For a residential customer,
  the building address plus an interior number plus a permit would reveal where
  a named person lives.
- Firestore encrypts everything at rest by default (Google-managed keys). That
  protects against physical media access, not against application-level access.

**Decided 2026-08-26 (Decision 005): the visitor's phone number is not
collected.** A permit stores the visitor's name and nothing else about them. The
visitor is not our user, never consented, and nothing in the MVP sends them
anything. With the user's email and phone already gone (Decision 002) and the
organization's address and phone gone (Decision 003), this was the last field
that would have needed Cloud KMS — so nothing in the MVP does.

The KMS key (`zeker-encryption-key`, 90-day rotation) stays in place, unused. It
costs nothing and will be needed if any of those three decisions is revisited.

### In Transit

- All traffic: TLS 1.3 (automatic via HTTPS)
- Firebase Auth: handles JWT encryption
- API calls: Bearer tokens with expiry

---

## Deployment

### Backend (Node + Cloud Run)

**Authentication:** Application Default Credentials (ADC)
- No service account JSON keys needed (org policy blocks creation, and it's a security best practice to avoid them)
- Local development: `gcloud auth application-default login` (one-time)
- Cloud Run: automatic via service account attached to the instance

```bash
# Local development setup (one-time)
gcloud auth application-default login
# This saves credentials to C:\Users\<User>\AppData\Roaming\gcloud\application_default_credentials.json
# All backend code automatically uses these credentials via ADC

# Cloud Run deployment
gcloud run deploy zeker-api \
  --source . \
  --region us-central1 \
  --memory 512Mi \
  --cpu 1 \
  --service-account zeker-backend@zeker-505918.iam.gserviceaccount.com \
  --set-env-vars \
    FIRESTORE_PROJECT_ID=zeker-505918,\
    KMS_LOCATION=us-central1,\
    KMS_KEY_RING=zeker-keys,\
    KMS_KEY_NAME=zeker-encryption-key

# Backend environment variables (no secrets here, ADC handles GCP auth)
FIRESTORE_PROJECT_ID=zeker-505918
KMS_LOCATION=us-central1
KMS_KEY_RING=zeker-keys
KMS_KEY_NAME=zeker-encryption-key
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=zeker-505918.firebaseapp.com
```

**Important:** The `zeker-backend` service account must have these IAM roles:
- `roles/datastore.user` — Firestore read/write
- `roles/cloudkms.cryptoKeyEncrypterDecrypter` — Cloud KMS encrypt/decrypt
- These are set up by `scripts/setup-gcp.ps1` during infrastructure initialization

### Frontend (Next.js + Vercel)

```bash
vercel deploy
# Auto-builds on git push, env vars configured in Vercel dashboard
```

### Database (Firestore)

```bash
# Initialize Firestore database
firebase init firestore

# Deploy security rules
firebase deploy --only firestore:rules

# Backup schedule
gcloud firestore backups create \
  --collection-filter location-ids \
  --retention-days 30
```

---

## API Contract (Summary)

See `api.md` for full spec.

```
POST   /auth/session          — Create/refresh profile after Firebase sign-in
GET    /auth/me               — Current profile + org memberships
POST   /auth/logout           — Revoke the session server-side
       (sign-up, sign-in and refresh happen in the browser at Firebase)

POST   /orgs                  — Create org
GET    /orgs                  — List my orgs
GET    /orgs/{id}             — Get org details
PUT    /orgs/{id}             — Update org
DELETE /orgs/{id}             — Delete org

POST   /orgs/{id}/locations   — Add location (plan limit enforced)
GET    /orgs/{id}/locations   — List locations
GET    /orgs/{id}/locations/{lid}  — Get one
PUT    /orgs/{id}/locations/{lid}  — Update
DELETE /orgs/{id}/locations/{lid}  — Delete

POST   /orgs/{id}/interiors   — Add interior (plan limit enforced)
GET    /orgs/{id}/interiors   — List interiors (?location_id= to filter)
GET    /orgs/{id}/interiors/{iid}  — Get one
PUT    /orgs/{id}/interiors/{iid}  — Update
DELETE /orgs/{id}/interiors/{iid}  — Delete

POST   /orgs/{id}/members     — Add a person, creating their account (Decision 006)
GET    /orgs/{id}/members     — List the people in this org (admins only)
DELETE /orgs/{id}/members/{uid}    — Remove the membership, not the account

POST   /orgs/{id}/authorizations    — Issue a permit
GET    /orgs/{id}/authorizations    — List permits (?interior_id= ?state=)
GET    /orgs/{id}/authorizations/{aid}  — Get one, with its code
DELETE /orgs/{id}/authorizations/{aid}  — Revoke (the record is kept)
       (there is deliberately no PUT — revoke and reissue instead,
        so the history says what actually happened. See decisions/007)

--- not built yet ---
POST   /orgs/{id}/validate    — Scan QR, validate
GET    /orgs/{id}/events      — Access events
```

Everything above `not built yet` is implemented and covered by tests. `api.md`
is the full contract; this list exists so the shape of the API is visible in
one screen.

---

## Scaling Considerations (Post-MVP)

- **Read replicas:** Firestore handles multi-region automatically
- **Caching:** CloudCDN for static assets, Redis for session (Phase 2)
- **Message queue:** Cloud Pub/Sub for notifications (Phase 2)
- **Analytics:** BigQuery export of Firestore (Phase 2)
- **Alerting:** Cloud Monitoring for uptime/latency

---

## Monitoring & Observability

- **Logs:** Google Cloud Logging (all backend requests auto-logged)
- **Traces:** Google Cloud Trace (latency analysis)
- **Metrics:** Firestore metrics dashboard (reads/writes/errors)
- **Errors:** Sentry (optional, Phase 1.5)
- **Uptime:** Cloud Monitoring alerts on Cloud Run availability

---

**Owner:** Software Architect
**Last updated:** 2026-08-25
**Decisions recorded in:** `decisions/` — see `001-freemium-gcp-stack.md` (stack & pricing), `002-client-side-firebase-auth.md` (sign-in), `003-interiors-and-plan-quotas.md` (interiors & limits), `004-backend-only-firestore-access.md` (database access)
