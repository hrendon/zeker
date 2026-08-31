# CLAUDE.md — Zeker Project

This project uses the **Mantis AI Software Development Operating Framework**.

Load `mantis/orientation.md` at session start — it activates the framework and points to everything else. That file is framework-owned and updates automatically with the rest of `mantis/`; this file does not, and never will as part of a framework update.

## Project-specific instructions

**In this session:** Camino B (build first, validate after) with freemium GCP strategy.

### Non-negotiables for this project

- Data minimization: never store ID documents, photos, biometrics
- Encryption: sensitive data encrypted at rest (GCP KMS)
- Multi-tenant: every org isolated from day 1
- Multi-admin per org: one user can manage multiple organizations
- Privacy: comply with Ley 1581/2016 (Colombia), GDPR-adjacent in other markets
- Stack: GCP free tier, Vercel, Firestore, Firebase Auth, Next.js PWA

### Structure

- `docs/` — all project documentation
  - `product/` — brief, vision, requirements
  - `architecture/` — technical decisions, data model, API
  - `security/` — data minimization, threat model, privacy
  - `decisions/` — decisions log
  - `roles/` — role registry
- `PROJECT_STATE.md` — current progress & next steps
- `mantis/` — the framework, vendored (see "Updating the framework" below)
- Backend code (Node/Express) — to be created
- Frontend code (Next.js + React) — to be created

### Active roles

See `docs/roles/role-registry.md`

### Updating the framework

The framework is vendored into this repository: `mantis/` and the Mantis parts of
`.claude/` are framework-owned, everything else is project-owned. Update with:

```
git fetch upstream && git checkout upstream/main -- mantis/ .claude/
```

`upstream` is https://github.com/hrendon/mantis.git. The checkout writes only
upstream's paths, so it never touches this file, `docs/`, project code, or the
project's own skills and settings in `.claude/`. Review and commit like any change.

**Never edit files under `mantis/`** — an update overwrites them. Project-specific
deviations from the framework go in this file, or in `docs/decisions/`.
