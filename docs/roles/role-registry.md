# Role Registry — Zeker

Active roles for this project and their current holders.

**Last updated:** 2026-08-27
**Status:** ✅ INITIALIZED (MVP phase)

---

## Human-Held Authority

These roles are held by humans and carry final decision authority. AI never simulates these.

### Founder / CEO

**Name:** [User / Founder]
**Mission:** Sets company direction, validates market, approves 🟡/🔴 decisions
**Active:** ✅ Yes
**Authority:** Freemium strategy, market segment choice, investment decisions
**Consulted on:** Product direction changes, pivot decisions, capital allocation

**Decisions taken:**
- ✅ Freemium model + GCP stack + Colombia as first market (2026-08-19, Decision 001)
- ✅ Sign-in happens in the browser; the API never sees a password (2026-08-25, Decision 002)
- ✅ Interiors as a real level; plan-based limits (2026-08-25, Decision 003)
- ✅ Clients denied direct database access (2026-08-25, Decision 004)
- ✅ A permit does not collect the visitor's phone number (2026-08-26, Decision 005)
- ✅ Build the sign-in screens before the permit endpoints (2026-08-26)
- ✅ Build the setup screens now; make customer calls in parallel (2026-08-27)
- ✅ No data-fetching library — keep it simple (2026-08-27)

**Pending 🟡 approvals:**
- D-005 — how many free organizations one person may create. Not blocking
  today; blocks launching paid plans. See `PROJECT_STATE.md`.
- D-006 — whether we verify that whoever registers a building actually runs it.
  Raised by the security review on 2026-08-27. Not blocking today; blocks
  opening signup to the public.

---

## Owning Roles (AI-Embodied)

These roles own specific artifacts and can turn proposals into decisions within their scope.

### Product Owner / PM

**Holder:** AI-assisted, unfilled (recommend hiring by Series A)
**Mission:** Define product vision and prioritize what gets built
**Scope:**
- Problem statement
- Target users
- MVP scope (what to build, what not to build)
- Roadmap (NOW / NEXT / LATER)
- Product-market fit validation
- Success metrics

**Owned Artifacts:**
- `docs/product/brief.md`
- `docs/product/requirements.md`
- `docs/product/roadmap.md`

**Decision Authority:**
- ✅ Feature prioritization (within MVP scope)
- ✅ User story acceptance criteria
- 🟡 Major scope changes (needs Founder approval)
- 🟡 Pivot to different segment (needs Founder approval)

**Consulted on:**
- Architecture decisions (affects UX)
- Security decisions (affects feature design)
- Commercial pricing (affects positioning)

---

### Software Architect

**Holder:** AI-assisted, unfilled (recommend hiring before scaling)
**Mission:** Design technical architecture and make infrastructure decisions
**Scope:**
- Technology stack selection
- Database schema & data model
- API design
- Multi-tenancy architecture
- Deployment & DevOps
- Scalability planning
- Integration points (future)

**Owned Artifacts:**
- `docs/architecture/architecture.md`
- `docs/architecture/data-model.md`
- `docs/architecture/api.md`

**Decision Authority:**
- ✅ Library/framework choices (within approved stack)
- ✅ Schema design
- 🟡 Stack changes (GCP → AWS, SQL → NoSQL — needs founder approval if costs change)
- 🟡 Infrastructure decisions impacting security or cost

**Consulted on:**
- Security architecture
- Product requirements (technical feasibility)
- Data minimization rules

---

### Security Engineer / CISO

**Holder:** AI-assisted, unfilled (recommend hiring when handling production data)
**Mission:** Protect data and systems from threats
**Scope:**
- Data minimization & retention policies
- Encryption strategy
- Threat modeling
- Access controls & isolation
- Compliance (LSPDP, GDPR prep)
- Incident response
- Audit & logging

**Owned Artifacts:**
- `docs/security/data-minimization.md`
- `docs/security/threat-model.md` (to be created)
- `docs/security/privacy.md` (to be created)

**Decision Authority:**
- ✅ What data to store/encrypt (data minimization rules)
- ✅ Security rules in Firestore
- 🟡 Compliance decisions (needs legal review if regulated)
- 🟡 Incident response decisions

**Consulted on:**
- Product features involving PII
- Architecture decisions
- Privacy policy wording

**Standing Consultation Trigger:**
- Any feature touching personal data (especially minors)
- Any decision on data retention/deletion
- Any infrastructure change

---

### UI/UX Designer

**Holder:** AI-assisted, unfilled (recommend hiring before Series A)
**Mission:** Ensure product is usable and delightful
**Scope:**
- User experience design (flows, interactions)
- Visual design system
- Wireframes & prototypes
- Accessibility (WCAG compliance)
- Responsive design (web + PWA)
- Usability testing

**Owned Artifacts:**
- `docs/architecture/design.md` (layout, components, language, accessibility)
- `docs/architecture/design-system.md` (future)

**Decision Authority:**
- ✅ UX decisions (flows, interaction patterns)
- ✅ Visual design (color, typography, spacing)
- 🟡 Accessibility compliance level (needs PM alignment if affects timeline)

**Consulted on:**
- Product requirements (feasibility of UX)
- Architecture (affects UI performance)

---

### Backend Developer / Full-Stack Developer

**Holder:** AI-assisted, unfilled (recommend hiring for production code)
**Mission:** Implement backend services and APIs
**Scope:**
- Backend code quality
- API implementation
- Database operations
- Testing (unit, integration)
- Performance optimization

**Owned Artifacts:**
- Backend codebase (`/backend` or similar)
- API implementation code
- Database migrations

**Decision Authority:**
- ✅ Code implementation details (style, refactoring)
- ✅ Testing strategy (unit vs. integration)
- 🟡 Libraries & dependencies (needs Architect approval if adds complexity)

**Consulted on:**
- Architecture decisions (implementation feasibility)
- Security decisions (implementation impact)

---

### Frontend Developer / Full-Stack Developer

**Holder:** AI-assisted, unfilled (recommend hiring for production code)
**Mission:** Implement frontend UI and client-side logic
**Scope:**
- Frontend code quality
- Component implementation
- State management
- Performance optimization
- PWA implementation
- Responsive design implementation

**Owned Artifacts:**
- Frontend codebase (`/frontend` or similar)
- Component library code

**Decision Authority:**
- ✅ Component implementation
- ✅ Client-side state management
- 🟡 Framework changes (needs Architect approval)

**Consulted on:**
- UX/Design decisions (implementation feasibility)
- Architecture decisions (affects component design)

---

### QA Engineer

**Holder:** AI-assisted, unfilled (recommend hiring for production testing)
**Mission:** Verify product quality and catch regressions
**Scope:**
- Test planning
- Manual testing (smoke tests, UAT)
- Automated testing strategy
- Regression testing
- Performance testing (basic)
- Security testing (basic)

**Owned Artifacts:**
- Test plans & test cases
- Test automation code

**Decision Authority:**
- ✅ What to test and how to test it
- 🟡 Release readiness (can recommend hold if critical bugs found)

**Consulted on:**
- Definition of Done (what "done" means)
- Requirements acceptance criteria

---

## Advisory Roles

These roles don't own artifacts but provide standing consultation across multiple domains.

### Customer Discovery & Validation Advisor

**Holder:** AI-assisted, unfilled (recommend hiring after MVP, before Series A)
**Mission:** Prevent building on unvalidated assumptions
**Scope:**
- Customer research & interviews
- Problem validation
- Solution validation
- Product-market fit assessment
- Customer feedback synthesis

**Standing Consultation Trigger:**
- Before starting new feature (is it validated?)
- Before major pivots
- On significant product decisions

**Consulted on:**
- Roadmap prioritization
- MVP scope
- Market expansion decisions

---

### Data Analyst

**Holder:** AI-assisted, unfilled (recommend hiring at 100+ MAU)
**Mission:** Measure what matters and catch problems early
**Scope:**
- Metrics definition
- Tracking implementation
- Analytics dashboards
- Data-driven insights
- Churn analysis

**Standing Consultation Trigger:**
- Definition of success metrics
- Major product changes (what to measure?)

**Consulted on:**
- What telemetry to collect
- Freemium → paid conversion metrics

---

## Roles NOT Active (Yet)

These roles will activate when relevant.

- **Commercial / Head of Sales:** Post-MVP validation (when selling)
- **Marketing / Demand Gen:** Post-MVP validation (when scaling)
- **Finance / CFO:** When revenue > $0
- **General Counsel:** When processing payments or mature enough
- **Operations / COO:** When team > 3 people

---

## Responsibilities Matrix

| Concern | Owner | Consulted |
|---------|-------|-----------|
| MVP scope | Product Owner | Architect, UX Designer |
| User stories | Product Owner | Designer, Architect |
| Architecture | Architect | Security, Product Owner |
| Data model | Architect | Security Engineer |
| Security | Security Engineer | Architect, all roles |
| UX/Design | UX Designer | Product Owner, Frontend Dev |
| Backend code | Backend Dev | Architect, QA |
| Frontend code | Frontend Dev | UX Designer, Architect |
| Testing | QA Engineer | All |
| Metrics | Data Analyst | Product Owner, all |

---

## Consultation History

Which roles were actually consulted on which request, so a later Definition of
Done check can see it happened rather than infer it from the output.

| Date | Request | Roles consulted | Outcome |
|------|---------|-----------------|---------|
| 2026-08-19 | Multi-role dispatch validation | Backend, Frontend, Architect, Product Owner, Security | Recorded in `PROJECT_STATE.md` |
| 2026-08-27 | Setup screens (create organization, locations, interiors) — full dispatch before implementation | Product Owner, UI/UX Designer, Software Architect, Security Engineer / CISO, Frontend Developer, QA Engineer, Customer Discovery & Validation Advisor, Data Analyst | 3 conflicts resolved between roles; 2 decisions answered by the Founder (build now + no new dependency); 1 new risk raised as D-006; 2 API documentation defects fixed; unit built and verified |

**Concerns with no active owner, noted on 2026-08-26:** the Spanish wording
itself has no owner — Content Strategist / Copywriter is not active, so
interface copy is currently written by whoever builds the screen against the
tone rules in `../architecture/design.md`. Regulatory & Data Privacy Counsel is
also not active, and the privacy policy required before launch needs it.

**Owned artifacts that do not exist:** `customer-discovery.md` (Customer
Discovery & Validation Advisor) and `analytics.md` (Data Analyst). Both roles
flagged the absence of their own artifact as a finding on 2026-08-26.

---

## Role Activation History

| Date | Role | Action | Notes |
|------|------|--------|-------|
| 2026-08-18 | Founder/CEO | Activated | Human-held, active |
| 2026-08-18 | Product Owner | Activated | AI-assisted, unfilled |
| 2026-08-18 | Architect | Activated | AI-assisted, unfilled |
| 2026-08-18 | Security Engineer | Activated | AI-assisted, unfilled |
| 2026-08-18 | UX Designer | Activated | AI-assisted, unfilled |
| 2026-08-18 | Backend Developer | Activated | AI-assisted, unfilled |
| 2026-08-18 | Frontend Developer | Activated | AI-assisted, unfilled |
| 2026-08-18 | QA Engineer | Activated | AI-assisted, unfilled |
| 2026-08-18 | Customer Discovery Advisor | Activated | AI-assisted, unfilled |
| 2026-08-18 | Data Analyst | Activated | AI-assisted, unfilled |

---

## How This Works in Practice

**When a request comes in:**

1. Classify which role(s) it touches
2. Read that role's scope from this registry
3. Follow `mantis.md` §7.1 (Context Resolution) + §24 (Implementation Protocol)
4. If 🟡/🔴 decision needed, raise to PROJECT_STATE.md's Pending decisions queue
5. If involves multiple roles, use Inter-Role Communication protocol (`roles.md` §7)

**Example:** "Build authorization QR feature"
- Product Owner: Confirms acceptance criteria (user story)
- UX Designer: Confirms UX flow & design
- Architect: Confirms data model & API contract
- Security Engineer: Confirms no PII leakage, encryption applied
- Backend Dev: Implements API
- Frontend Dev: Implements UI
- QA: Tests against acceptance criteria
- All: Sign off when done

---

**Owner:** All roles collectively
**Last updated:** 2026-08-27
**Related:** `mantis/roles.md` §5 (Role Activation Protocol)
