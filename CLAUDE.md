# CLAUDE.md — Zeker Project

This project uses the **Mantis AI Software Development Operating Framework** (in `../mantis/`).

## Load at session start

The framework lives in the parent folder and is loaded automatically by CLAUDE.md in this project:

- `../mantis/mantis.md` — base framework
- `../mantis/roles.md` — role catalog & activation
- `../mantis/execution.md` — unit cycle & autonomy tiers
- `../mantis/preferences.md` — communication defaults (managerial register, Spanish UI default)

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
