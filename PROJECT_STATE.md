# Project State — Zeker

Single source of truth for current progress. Updated at every checkpoint.

**Last updated:** 2026-08-25
**Last verified:** 2026-08-25 — full audit at session close. Backend typecheck clean, 102/102 tests pass, production build clean, live Firestore reachable, deny-all rules deployed and confirmed live, every route answered on a running server, documents checked against the code and corrected.

---

## Current Milestone

**MVP — Access Management for Physical Spaces**

---

## Current Status

🟢 **Infrastructure Complete — Ready for MVP Build** (Camino B: Build first, validate after)

```
Completed:       Setup half of the product is done on the server:
                 sign-in, organizations, locations, interiors + limits
                 (102 tests pass)
In Progress:     Week 1 — Backend feature endpoints
Blocked:         0 to continue · 1 decision waiting on Founder (D-005)
Critical Risk:   None open — the open-database risk was closed on 2026-08-25
Next:            Entry permits (QR), then validating a scan at the door
```

**Latest Update (2026-08-25):** Three blocking decisions answered by the Founder
and recorded. Database access closed.
- ✅ D-002 approved → sign-in happens in the browser with Firebase; our server
  never handles a password. Recorded as Decision 002.
- ✅ D-003 approved → "interiors" become a real level under a location, and plan
  limits move onto the organization. Recorded as Decision 003.
- ✅ D-004 approved and **already built and deployed** → browsers can no longer
  reach the database at all. Recorded as Decision 004.
- ✅ Verified after the change: the backend still reads the live database
  (`/health/ready` → 200), typecheck clean, 12/12 tests pass.
- ⚠️ Found while doing it: the original setup script could never have worked —
  it called a `gcloud` command that has no rules option. The rules are now a
  real file in the repository, deployed with the Firebase CLI.

**Session closed 2026-08-25.** Five units built, six commits, three decisions
recorded and one raised. Documents were audited against the code at close and
corrected — see "Documentation corrected" below.

**Documentation corrected at session close (2026-08-25).** The technical
documents had drifted from what was actually built. Fixed rather than noted:
- `architecture.md` still described sign-in with a password reaching our server,
  browser-side encryption that cannot work, per-role database rules that are not
  deployed, and an endpoint list missing half the product. All corrected, with
  the superseded parts marked as superseded rather than deleted.
- `context-index.md` pointed at four documents that do not exist. They are now
  marked missing, with a note of when each is actually needed.
- `developer-guide.md` now states the isolation rule as a build step, so the
  next person cannot add an endpoint that skips it by accident.
- `role-registry.md` still listed decisions as pending that you approved a week
  ago, plus today's three.

**Interiors built (2026-08-25). The setup half of the product is now complete
on the server, and the offer you approved is buildable and built.**
- Add an apartment, warehouse bay or zone inside a site, each with its number
  and the person in charge. List them, rename, reassign, remove.
- **The 10-interior free limit works, counted the way you specified** — across
  everything the customer has, not per site. The eleventh is refused with a
  message the screens can show in Spanish, and nothing is saved.
- Two people cannot both claim apartment 302 in the same building, even if they
  press save at the exact same moment. The same number is still allowed in a
  different building.
- An interior can be linked to a resident's account, which is what will let
  that resident issue entry permits for their own apartment. The person must
  already belong to the organization.
- An interior cannot be quietly moved to another building — that would drag its
  existing permits along with it.
- Deleting is refused while a permit for it is still active, and frees the slot
  when it succeeds.
- Every create, change and delete is written to the audit trail, as security
  required.
- Five more tests prove another customer cannot see or touch any of it.
- Verified: 102/102 tests pass, typecheck clean, production build clean, all
  five routes answer on a live server.

**Locations built (2026-08-25).** The first half of what you actually sell now
works, limits included.
- Add a site, list them, rename one, take one out of use, delete one.
- **The plan limit is enforced properly.** The free plan allows 1 location. The
  check and the save happen together in one operation, so two requests arriving
  at the same instant cannot both take the last free place. Refusal returns its
  own message type, so the screens can show your Spanish wording rather than a
  generic "not allowed".
- Deleting frees the slot again. Taking a site out of use keeps it and its
  history, and keeps using its slot — those are two different actions on
  purpose.
- Deleting is refused while the site still has interiors or an active permit.
- Security staff can see the list of sites (they need it to check entries), but
  only administrators can change anything.
- Five more tests prove another customer cannot see, create, change or delete
  anything here.
- ⚠️ Found and fixed while building: test-only code was being copied into the
  package we deploy to production, and it referred to a tool that is not
  installed there. Now excluded from the build.
- Verified: 73/73 tests pass, typecheck clean, production build clean, all five
  routes answer correctly on a live server.

**Organizations built (2026-08-25).** Customers are now separate from each
other, and that separation is proven by tests.
- Create an organization, list the ones you belong to, view one, change its
  details, delete it. Creating one makes you its administrator automatically.
- **Six tests prove one customer cannot reach another's data** — cannot read
  it, cannot change it, cannot delete it. This was the mandatory test before
  launch. It now exists and runs on every change.
- Someone who is not a member is told the organization does not exist, rather
  than that they lack permission. Otherwise a stranger could discover which
  customers we have simply by guessing.
- A customer cannot raise their own plan limits — the request is refused.
- Deleting is reversible bookkeeping, not erasure: entry records are an audit
  trail we are required to keep. Deletion is also refused while any permit is
  still active, so an organization cannot vanish out from under a permit that
  would still open a door.
- We store less again: no street address and no organization phone number. For
  a residential building, the address plus an apartment number plus a permit
  would reveal exactly where a named person lives. City and country are enough.
- ⚠️ Found while building: someone could create unlimited free organizations,
  each with its own free allowance. Raised as D-005 — your call, not mine.
- Verified: 49/49 tests pass, typecheck clean, all five routes answer correctly
  on a live server.

**Sign-in endpoints built (2026-08-25).** The account side of the product now
works end to end on the server.
- `POST /auth/session` — called once after the browser signs in. Creates the
  person's profile the first time, refreshes it after. Safe to call repeatedly.
- `GET /auth/me` — who am I, and which organizations do I belong to. This is
  what decides whether the app shows the admin, responsable or security screens.
- `POST /auth/logout` — ends the session on the server, so a stolen session
  cannot be resumed.
- We store **less personal data than the original design asked for**: no email
  address and no phone number in our database. Firebase already holds the email
  and sends it with every request. This also sidesteps the unresolved
  encryption problem, and a test now proves the email is never written.
- Verified: 27/27 tests pass, typecheck clean, and the three routes answered
  correctly on a live server (a fake token is rejected by real Firebase).
- Correction: the plan said these routes would get a strict 5-per-minute limit.
  They did not, on purpose — several staff of one customer share one office
  internet address and would have locked each other out each morning. There is
  no password to guess on this API any more, so the strict limit had no job.

**Previous Update (2026-08-21):** Backend skeleton built and verified.
- ✅ Express + TypeScript app running, compiles clean, 12 tests passing
- ✅ Firestore reached live through ADC (`/health/ready` returns 200)
- ✅ Firebase token verification, uniform error shape, rate limits, request tracing
- ✅ Cloud Run container definition ready (non-root, no source in image)
- ✅ Security fix: service-account key filenames can no longer be committed
- ⚠️ Three design contradictions found — raised as D-002, D-003, D-004

**Previous Update (2026-08-19):** Multi-role dispatch validation completed.
- ✅ Backend Developer: Ready to scaffold (48-hour launch plan)
- ✅ Frontend Developer: Ready to scaffold (component library outlined)
- ✅ Architect: Infrastructure 6/6 complete (rules update flagged Week 2)
- ✅ Product Owner: Prioritization clear (Backend first, 7 critical stories)
- ✅ Security Engineer: ADC approach confirmed secure

---

## Completed

✅ **Product Definition**
- Problem statement: Control access to physical spaces (Locations) via entry authorization
- Organization type (MVP): Locations only (schools with pick-up auth deferred to Phase 2)
- Users identified: Admin, Authorizer, Security personnel
- MVP scope: Locations + Interiors management, entry authorizations (QR), validation, trazabilidad
- Free tier limit: 1 location, 10 interiors max
- Out of scope (MVP): Schools/pick-up auth, recurrence, complex rules, hardware, mobile native

✅ **Architecture & Technology**
- Stack decided: GCP Cloud (Firestore, Cloud Run, Firebase Auth, Vercel)
- Multi-tenancy design: org-level isolation, one admin → multiple orgs
- Encryption strategy: AES-256 at rest, TLS in transit
- PWA: Yes (for offline read capability)

✅ **Security & Compliance**
- Data minimization rules written
- Never store: IDs, photos, biometrics, addresses
- Encrypt: Emails, phone numbers
- Retention: 90 days events, 1 year auth records
- Compliance target: Ley 1581/2016 (Colombia)

✅ **Backend Skeleton** (2026-08-21)
- Express 5 + TypeScript app, strict compile, ESM build to `backend/dist/`
- Configuration validated at startup — the app refuses to run half-configured
- Firebase Admin SDK wired through Application Default Credentials (no key file)
- `requireAuth`: verifies Firebase ID tokens, rejects revoked sessions immediately
- Single error handler producing the documented `{ error, message, request_id }` shape
- Request tracing (`X-Request-Id`), structured logs shaped for Google Cloud Logging
- Rate limits per `api.md` (5/min auth, 100/min validate, 60/min general)
- `GET /health` and `GET /health/ready` (real Firestore round trip)
- Dockerfile for Cloud Run: two-stage, non-root, no compiler or source in the image
- Verified: `npm run typecheck` clean · `npm test` 12/12 pass · live 200 from Firestore

✅ **Interiors + plan quotas** (2026-08-25)
- `POST/GET /orgs/{orgId}/interiors`, `GET/PUT/DELETE .../{interiorId}`
- 10-interior limit counted org-wide, not per location, enforced in a transaction
- Number unique per location, checked in the same transaction
- Optional link to a resident's account (must be a member) for US-003
- `location_id` immutable; delete refused while a permit is active; delete frees the slot
- Audit trail entry on every create, change and delete
- Verified: 102/102 tests pass · typecheck clean · production build clean

✅ **Locations** (2026-08-25)
- `POST/GET /orgs/{orgId}/locations`, `GET/PUT/DELETE .../{locationId}`
- Plan limit enforced inside a transaction; refusal is `quota_exceeded` (403)
- Delete frees the slot; `enabled: false` retires a location without freeing it
- Delete refused while interiors or active authorizations still reference it
- Any member can list; only admins can create, change or delete
- No staff name, floor or building stored
- Verified: 73/73 tests pass · typecheck clean · production build clean

✅ **Organizations** (2026-08-25)
- `POST /orgs`, `GET /orgs`, `GET/PUT/DELETE /orgs/{orgId}`
- Membership check on every org-scoped route; non-members get 404, not 403
- Six tests prove one customer cannot reach another's data
- Plan limits attached at creation (free = 1 location, 10 interiors)
- Customers cannot change their own plan, limits or usage counters
- Soft delete, refused while any authorization is still active
- No street address and no organization phone stored
- Verified: 49/49 tests pass · typecheck clean · live routes answer correctly

✅ **Sign-in endpoints** (2026-08-25)
- `POST /auth/session`, `GET /auth/me`, `POST /auth/logout` (Decision 002)
- The API never accepts a password; sign-in happens in the browser at Firebase
- User profile stores no email and no phone — Firebase holds the email, and it
  arrives verified with every request
- Role is per organization, not global (one person can run several orgs)
- Verified: 27/27 tests pass · typecheck clean · live routes answer correctly

✅ **Documentation**
- `docs/architecture/developer-guide.md` — how to run, test, and deploy
- `docs/product/brief.md` — what we build
- `docs/product/requirements.md` — 10 user stories
- `docs/architecture/architecture.md` — full technical spec
- `docs/architecture/data-model.md` — Firestore schema
- `docs/security/data-minimization.md` — security policy
- `docs/decisions/001-freemium-gcp-stack.md` — why GCP
- `docs/decisions/002-client-side-firebase-auth.md` — how users sign in
- `docs/decisions/003-interiors-and-plan-quotas.md` — interiors and plan limits
- `docs/decisions/004-backend-only-firestore-access.md` — who can reach the database
- `firestore.rules` — the database rules actually deployed
- `docs/roles/role-registry.md` — who owns what

---

## In Progress

🔨 **Week 1-2: MVP Development**

**Backend (Days 1-7):**
- [x] Express app scaffolded + TypeScript configured
- [x] Firebase Admin SDK + Firestore client initialized
- [x] Request pipeline: auth middleware, error contract, rate limits, tracing
- [x] Health + readiness endpoints, Cloud Run container definition
- [x] Firestore rules in the repository, clients denied, deployed (Decision 004)
- [x] Auth endpoints — `POST /auth/session`, `GET /auth/me`, `POST /auth/logout` (Decision 002)
- [x] Org endpoints + multi-org support + membership check + 6 isolation tests
- [x] Location endpoints + plan limit enforced in a transaction (Decision 003)
- [x] Interior endpoints + global 10-interior quota enforced in a transaction (403)
- [ ] Authorization creation + QR/numeric code generation
- [ ] Validation endpoint (scan QR, check validity, log event)
- [ ] Unit + integration tests for all critical flows
- [ ] Cloud Run deployment pipeline ready

**Frontend (Days 1-3 scaffold, 5-14 build):**
- [ ] Next.js 14 + React 18 scaffolded
- [ ] Firebase Auth SDK configured
- [ ] Zustand state management (auth, org, ui stores)
- [ ] Signup/signin pages connected to backend
- [ ] Admin dashboard: org switcher, location CRUD
- [ ] Responsable experience: create auth, display QR
- [ ] Security experience: QR scan + validation result
- [ ] Entry history view
- [ ] PWA setup (manifest, service worker, offline read-only)
- [ ] E2E tests for critical flows

**Critical Blocker (Week 2 pre-launch gate):**
- [x] Firestore security rules locked down — clients denied entirely (Decision 004,
      deployed and verified 2026-08-25). The granular per-role design is retained
      in `data-model.md` as a reference, not deployed.
- [x] Multi-org isolation verified in backend code (2026-08-25). Six tests prove
      user A cannot read, change or delete user B's organization. Every new
      org-scoped route must mount the same membership check — there is no
      second safety net behind it.

---

## Next (Ordered)

### Phase 1: MVP Development (Weeks 1-4)

1. **Approval Gate** ✅ APPROVED (2026-08-19)
   - ✅ Founder approves freemium model
   - ✅ Founder approves GCP stack
   - ✅ Founder confirms Colombia as initial market
   - ✅ Decision D-001 approved

2. **Infrastructure Setup** ✅ COMPLETE (2026-08-19)
   - ✅ GCP project created (zeker-505918) + billing alert
   - ✅ Firestore database configured (us-central1)
   - ✅ Firebase Auth enabled
   - ✅ Cloud KMS key created (90-day rotation)
   - ✅ Service accounts + IAM roles assigned
   - ✅ ADC (Application Default Credentials) documented
   - ⚠️ Vercel connection: TODO (Week 1, non-blocking for local dev)

3. **Backend MVP** (7-10 days)
   - [ ] Node/Express app scaffolded
   - [ ] Firestore queries + mutations
   - [ ] Firebase Auth integration
   - [ ] Security rules written + tested
   - [ ] Encryption middleware (at-rest)
   - [ ] Endpoints: auth, orgs, locations, authorizations, validate, events
   - [ ] Error handling + validation
   - [ ] Logging + monitoring

4. **Frontend MVP** (7-10 days)
   - [ ] Next.js + React scaffolded
   - [ ] Three experiences: Admin, Responsable, Security
   - [ ] Auth flow (signup, login, logout)
   - [ ] Admin: Create org, add locations
   - [ ] Responsable: Create auth, generate QR, revoke
   - [ ] Security: Scan QR, validate, register entry
   - [ ] Basic notifications (email on entry)
   - [ ] PWA setup (offline read cache)

5. **Testing** (2-3 days)
   - [ ] Manual smoke tests (each flow)
   - [ ] Org isolation test (user A can't see user B data)
   - [ ] QR generation + scan flow
   - [ ] Authorization validity checks (date, time, location)
   - [ ] Deployment smoke test (staging environment)

6. **Launch** (0.5 day)
   - [ ] Deploy backend to Cloud Run
   - [ ] Deploy frontend to Vercel
   - [ ] Configure custom domain (optional)
   - [ ] Monitor for errors in production

### Phase 2: Customer Validation (Weeks 5-8)

1. **Recruit Beta Users** (Ongoing)
   - [ ] Contact schools/colegios in Bogotá
   - [ ] Onboard 5-10 pilot customers
   - [ ] Train on platform

2. **Measure Usage**
   - [ ] Track: orgs created, authorizations issued, validations performed
   - [ ] Track: retention (% still active after 1, 2, 4 weeks)
   - [ ] Collect feedback: what works, what's confusing

3. **Iterate Based on Feedback**
   - [ ] Bugs fixes
   - [ ] UX improvements
   - [ ] Small feature requests (if quick)

### Phase 3: Freemium → Paid Transition (Weeks 9-12)

1. **Decide Pricing** (After seeing usage)
   - [ ] Measure: How many events/month do successful orgs generate?
   - [ ] Price: Based on willingness to pay from pilot users
   - [ ] Tiers: Define PAID tier based on usage patterns

2. **Implement Billing** (3-5 days)
   - [ ] Upgrade trigger: Show "upgrade" button when user hits limit
   - [ ] Stripe integration (or similar)
   - [ ] Invoice generation

3. **Expand Market** (After product-market fit signal)
   - [ ] Research next market (residences? offices?)
   - [ ] Adapt positioning
   - [ ] Target that segment

---

## Known Issues

- ✅ ~~Nothing is saved in version history~~ — fixed 2026-08-25. Six commits now
  cover all the code and documents.
- 🟡 **Isolation between organizations depends entirely on backend code** — a
  consequence of closing the database (Decision 004). It is built and covered by
  16 tests across organizations, locations and interiors. **It stays on this
  list because it is a standing rule, not a finished task:** every new
  org-scoped route must mount the membership check and ship with a test proving
  another customer gets 404. Forgetting it once exposes every customer.
- 🟡 **Four documents are named but were never written** — a roadmap, the UX
  design, the threat model and the privacy policy. The first two are not urgent.
  **The privacy policy is legally required before launch** (Ley 1581/2016) and
  the threat model should exist before real customer data arrives. The document
  map now marks all four as missing rather than pointing at empty paths.
- 🟡 **Encryption plan is not buildable as written** — the architecture says the
  browser encrypts phone numbers before sending them. The browser cannot hold the
  Cloud KMS key. Encryption has to happen on the server. To resolve before the
  authorization endpoints are built.
- 🟡 **Dependency versions are not locked** — `package-lock.json` is excluded
  from version control and the container image installs with `npm install`
  instead of `npm ci`. Two builds of the same code can therefore pull different
  library versions. Small fix, but it affects what actually ships to production.
- 🟡 **Rate limits are counted per internet address, not per person** — the
  general 60-per-minute limit runs before the app knows who the caller is, so
  everyone in one office shares one budget. Fine for now; will need attention if
  a customer has many staff on one connection.
- 🟡 **Error messages are in English, the product is in Spanish** — the API
  returns an error code plus an English sentence. The intended approach is for
  the frontend to turn the code into Spanish text for the user. Needs one
  deliberate pass when the frontend is built, so the two do not drift.
- 🟢 **Requirements checkbox meaning clarified** (2026-08-25) — a note at the
  top of `requirements.md` now says a ticked box means "required criterion",
  not "built". Build progress lives in this file.
- ✅ ~~Database open to any signed-in user~~ — closed 2026-08-25 (Decision 004).
- ✅ ~~Design documents contradict each other~~ — the three conflicts were
  resolved by Decisions 002, 003 and 004 on 2026-08-25.
- ✅ ~~Two stale references~~ — both fixed 2026-08-25: `architecture.md` now
  points at the real decision files, and `firestore.rules` now exists.
- ⚠️ **Not yet validated with customers** — All assumptions, no market feedback
- ⚠️ **Privacy policy not yet written** — Needed before launch (high priority)
- ⚠️ **Terms & Conditions not yet written** — Needed before launch
- ⚠️ **No mobile app** — Web + PWA only for MVP (acceptable risk)
- ⚠️ **No recurring authorizations** — Phase 2 (acceptable for MVP)
- ⚠️ **No advanced reporting** — Phase 2 (acceptable for MVP)
- ⚠️ **No hardware integrations** — Phase 2 (acceptable for MVP)

---

## Pending Decisions

Everything waiting on the Founder. One card each. Answering these is all that is
needed — an answered card becomes a record in `docs/decisions/` and leaves this queue.

### D-005 — Nothing stops one person opening many free organizations

```
Decision:       Should one person be limited in how many free organizations
                they can create?

Why it matters: The free plan gives each organization 1 location and 10
                interiors. Nothing stops the same person creating ten free
                organizations and getting ten times the free allowance. The
                paid plans then sell something the free plan already gives
                away. No customer exists yet, so nothing is being abused
                today — but the hole is open the moment we launch.

                This was never decided because the approved plan describes
                limits inside one organization, and separately requires that
                one person can manage several organizations. Both are true;
                nobody joined them up.

Option A:       One free organization per person. Additional organizations
                require a paid plan, or an invitation from someone else who
                already has one.
                → Closes the hole. About half a day. It does slightly narrow
                  what a new user can do on their own.

Option B:       Leave it open for now, revisit after talking to customers.
                → Costs nothing today and keeps signup frictionless while we
                  are trying to get anyone at all to use it. The hole stays.

Option C:       Move the allowance to the person rather than the organization:
                10 interiors in total across everything they manage.
                → Most faithful to "10 interiors free", but it is the biggest
                  change, and it complicates every limit check. ~2 days.

Recommendation: B for now, A before the first paid customer. While the goal is
                to find out whether anyone wants this at all, friction at
                signup costs more than the theoretical abuse. But this must be
                answered before money changes hands, or the paid plans have
                nothing to sell.

Cost impact:    B = none today · A ≈ half a day · C ≈ 2 days
Reversibility:  High for A and B · Medium for C (changes how limits are counted)
Waiting since:  2026-08-25
Blocks:         Nothing today. Blocks launching paid plans.
```

---

## Approved Decisions

### D-004: Close the database to browsers ✅ APPROVED (2026-08-25) — BUILT

Browsers can no longer reach the database at all. Only the Zeker backend can,
and it already handled every operation. Deployed and verified the same day.
Full record: `docs/decisions/004-backend-only-firestore-access.md`.

**Consequence to carry forward:** keeping organizations separate is now purely a
job for backend code. Every endpoint must check that the caller belongs to the
organization, and a test must prove one customer cannot reach another's data.

---

### D-003: Interiors are real, limits belong to the plan ✅ APPROVED (2026-08-25)

An interior (apartment, warehouse bay, zone) becomes a real thing in the system,
sitting inside a location, with a number and a person in charge — exactly what
the approved offer sells. The old "up to 100 locations" cap is replaced by
limits attached to the customer's plan: free = 1 location, 10 interiors in
total. Hitting the limit blocks creation with a plain Spanish message.
Full record: `docs/decisions/003-interiors-and-plan-quotas.md`.

---

### D-002: Sign-in happens in the browser ✅ APPROVED (2026-08-25)

The browser signs in with Firebase directly. Our server never receives, handles,
or stores a password — it only checks the signed proof of identity it is given.
The three password-handling endpoints in the API design are removed.
Full record: `docs/decisions/002-client-side-firebase-auth.md`.

---

### D-001: Freemium Model (Resource-Limited) + GCP Stack ✅ APPROVED (2026-08-19)

**Card:**
```
Decision:       Resource-limited freemium model for access control

Scope:          MVP focuses on LOCATIONS (not schools)
                Future: Schools as separate org type

Free tier:      1 location organization
                Up to 10 interiors per location
                Unlimited entry authorizations (QR-based, not quotas)

Paid tiers:     Plan A: Up to 5 locations, 10 interiors per location
                Plan B: Up to 20 locations, 50 interiors per location
                (Exact pricing TBD after validation)

Schools (Phase 2):
                Max 50 students per free plan (different org type)
                Schools create pick-up authorizations
                (Deferred: not in MVP scope)

GCP Stack:      Approved ✓ (Firestore, Cloud Run, Firebase Auth, KMS)

Cost impact:    ~$0/month (free tier) until customers grow
Reversibility:  High (can migrate pricing model, ~1 week effort)

Waiting since:  2026-08-18
Blocker:        Data model + MVP scope locked until this approved
```

**Founder clarifications (2026-08-18):**
- Quota applies to **total interiors across all locations** (not per location; global quota)
- 1 user can manage multiple locations within the quota
- Interiors created manually; each interior has:
  - Responsable (person in charge)
  - Number/ID (bodega #, apartment #, zone #, etc.)
- Quota enforcement: Block creation on limit (no warnings)
- Data model: Locations + Interiors separate from Schools (Phase 2)

**Multi-role dispatch feedback (2026-08-19):**
- ✅ **Product Owner:** Quota must be visible in UI (global counter)
- ✅ **Architect:** Will use Firestore atomic transactions to prevent quota bypass
- ✅ **Security:** Audit logging required for all interior creates
- ✅ **UX Designer:** Single global quota bar (not per-location)
- ✅ **Backend:** 403 Forbidden response with user-friendly message (not technical)
  - Example: "Ya tiene 10 interiores. Mejore su plan para agregar más."

**Status:** ✅ APPROVED — Ready for infrastructure setup (Week 1)

---

## Technical Decisions

### Active Decisions

- **GCP Cloud Stack** — Firestore, Cloud Run, Firebase Auth, KMS
- **Sign-in in the browser** — Firebase Auth Web SDK; our API never sees a password (Decision 002)
- **Interiors under locations** — plan-based limits on the org document; free = 1 location / 10 interiors total (Decision 003)
- **Backend-only database access** — clients denied all Firestore access; isolation enforced in backend code (Decision 004)
- **Freemium Model (Resource-Limited)** — 1 location + 10 interiors free; paid plans unlock more locations/interiors
- **MVP Scope: Locations Only** — Entry authorization (QR validation). Schools deferred to Phase 2.
- **Web + PWA** — No mobile native (Phase 2+)
- **Multi-admin-multi-org** — One user can manage multiple organizations
- **Data Minimization** — Never store IDs, photos, detailed addresses
- **Encryption at Rest** — AES-256 for emails, phones
- **90-day Event Retention** — Auto-delete access logs after 90 days

### Superseded Decisions

(None yet)

---

## Explicitly Out of Scope (MVP)

- ❌ Mobile-native apps (iOS/Android)
- ❌ Recurring/recurring authorizations
- ❌ Facial recognition or biometric auth
- ❌ Hardware integrations (turnstiles, doors, cameras)
- ❌ Advanced authorization rules engine
- ❌ Real-time notifications (email only)
- ❌ Multi-language (Spanish only, initially)
- ❌ Audit reports (basic logs only)
- ❌ API for third-party integrations
- ❌ SLA guarantees (best-effort, no uptime guarantee)

---

## Metrics We Care About

### User Acquisition

- Organizations created (total, weekly)
- Users invited/activated per org
- Segment breakdown (schools vs. residences vs. other)

### Engagement

- Active organizations (created auth in last 7 days)
- Authorizations created (total, trend)
- Access validations per day
- Denied/failed validations (% of total)

### Retention

- % organizations still active after 1/4/12 weeks
- Authorization revocation rate (expected: low, means trust)

### Business

- Customers willing to pay (conversion intent)
- Pricing elasticity (what price breaks market?)
- Cost per customer acquisition (if doing paid ads later)

### Technical

- API latency (validation < 2 seconds)
- Error rate (< 1%)
- Firestore costs (stay under free tier limit)

---

## Risk Register

| Risk | Severity | Mitigation | Status |
|------|----------|-----------|--------|
| No market demand | 🔴 Critical | Validate with 5-10 schools ASAP (week 5) | ⏳ Mitigating |
| Compliance violation | 🔴 Critical | Privacy lawyer review before launch | ⏳ Planning |
| Data breach | 🔴 Critical | Encryption in place, audit logs enabled | ✅ Mitigated |
| Multi-org isolation bug | 🔴 Critical | Clients cannot reach the database at all; backend checks org membership per request; 6 isolation tests run on every change | ✅ Tested (2026-08-25) |
| Firestore costs exceed budget | 🟡 High | Set alerts at 80% quota, scale pricing if needed | ✅ Monitored |
| Vercel deployment fails | 🟡 High | Have rollback plan, GitHub branches | ⏳ Prepared |
| Slow QR validation | 🟡 Medium | Optimize queries, cache results | ⏳ TBD in code |

---

## Team & Capacity

**Current Team:**
- Founder/CEO: You
- Engineers: TBD (building initially with AI assistance)
- Designer: TBD
- Operations: TBD

**Recommended by Series A:**
- 1 Backend engineer (to review + deploy code)
- 1 Frontend engineer (to build UI)
- 1 Product/PM (to talk to customers)
- 1 QA (to test before launch)

---

## Success Criteria for MVP

MVP is "done" when:

- ✅ Can create org, locations, authorizations in < 5 minutes
- ✅ Can scan QR and register entry in < 2 seconds
- ✅ All user stories pass acceptance criteria
- ✅ No data leaks between orgs
- ✅ 10+ successful authorizations created by test users
- ✅ Security sign-off: encryption + isolation + privacy rules verified
- ✅ Deployed to production (Cloud Run + Vercel)
- ✅ Monitoring + alerts configured
- ✅ Privacy policy & ToS written + approved
- ✅ Ready for 5-10 beta customers

---

## Next Session Checklist

When you restart, check:

- [ ] Read this file first (current state)
- [ ] Check `docs/context-index.md` (know where to find docs)
- [ ] Check Pending decisions above — D-005 is waiting, not blocking
- [ ] Read "Where to pick up" below
- [ ] Update this file when work is done

---

## Where to pick up

**The setup half of the product is finished on the server. The working half is
not started, and there is still no interface at all.**

Two sensible next moves, in the order they were last discussed:

**1. Entry permits (the heart of the product).** Create a permit for a visitor,
generate the QR and the fallback numeric code, revoke it. Then validating a
scan at the door and recording the entry.

Before starting, three things need answering — the first is a real decision:

- **The visitor's phone number is optional and personal.** The original plan was
  to encrypt it, but the encryption design as written cannot work (see Known
  Issues). Either encrypt it on the server with the Cloud KMS key that already
  exists, or do not collect it at all. Not collecting it is simpler, cheaper and
  safer; collecting it enables notifying the visitor later. **Founder's call.**
- A permit belongs to exactly one interior (Decision 003). There is no
  building-wide permit in the MVP. That assumption is recorded and accepted.
- Who may create a permit: the interior's responsable, and an admin. Security
  personnel may not.

**2. A sign-in screen first**, so all of this becomes visible in a browser.
Roughly half a day. Five units are built and none can be seen. Recommended
before going much further, because seeing it working surfaces product problems
that testing does not.

**What a new session needs to know that is not obvious from the code:**

- Since Decision 004, **backend code is the only thing keeping customers
  separate.** Every org-scoped route mounts `requireOrgMember` or
  `requireOrgAdmin` and ships with a test proving another customer gets 404.
- The built code deliberately **stores less** than `data-model.md` originally
  specified — no user email or phone, no organization address or phone, no staff
  names on locations. Every one of those is marked in `data-model.md` under
  "What is actually implemented", with the reason.
- Anything the plan limits is created through `createCounted()` in
  `backend/src/lib/quota.ts`, never by writing the document directly.
- The API returns error **codes**; the Spanish wording the customer reads belongs
  in the interface.

---

**Owner:** All roles collectively
**Last updated:** 2026-08-25
**Approval:** ⏳ One card waiting — D-005 (free organizations per person). Not blocking today.
