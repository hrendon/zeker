# Context Index

Map of authoritative sources for project knowledge.

| Domain | File | Purpose | Owner |
|--------|------|---------|-------|
| **Product** | | | |
| Vision & problem | `product/brief.md` | The problem, the buyer, what the product actually does today, what it deliberately does not do and what that costs, and the ten labelled assumptions the whole market case rests on. **Rewritten 2026-09-04 for Decision 010's segment.** Every claim in it is labelled fact, consultant judgement or assumption — there is no customer evidence to label | Product Owner |
| Requirements | `product/requirements.md` | User stories, acceptance criteria | Product Owner |
| Roadmap | ⛔ not written | MVP / Phase 2 / Phase 3 currently live in `../PROJECT_STATE.md` under "Next" | Product Owner |
| **Architecture** | | | |
| Technical decisions | `architecture/architecture.md` | Stack, deployment, multi-tenant design | Software Architect |
| Data model | `architecture/data-model.md` | Firestore collections, schema, constraints | Software Architect |
| APIs | `architecture/api.md` | Endpoints, request/response, authentication | Software Architect |
| Design (UX/UI) | `architecture/design.md` | Layout, language, components, accessibility, and the setup flow. The responsable and security experiences are still to be designed | UI/UX Designer |
| Metrics | ⛔ not written | Metric definitions and what each one actually measures | Data Analyst |
| Customer evidence | `product/customer-discovery.md` | The opening question, the order the assumptions are tested in, what a "no" looks like — all decided **before** the first call — and the (empty) log of what administrators actually said | Customer Discovery & Validation Advisor |
| Developer guide | `architecture/developer-guide.md` | How to run, test, and deploy the code, plus `npm run report` (the business) and `npm run costs` (the money) | Backend Developer |
| Cost watch | `../backend/scripts/cost-watch.ts` | How full each free tier is, against the ceiling. **Not the bill** — it says so itself | FP&A Manager |
| **Security** | | | |
| Data minimization | `security/data-minimization.md` | What we store, what we never store, minimization rules | Security Engineer |
| Threat model | ⛔ not written | Threats, mitigations, assumptions | Security Engineer |
| Privacy policy | ⛔ not written | Ley 1581/2016 compliance, consent, retention. Required before launch | Security Engineer |
| API key snapshots | `security/api-key-snapshots/` | The browser key's restrictions as they stood before each change, one file per date. Evidence that a change was made deliberately, and what to restore | Security Engineer |
| Database access rules | `../firestore.rules` | The Firestore rules actually deployed (clients denied; backend-only) | Security Engineer |
| Database indexes | `../firestore.indexes.json` | Composite indexes the queries need. Declaring one is not deploying it — see `architecture/developer-guide.md`. Six live as of 2026-09-03, all confirmed READY | Software Architect |
| **Delivery / QA** | | | |
| Hand-run test cases | `delivery/manual-test-cases.md` | The tests a person runs in a real browser or phone, each with its pass/fail line written in advance. Automated suites have gone green three times while the product was broken | QA Engineer |
| **Decisions** | | | |
| Budget | `business/budget.md` | Monthly spending ceiling and what it covers | Founder + FP&A Manager |
| Indicators | `business/indicators.md` | The live scoreboard: target, current value, status. Each role owns its own rows. **UNMEASURED is a valid value; a guess is not** | Each owning role |
| Risk register | `business/risks.md` | What has not happened, could, and would cost something. An accepted risk stays here with its acceptance recorded | Each owning role |
| Vendors | `business/vendors.md` | Who we buy from, renewal dates, exit terms. Recorded **before** the card is charged | Procurement / Vendor Manager |
| **Meetings** | | | |
| Meeting records | `meetings/` | One file per occurrence, `YYYY-MM-DD-<slug>.md`. Episodic — durable knowledge is promoted out of them to the artifacts below | The convening role |
| — 2026-09-01 | `meetings/2026-09-01-revision-semanal.md` | First weekly review: the locked-out Founder, the recovery path, D-005's consequences, the next unit | Product Owner + Architect + Security + QA + Interface Auditor |
| — 2026-09-01 | `meetings/2026-09-01-mbr-comite-gasto.md` | First monthly review and spend committee: spend is unverified, eleven decisions audited, the domain deferred | FP&A + Procurement + Decision Auditor |
| — 2026-09-04 | `meetings/2026-09-04-revision-semanal.md` | Second weekly review, three units late: the consultants' claim was half wrong and checking it saved weeks, the billing account is in pesos, the image store fills itself, and seventeen days without a customer conversation | Product Owner + Architect + Security + QA + Discovery + FP&A + both domain consultants |
| Interface audit | `architecture/interface-audit.md` | Independent review of whether the interface works for a stranger | Interface & Experience Auditor |
| Decision log | `decisions/` | Significant decisions with context & rationale | All roles |
| — audit | `decisions/decision-audit.md` | Did decisions deliver what they predicted | Decision & Outcomes Auditor |
| — 001 | `decisions/001-freemium-gcp-stack.md` | Freemium model + GCP stack | Commercial + Architect |
| — 002 | `decisions/002-client-side-firebase-auth.md` | How users sign in; the API never sees a password | Architect + Security |
| — 003 | `decisions/003-interiors-and-plan-quotas.md` | Interiors as a real level; plan-based limits | Architect + Product Owner |
| — 004 | `decisions/004-backend-only-firestore-access.md` | Clients denied direct database access | Security |
| — 005 | `decisions/005-no-visitor-phone-number.md` | A permit stores no phone number; nothing needs KMS encryption | Security + Product Owner |
| — 006 | `decisions/006-members-and-responsable-accounts.md` | A responsable is an account created by the administrator | Product Owner + Architect + Security |
| — 007 | `decisions/007-entry-permits.md` | What an entry permit is, and why its code is random | Founder + Architect + Security |
| — 008 | `decisions/008-checking-a-permit-at-a-door.md` | Checking a permit at a door, and what a check leaves behind | Founder + Architect + Security |
| — 009 | `decisions/009-frontend-hosting.md` | The frontend runs on Cloud Run, not Vercel (supersedes part of 001) | Founder + Architect |
| — 010 | `decisions/010-target-segment.md` | The market is residential and business complexes, not schools | Founder |
| — 011 | `decisions/011-billing-before-market.md` | Billing and subscriptions must exist before going to market | Founder |
| — 012 | `decisions/012-one-free-organization.md` | One free organization per person, counted by who created it | Founder + Product Owner + Security |
| — 013 | `decisions/013-meeting-cadence.md` | Which meetings Zeker holds, which are merged, and which are dormant | Founder + PM |
| — 014 | `decisions/014-permit-use-and-what-it-leaves-behind.md` | One entry or free entries, chosen when the permit is created; the permit itself records that it was used | Founder + Product Owner + Architect |
| — 015 | `decisions/015-what-the-guard-records-when-nobody-comes-in.md` | Four fixed reasons a guard can touch, never free text; "no entró" gives a one-entry permit back | Founder + Security + Product Owner |
| — 016 | `decisions/016-days-and-hours-a-permit-may-be-used.md` | A permit may carry days of the week and a range of hours, read in the building's own clock; the organization gains a timezone | Founder + Product Owner + Architect |
| **Roles** | | | |
| Active roles | `roles/role-registry.md` | Which roles are active, who holds each | All |
| **Lifecycle** | | | |
| Current progress | `../PROJECT_STATE.md` | Status, completed, in progress, next, known issues | All |

---

## Knowledge sources by use case

### Starting a session
1. Read `../PROJECT_STATE.md` (current status)
2. Read `product/brief.md` (what we build)
3. Read `architecture/architecture.md` (how we build it)

### Implementing a feature
1. Check `product/requirements.md` for the user story
2. Check `architecture/data-model.md` for the data structure — including the
   "What is actually implemented" notes, which record where the built code
   deliberately stores less than the original design
3. Check `architecture/api.md` for the endpoint contract
4. Check `security/data-minimization.md` for data handling rules
5. Check `decisions/` for anything that changed the answer
6. Check `architecture/design.md` for the screen conventions — layout, the
   component set, the Spanish-only rule, and the two sign-in rules that look
   like design but are security
7. **If the query combines an equality filter with a range, add the composite
   index to `../firestore.indexes.json` and deploy it.** The test double does
   not need indexes; real Firestore refuses the query without one

**Every org-scoped route must mount the membership check** (`requireOrgMember`
or `requireOrgAdmin`). Since Decision 004, backend code is the only thing
keeping one customer's data away from another's.

### Making a decision
1. Check `decisions/` for prior decisions on similar topic
2. Check authority in `roles/role-registry.md`
3. Record decision in `decisions/{date}-{title}.md`
4. Update affected semantic artifacts

### Security/Privacy concerns
1. `security/data-minimization.md` — what data is stored
2. `security/threat-model.md` — what threats we handle
3. `security/privacy.md` — regulatory compliance

---

## Documents that do not exist yet

Named above and referenced elsewhere, but not written. Listed here so nobody
looks for them:

| Document | Owner | Needed by |
|----------|-------|-----------|
| `product/roadmap.md` | Product Owner | Not urgent — `PROJECT_STATE.md` carries the ordering |
| `product/segment-residential.md` | Residential Property Administration Consultant | Its first consultation (2026-09-04) is summarised inside `product/brief.md` and exists in no artifact of its own |
| `product/physical-security-advisory.md` | Physical Security Consultant | Same — consulted 2026-09-04 for the corporate half of Decision 010's segment, summarised in the brief only |
| `architecture/analytics.md` | Data Analyst | When the first real users arrive. Metric definitions, so "organizations created" is not mistaken for a sign of anything |
| `security/threat-model.md` | Security Engineer / CISO | Before real customer data arrives |
| `security/privacy.md` | Security Engineer / CISO (with legal review) | Before launch — legally required (Ley 1581/2016) |

`architecture/design.md` was written on 2026-08-26 and is no longer missing.

**Last updated:** 2026-09-04 (segunda vez)
