# CLAUDE.md — Zeker Project

This project uses the **Mantis AI Software Development Operating Framework**, checked out at `mantis/` inside this repository.

## Load at session start

The framework files live one level down, in `mantis/mantis/` — `mantis/` is the
framework's own repository and `mantis/mantis/` is its content directory:

- `mantis/mantis/mantis.md` — base framework
- `mantis/mantis/roles.md` — role catalog & activation
- `mantis/mantis/execution.md` — unit cycle & autonomy tiers
- `mantis/mantis/delivery-framework.md` — branch model, gates to production (Spanish)
- `mantis/mantis/lifecycle-gates.md` — company stages and business gates
- `mantis/mantis/preferences.md` — communication defaults (managerial register, Spanish UI default)

`mantis/CLAUDE.md` is the framework's own orientation file and is worth reading too.

**In this session:** Camino B (build first, validate after) with freemium GCP strategy.

## Non-negotiables for this project

- Data minimization: never store ID documents, photos, biometrics
- Encryption: sensitive data encrypted at rest (GCP KMS)
- Multi-tenant: every org isolated from day 1
- Multi-admin per org: one user can manage multiple organizations
- Privacy: comply with Ley 1581/2016 (Colombia), GDPR-adjacent in other markets
- Stack: GCP free tier, Vercel, Firestore, Firebase Auth, Next.js PWA

## Structure

- `docs/` — all project documentation
  - `product/` — brief, vision, requirements
  - `architecture/` — technical decisions, data model, API
  - `security/` — data minimization, threat model, privacy
  - `decisions/` — decisions log
  - `roles/` — role registry
- `PROJECT_STATE.md` — current progress & next steps
- Backend code (Node/Express) — to be created
- Frontend code (Next.js + React) — to be created

## Active roles

See `docs/roles/role-registry.md`

## Orientation

Read `PROJECT_STATE.md` first for current status and what's next.
