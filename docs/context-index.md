# Context Index

Map of authoritative sources for project knowledge.

| Domain | File | Purpose | Owner |
|--------|------|---------|-------|
| **Product** | | | |
| Vision & problem | `product/brief.md` | Problem statement, users, MVP scope, what we don't do | Product Owner |
| Requirements | `product/requirements.md` | User stories, acceptance criteria | Product Owner |
| Roadmap | ⛔ not written | MVP / Phase 2 / Phase 3 currently live in `../PROJECT_STATE.md` under "Next" | Product Owner |
| **Architecture** | | | |
| Technical decisions | `architecture/architecture.md` | Stack, deployment, multi-tenant design | Software Architect |
| Data model | `architecture/data-model.md` | Firestore collections, schema, constraints | Software Architect |
| APIs | `architecture/api.md` | Endpoints, request/response, authentication | Software Architect |
| Design (UX/UI) | `architecture/design.md` | Layout, language, components, accessibility, and the setup flow. The responsable and security experiences are still to be designed | UI/UX Designer |
| Metrics | ⛔ not written | Metric definitions and what each one actually measures | Data Analyst |
| Customer evidence | ⛔ not written | What was assumed, what was tested, what was learned | Customer Discovery & Validation Advisor |
| Developer guide | `architecture/developer-guide.md` | How to run, test, and deploy the code | Backend Developer |
| **Security** | | | |
| Data minimization | `security/data-minimization.md` | What we store, what we never store, minimization rules | Security Engineer |
| Threat model | ⛔ not written | Threats, mitigations, assumptions | Security Engineer |
| Privacy policy | ⛔ not written | Ley 1581/2016 compliance, consent, retention. Required before launch | Security Engineer |
| Database access rules | `../firestore.rules` | The Firestore rules actually deployed (clients denied; backend-only) | Security Engineer |
| **Decisions** | | | |
| Decision log | `decisions/` | Significant decisions with context & rationale | All roles |
| — 001 | `decisions/001-freemium-gcp-stack.md` | Freemium model + GCP stack | Commercial + Architect |
| — 002 | `decisions/002-client-side-firebase-auth.md` | How users sign in; the API never sees a password | Architect + Security |
| — 003 | `decisions/003-interiors-and-plan-quotas.md` | Interiors as a real level; plan-based limits | Architect + Product Owner |
| — 004 | `decisions/004-backend-only-firestore-access.md` | Clients denied direct database access | Security |
| — 005 | `decisions/005-no-visitor-phone-number.md` | A permit stores no phone number; nothing needs KMS encryption | Security + Product Owner |
| — 006 | `decisions/006-members-and-responsable-accounts.md` | A responsable is an account created by the administrator | Product Owner + Architect + Security |
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
| `product/customer-discovery.md` | Customer Discovery & Validation Advisor | **Now.** The hypothesis and evidence log. Nine days of building, zero customer conversations, and nowhere to record what is learned when they start |
| `architecture/analytics.md` | Data Analyst | When the first real users arrive. Metric definitions, so "organizations created" is not mistaken for a sign of anything |
| `security/threat-model.md` | Security Engineer / CISO | Before real customer data arrives |
| `security/privacy.md` | Security Engineer / CISO (with legal review) | Before launch — legally required (Ley 1581/2016) |

`architecture/design.md` was written on 2026-08-26 and is no longer missing.

**Last updated:** 2026-08-27
