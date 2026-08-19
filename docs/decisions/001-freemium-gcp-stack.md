# Decision 001: Freemium Model + GCP Cloud Stack

**Date:** 2026-08-18
**Owning Role:** Commercial + Software Architect
**Status:** ✅ DECIDED

---

## Context

**Problem:** Validate market demand for access management SaaS before investing heavily. Need to minimize infrastructure spend while building MVP.

**Constraints:**
- Limited budget: must use free/cheap cloud services initially
- Quick to market: can't spend 2 months on infrastructure
- Scalability: architecture must support growth if market validates
- Multi-tenancy: day-1 requirement (one admin manages multiple orgs)
- Security: must handle PII (personal data) responsibly

---

## Decision

**We will launch MVP on GCP free tier with freemium pricing model.**

### Technical Stack

| Component | Service | Free Tier | MVP Fit |
|-----------|---------|-----------|---------|
| Compute | Cloud Run | 2M req/month, 360k cpu-sec | ✅ Sufficient |
| Database | Firestore | 1GB read, 50k write/day | ✅ Perfect |
| Auth | Firebase Auth | 100 concurrent users | ✅ Covers MVP |
| Encryption | Cloud KMS | 20k ops/month | ✅ Enough |
| Frontend | Vercel | Unlimited (Next.js) | ✅ Free forever |
| Storage | Cloud Storage | 5GB free | ✅ Backups |

**Projected cost with 100 daily users:** $0-20/month (staying under free tier limits)

### Monetization Model

**Freemium (indefinite, free):**
- 1 organization
- 10 active authorizations
- 100 access events/month
- QR code generation

**Paid Tier (when customer needs it):**
- Unlimited organizations
- Unlimited authorizations
- Unlimited events
- Advanced reports
- Priority support
- Price: $25-50/month (validated after customer feedback)

**Upgrade trigger:** When customer hits a limit, show upgrade prompt.

---

## Alternatives Considered

### A1: Firebase-Only (Realtime Database)

**Pros:**
- Simpler schema
- Faster real-time updates
- Cheaper for small datasets

**Cons:**
- No complex querying (queries by multiple fields hard)
- Firestore is upgrade-path (less rework)

**Decision:** No. Firestore better for authorization queries.

### A2: AWS Free Tier

**Pros:**
- Similar cost
- More compute power (Lambda)

**Cons:**
- Harder to set up multi-tenant isolation
- More services to configure
- GCP KMS easier for encryption

**Decision:** No. GCP simpler for this use case.

### A3: Paid Infrastructure from Day 1

**Pros:**
- More resources
- No surprises scaling

**Cons:**
- Burn money before validating market
- Risk: $500+/month if no customers

**Decision:** No. Freemium is Camino B (cheap validation).

---

## Consequences

### Benefits

✅ **Low financial risk:** $0 spend until product-market fit
✅ **Fast iteration:** GCP services integrate well
✅ **Multi-tenant by design:** Firestore encourages org-level partitioning
✅ **Secure:** KMS encryption included
✅ **Scalable:** Auto-scales to production with same architecture (just pay more)
✅ **Compliance:** GCP managed services = LSPDP/GDPR-ready

### Risks

⚠️ **Cold starts:** Cloud Run ~2-3 second startup (OK for MVP)
⚠️ **Multi-region:** Firestore single region (Phase 2 can add)
⚠️ **No offline writes:** PWA can only cache reads (OK for MVP)
⚠️ **Vendor lock-in:** GCP-specific services (Firestore not portable)
⚠️ **Free tier limits:** If we grow fast, need to pay fast (acceptable risk)

### Mitigation

| Risk | Mitigation |
|------|-----------|
| Cold starts | Pre-warm Cloud Run, or upgrade to always-on (costs) |
| Single region | CloudSQL failover setup (Phase 2) |
| No offline writes | Document PWA limitation in help docs |
| Vendor lock-in | API abstraction layer (Phase 2, if needed) |
| Free tier overage | Monitor quota, alert at 80% usage |

---

## Implementation Checklist

- [ ] GCP project created
- [ ] Firestore database configured
- [ ] Firebase Auth enabled
- [ ] Cloud KMS key created
- [ ] Cloud Run deployed (backend)
- [ ] Vercel deployed (frontend)
- [ ] Security rules written + tested
- [ ] Monitoring + alerts configured
- [ ] Privacy policy drafted

---

## Rollback Plan

If GCP proves inadequate or costs spike:

1. **Pause new feature development** (1-2 weeks)
2. **Migrate to Supabase** (PostgreSQL + Firebase Auth clone)
3. **Redeploy** on Supabase + Vercel (architecture change ~3 days)
4. **Cost:** ~$100 migration + rework, $50+/month ongoing

**Estimated rollback time:** 1-2 weeks, fully planned.

---

## Approval

- ✅ **Software Architect:** Approved — stack is appropriate
- ✅ **Commercial:** Approved — freemium model validates market cheaply
- ✅ **Security Engineer:** Approved — encryption + isolation in place
- 🟡 **Founder/CEO:** Awaiting approval

---

## Related Decisions

- [[002-web-pwa-not-native.md]] — Why web+PWA, not mobile native
- Architecture.md § 7 — Multi-tenancy design

---

**Owner:** Software Architect + Commercial
**Last updated:** 2026-08-18
