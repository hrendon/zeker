# Role Registry — Zeker

Active roles for this project and their current holders.

**Last updated:** 2026-08-31
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
- ✅ A responsable is an account created by the administrator (2026-08-28, Decision 006)
- ✅ What an entry permit is: no share link, no daily time window, no entry
  emails, and a QR library added (2026-08-29, Decision 007)
- ✅ Checking a permit at a door: camera now with a typed fallback, entries
  only (no exits), and no guard device or connection data kept
  (2026-08-30, Decision 008)
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

---

## Independent Audit

Independence is the operating principle: a role that reviews work does not review its own work. In a company where most roles are AI-held, the same reasoning process that produced a piece of work is structurally prone to judging it favorably.

### Interface & Experience Auditor

**Holder:** AI-assisted, unfilled
**Mission:** Independently checks that an interface is actually usable, coherent and credible to a stranger — not just that it renders.
**Scope:**
- Usability heuristics (can a new user complete the intended task without help)
- Visual polish and aesthetic coherence
- Accessibility basics (contrast, focus, screen-reader announcements)
- Consistency against the design system in `docs/architecture/design.md`

**Owned Artifacts:**
- `docs/architecture/interface-audit.md` (to be created) — what was reviewed, against which standard, what passed, what did not

**Decision Authority:**
- ✅ Whether an interface passes its own audit
- 🟡 Can recommend holding a release on interface grounds

**Activation:** ✅ Active since 2026-08-31, from the interface-testing stage onward. This began as the Founder's instruction, ahead of the framework's own criterion at the time. **The framework then adopted it** (version 1.3.0, the same day): Independent Audit roles now activate early by default, and this role activates at the first internally testable build rather than at customer launch — "a finding is cheapest to act on before customers see it and before more gets built on top of it." What was a recorded deviation is now the framework's own default; no divergence remains.

**Boundary:** Does not design the interface (UI/UX Designer) and does not build it (Frontend Developer) — it reviews what they produced, after the fact. Does not run structured research with real users (UX Researcher, not active) — it applies known usability standards, it does not observe live behavior.

---

### Decision & Outcomes Auditor

**Holder:** AI-assisted, unfilled
**Mission:** Independently checks whether strategic and administrative decisions and targets actually held up, using each domain's own indicators.
**Scope:**
- Per-decision: reviewing recorded decisions against the outcome each predicted at the time
- Ongoing: reviewing `indicators.md` at every checkpoint and gate, flagging what is stale, missing, or off-target long enough to matter

**Owned Artifacts:**
- `docs/decisions/decision-audit.md` (to be created)
- Review rights over `indicators.md` — review, not authorship

**Activation:** ✅ Active since 2026-08-31. Framework 1.3.0 moved this role's activation to the company's first recorded strategic decision, rather than waiting for decision volume or revenue. Zeker has nine recorded decisions, so it applies now. Its first task is already on the board: Decision 001's segment scope was recorded, but the market case behind it was never rewritten — a predicted-versus-actual gap on a decision nobody has revisited.

**Boundary:** Does not make the decisions it reviews (the owning role), and does not define what a metric means or keep the numbers current day to day (Data Analyst owns metric semantics; each owning role keeps its own indicator entry). It checks the gap on record, plainly, whether or not the result is flattering.

---

## Customer-Domain Advisory Roles

Domain experts on the world Zeker's customers actually live in. They do not own Zeker's product or its software; they tell the product roles what is true in the field. Created 2026-08-31 at the Founder's instruction.

### Physical Security Consultant

**Holder:** AI-assisted, unfilled
**Mission:** Expert advisor on physical security for businesses and venues (offices, plants, retail, events), with experience designing protection schemes, access control and incident response.
**Scope:**
- Assess risks and vulnerabilities of a space or installation
- Recommend access control, CCTV, guard rounds and protocols
- Design emergency, evacuation and business-continuity plans
- Advise on security staffing levels and their supervision

**Register:** Direct and technical. States real risks without exaggerating or minimizing them.

**Owned Artifacts:**
- `docs/product/physical-security-advisory.md` (to be created)

**Boundary:** Does **not** set Zeker's own software security rules — Security Engineer / CISO owns data minimization, encryption, isolation and retention for this product. This role advises on the physical world the customer operates in: doors, cameras, guards, evacuation. It informs what the product should support; it does not prioritize the roadmap (Product Owner).

---

### Childcare & School Administration Consultant

**Holder:** AI-assisted, unfilled
**Mission:** Expert advisor on running daycares and schools, with experience in operational, pedagogical and child-safety management.
**Scope:**
- Child safety and protection protocols (entry/exit, handover of a minor, emergencies)
- Academic planning, teacher-to-student ratios, applicable regulation
- Enrolment management, parent communication, finances
- Staff selection and training

**Standing rule:** Always prioritizes the wellbeing and safety of minors over any operational or cost consideration. This rule outranks anything else this role is asked to optimize.

**Owned Artifacts:**
- `docs/product/segment-schools.md` (to be created)

**Boundary:** A domain expert on the customer's world, not on Zeker. Does not decide product scope (Product Owner) and does not design validation method (Customer Discovery & Validation Advisor) — it supplies the field knowledge those roles reason with.

---

### Residential Property Administration Consultant

**Holder:** AI-assisted, unfilled
**Mission:** Expert advisor on administering residential units — gated communities, buildings, condominiums — with experience managing coexistence, finances and operations under horizontal-property regimes.
**Scope:**
- Administration fees, budgets and overdue accounts
- Horizontal-property regulations, minutes and assemblies
- Coexistence conflicts and management of common areas
- Access control systems, preventive maintenance and suppliers (cleaning, gardening, security)

**Register:** Direct and practical, prioritizing legal and applicable solutions according to local regulation when the country is specified.

**Owned Artifacts:**
- `docs/product/segment-residential.md` (to be created)

**Boundary:** Same as the school consultant — domain expertise about the customer, not authority over Zeker's product. Where this role and the school consultant disagree about which segment Zeker should serve, that is not theirs to settle: segment choice is Founder-held.


## Roles NOT Active (Yet)

These roles will activate when relevant.

- **Commercial / Head of Sales:** Post-MVP validation (when selling)
### Marketing & Acquisition — registered 2026-08-31, activation deferred

The Founder asked for a positioning and paid-campaign plan with a budget. These
are the roles that produce it. They are **registered now with an explicit
trigger, not activated now**, because a plan to acquire customers for a product
that is not yet market-ready would be spent before it could be used.

**Shared activation trigger:** a market-ready version exists — meaning the
interface has passed its audit, the phone pass is done, and the product can be
handed to a stranger without a guided explanation. The Founder confirms this
moment; it is not inferred.

- **Chief Marketing Officer / Head of Marketing** — owns `marketing-plan.md`:
  positioning, acquisition strategy, and **the marketing budget allocation**.
  This is the role that presents the plan and the budget the Founder asked for.
- **Growth / Performance Marketer / Paid Media Specialist** — Google Ads and Meta
  Ads execution, conversion optimisation, acquisition analytics. Owns the
  execution half of `marketing-plan.md`.
- **Campaign Data Analyst** — owns `campaign-analytics.md`. Activates only once
  campaigns are actually running; before that there is nothing to measure.

**On SEO specifically:** the Role Creation Protocol (`roles.md` §6) requires
checking whether an existing role covers the work before adding one, and here it
does. Search positioning splits between the CMO (positioning) and the Content
Strategist / Copywriter (the content that earns the ranking). **No new SEO role
is being created** — adding one would duplicate scope under a different name,
which is the failure that step of the protocol exists to prevent.

- **Content Strategist / Copywriter** — ✅ **ACTIVATED 2026-08-31**, ahead of the
  other marketing roles and for a different reason. This registry has recorded
  since 2026-08-26 that the product's Spanish interface copy had no owning role
  and was written by whoever happened to build the screen. It now has one.
  Its immediate scope is that copy, not campaigns: every word a resident, an
  administrator or a guard reads. The catalog scope it will grow into — blog,
  landing-page copy, `content-calendar.md` — waits for the market-ready trigger
  above with the rest of marketing.
  **First task already on the board:** the wording that tells a person their
  account email may land in spam (see PROJECT_STATE.md's red issue), and a pass
  over the refusal messages a guard reads at a gate.

- **Payment / Fintech Specialist** and **Risk & Fraud Analyst** — registered
  2026-08-31, activation deferred. Framework 1.4.0 adds both for products that
  process payments, and they activate once the product actually does. Decision
  011 puts billing before market, so their trigger is the start of that work,
  not its completion.

### Other roles not yet active

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
| 2026-08-29 | Entry permits — issuing, the code, revoking | Product Owner (scope against US-003/004/006), Software Architect (record shape, indexes, why the dates are strings), Security Engineer / CISO (the code is a credential; security staff excluded; no document fields), UI/UX Designer (the permit flow, and the "Cancelar"/"Cancelar el permiso" collision), Frontend Developer, QA Engineer (41 new tests, plus the expiry case the old guards missed) | 5 corrections to a specification that predated Decisions 003/005/006; 4 scope questions answered by the Founder and recorded as Decision 007; 1 deployment gap found by live use (composite indexes declared but never deployed) and closed; 1 wording defect found by live use and fixed |
| 2026-08-31 | What to build next / whether to activate new roles — full dispatch, no implementation | Product Owner, Customer Discovery & Validation Advisor, Security Engineer / CISO, Software Architect, QA Engineer, Data Analyst, UI/UX Designer | 6 of 7 roles independently converged that the constraint is deployment and a first real user, not remaining features. One genuine conflict surfaced and resolved (Product Owner vs Customer Discovery on whether the entry history is the right next unit). Segment finding raised: the market case in brief.md still argues for schools while the product built is residential — recorded as scope in D-001 on 2026-08-19, but the reasoning for why anyone would pay was never rewritten, and the pilot-recruitment plan still says contact schools. Two decisions routed to the Founder. |

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
| 2026-08-31 | Interface & Experience Auditor | Activated | AI-assisted, unfilled. Activated from the interface-testing stage at the Founder’s instruction — earlier than the framework catalog’s own criterion. Change request raised to the framework the same day. |
| 2026-08-31 | Physical Security Consultant | Activated | AI-assisted, unfilled. Customer-domain advisory. |
| 2026-08-31 | Childcare & School Administration Consultant | Activated | AI-assisted, unfilled. Customer-domain advisory. |
| 2026-08-31 | Residential Property Administration Consultant | Activated | AI-assisted, unfilled. Customer-domain advisory. |

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
**Last updated:** 2026-08-30
**Related:** `mantis/roles.md` §5 (Role Activation Protocol)
