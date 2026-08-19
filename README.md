# Zeker — Access Management Platform

A SaaS platform for managing authorizations, identity, and access traceability in physical spaces across Latin America.

**Problem:** Organizations (residences, schools, daycares, offices) need to control who enters, when, for what purpose, and what they can do inside.

**Solution:** A multi-tenant platform where authorized users create time-bound, location-specific access permits via QR codes or numeric codes. Security personnel validate instantly. Complete audit trail.

**Status:** MVP in development (Camino B — code first, freemium validation)

---

## Quick Start

```bash
# Backend: Node.js + Express + Firestore
npm install
npm run dev

# Frontend: Next.js + React + PWA
cd frontend
npm install
npm run dev
```

**Deploy:**
```bash
gcloud run deploy zeker-api --source .
vercel deploy
```

---

## Docs

- `docs/context-index.md` — Document map
- `docs/product/brief.md` — What we build
- `docs/architecture/architecture.md` — Tech stack & decisions
- `docs/security/data-minimization.md` — What data we store
- `PROJECT_STATE.md` — Current progress
