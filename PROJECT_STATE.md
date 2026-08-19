# Project State — Zeker

Single source of truth for current progress. Updated at every checkpoint.

**Last updated:** 2026-08-18
**Last verified:** 2026-08-18 (initialization, not yet running)

---

## Current Milestone

**MVP — Access Management for Physical Spaces**

---

## Current Status

🟢 **Ready for Infrastructure Setup** (Camino B: Build first, validate after)

```
Completed:       4/10 phases (+ Product/Architecture refined)
Blocked:         0
Proposed:        0 (D-001 approved)
Needs approval:  0
Next:            Week 1 — Infrastructure setup begins
Risk:            Market validation pending (Phase 2)
```

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

✅ **Documentation**
- `docs/product/brief.md` — what we build
- `docs/product/requirements.md` — 10 user stories
- `docs/architecture/architecture.md` — full technical spec
- `docs/architecture/data-model.md` — Firestore schema
- `docs/security/data-minimization.md` — security policy
- `docs/decisions/001-freemium-gcp-stack.md` — why GCP
- `docs/roles/role-registry.md` — who owns what

---

## In Progress

🔨 **Week 1: Infrastructure Setup**
- [ ] GCP project created + billing alerts ($50/month cap)
- [ ] Firestore database + security rules drafted
- [ ] Firebase Auth configured
- [ ] Cloud KMS key created (for encryption at rest)
- [ ] Vercel project connected to Git repo
- [ ] Base directory structure created (backend + frontend)

---

## Next (Ordered)

### Phase 1: MVP Development (Weeks 1-4)

1. **Approval Gate** 🟡
   - [ ] Founder approves freemium model
   - [ ] Founder approves GCP stack
   - [ ] Founder confirms Colombia as initial market

2. **Infrastructure Setup** (1-2 days)
   - [ ] GCP project created + billing alert at $50/month
   - [ ] Firestore database configured
   - [ ] Firebase Auth enabled
   - [ ] Cloud KMS key created
   - [ ] Vercel connected to repo

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

- ⚠️ **Not yet validated with customers** — All assumptions, no market feedback
- ⚠️ **Privacy policy not yet written** — Needed before launch (high priority)
- ⚠️ **Terms & Conditions not yet written** — Needed before launch
- ⚠️ **No mobile app** — Web + PWA only for MVP (acceptable risk)
- ⚠️ **No recurring authorizations** — Phase 2 (acceptable for MVP)
- ⚠️ **No advanced reporting** — Phase 2 (acceptable for MVP)
- ⚠️ **No hardware integrations** — Phase 2 (acceptable for MVP)

---

## Approved Decisions

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
| Multi-org isolation bug | 🟡 High | Security rules + unit tests | ⏳ Testing |
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
- [ ] Check Pending decisions above (any approvals needed?)
- [ ] Read the next task from "Next" section
- [ ] Update this file when work is done

---

**Owner:** All roles collectively
**Last updated:** 2026-08-18
**Approval:** ⏳ Pending Founder D-001
