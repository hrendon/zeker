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
Encryption:     crypto-js (client) + GCP KMS (server secrets)
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
        │  - /auth (signin/signup)   │
        │  - /orgs (CRUD)            │
        │  - /locations (CRUD)       │
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
  /email: string (encrypted)
  /orgs: array of orgId (maps user to orgs they admin)
  
/authorizations/{authId}
  /orgId: string (partition key)
  /locationId: string
  /authorized_person_name: string
  /authorized_person_phone: string (encrypted)
  /created_by: userId
  /valid_from: timestamp
  /valid_to: timestamp
  /status: "active" | "revoked"
  /qr_code: string (base64)
  /numeric_code: string (8-char)
  
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

```
match /db/{document=**} {
  allow read, write: if request.auth != null
    && request.auth.uid in resource.data.viewers;
  
  match /orgs/{orgId} {
    allow read: if request.auth.uid in resource.data.admin_users;
    allow write: if request.auth.uid in resource.data.admin_users;
    
    match /locations/{locationId} {
      allow read, write: if request.auth.uid in get(/databases/$(database)/documents/orgs/$(orgId)).data.admin_users;
    }
    
    match /authorizations/{authId} {
      allow read: if request.auth.uid in get(/databases/$(database)/documents/orgs/$(orgId)).data.admin_users;
      allow create, update, delete: if request.auth.uid == resource.data.created_by;
    }
    
    match /accessEvents/{eventId} {
      allow read: if request.auth.uid in get(/databases/$(database)/documents/orgs/$(orgId)).data.admin_users;
      allow create: if request.auth != null; // Security can log, anyone can read events
    }
  }
}
```

**User can be admin of multiple orgs:**

```javascript
// Frontend: fetch user's orgs
const userDoc = await firestore.collection('users').doc(userId).get();
const orgIds = userDoc.data().orgs; // ["org1", "org2", "org3"]

// Switch org: all subsequent queries scoped to selected orgId
const selectedOrgId = "org2";
```

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

1. User enters email + password on frontend
2. Firebase Auth validates via client SDK
3. JWT token returned, stored in localStorage
4. Subsequent API calls: `Authorization: Bearer {token}`
5. Backend verifies token via Firebase Admin SDK (authenticated via ADC)

### Roles (MVP)

- **Admin:** Can create org, locations, view all events, manage users, see reports
- **Responsable:** Can create authorizations, view their own history, revoke
- **Security:** Can only scan/validate, read-only access to authorizations
- **Owner:** Can delete org, change billing (not in MVP)

Role stored in Firestore user doc or Firebase custom claims.

---

## Encryption Strategy

### At Rest

```
Sensitive fields (in Firestore):
- authorized_person_phone: AES-256 via GCP KMS
- user_email: Firestore native encryption (default)

Implementation:
- Frontend: encrypt before sending to backend
- Backend: decrypt when needed, re-encrypt on store
- Keys: stored in GCP Secret Manager, rotated quarterly
```

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
POST   /auth/signup           — Create user
POST   /auth/signin           — Login
POST   /auth/refresh          — Refresh token
DELETE /auth/logout           — Logout

POST   /orgs                  — Create org
GET    /orgs                  — List my orgs
GET    /orgs/{id}             — Get org details
PUT    /orgs/{id}             — Update org
DELETE /orgs/{id}             — Delete org

POST   /orgs/{id}/locations   — Add location
GET    /orgs/{id}/locations   — List locations
PUT    /orgs/{id}/locations/{lid}  — Update
DELETE /orgs/{id}/locations/{lid}  — Delete

POST   /orgs/{id}/authorizations    — Create auth
GET    /orgs/{id}/authorizations    — List auths
PUT    /orgs/{id}/authorizations/{aid}  — Update
DELETE /orgs/{id}/authorizations/{aid}  — Revoke

POST   /orgs/{id}/validate    — Scan QR, validate
GET    /orgs/{id}/events      — Access events
```

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
**Last updated:** 2026-08-18
**Decisions recorded in:** `decisions/` — see `001-freemium-gcp-stack.md` (stack & pricing), `002-client-side-firebase-auth.md` (sign-in), `003-interiors-and-plan-quotas.md` (interiors & limits), `004-backend-only-firestore-access.md` (database access)
