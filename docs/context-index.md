# Context Index

Map of authoritative sources for project knowledge.

| Domain | File | Purpose | Owner |
|--------|------|---------|-------|
| **Product** | | | |
| Vision & problem | `product/brief.md` | Problem statement, users, MVP scope, what we don't do | Product Owner |
| Requirements | `product/requirements.md` | User stories, acceptance criteria | Product Owner |
| Roadmap | `product/roadmap.md` | MVP, Phase 2, Phase 3 | Product Owner |
| **Architecture** | | | |
| Technical decisions | `architecture/architecture.md` | Stack, deployment, multi-tenant design | Software Architect |
| Data model | `architecture/data-model.md` | Firestore collections, schema, constraints | Software Architect |
| APIs | `architecture/api.md` | Endpoints, request/response, authentication | Software Architect |
| Design (UX/UI) | `architecture/design.md` | Wireframes, three experiences, PWA specs | UI/UX Designer |
| **Security** | | | |
| Data minimization | `security/data-minimization.md` | What we store, what we never store, minimization rules | Security Engineer |
| Threat model | `security/threat-model.md` | Threats, mitigations, assumptions | Security Engineer |
| Privacy policy | `security/privacy.md` | LSPDP/GDPR compliance, consent, retention | Security Engineer |
| **Decisions** | | | |
| Decision log | `decisions/` | Significant decisions with context & rationale | All roles |
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
1. Check `product/requirements.md` for user story
2. Check `architecture/data-model.md` for data structure
3. Check `architecture/api.md` for endpoint contract
4. Check `security/data-minimization.md` for data handling rules
5. Check `architecture/design.md` for UX spec

### Making a decision
1. Check `decisions/` for prior decisions on similar topic
2. Check authority in `roles/role-registry.md`
3. Record decision in `decisions/{date}-{title}.md`
4. Update affected semantic artifacts

### Security/Privacy concerns
1. `security/data-minimization.md` — what data is stored
2. `security/threat-model.md` — what threats we handle
3. `security/privacy.md` — regulatory compliance
