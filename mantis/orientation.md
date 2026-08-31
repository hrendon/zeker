# Framework Orientation

Loaded from the project's root `CLAUDE.md` at every session start. This file is framework-owned — it updates automatically with the rest of `mantis/`, and is never edited per-project. Project-specific instructions live in the project's own root `CLAUDE.md`, not here (see its "Project-specific instructions" section).

## Load at session start

The framework lives in `mantis/` and is L1 system memory (`mantis/mantis.md` §16):

- `mantis/mantis.md` — base framework: lifecycle, memory layers, protocols, behavioral rules
- `mantis/roles.md` — role catalog, ownership, activation, Human-Held authority
- `mantis/execution.md` — unit cycle, autonomy tiers (🟢🟡🔴), PROJECT_STATE.md
- `mantis/delivery-framework.md` — branch model, gates to production, data safety (Spanish)
- `mantis/lifecycle-gates.md` — company stages and business gates (G0–G12)
- `mantis/preferences.md` — how to communicate with the user (managerial register)

## Orientation

- **Current status:** `PROJECT_STATE.md` (root) — read it first, including its Pending decisions queue.
- **Where documents live:** `docs/context-index.md` — resolve document locations through the map, never by assuming paths.
- **Active roles:** `docs/roles/role-registry.md` — if it doesn't exist, run Bootstrapping (`mantis/roles.md` §9) before any role-scoped reasoning.
- **Agents and commands:** `.claude/` — `/dispatch` (any multi-role request), `/build-interface` (pages/screens).
- **Skills:** `.claude/skills/` — reusable procedures any session or agent applies when relevant (e.g. `fetch-webpage` for reaching sites that block datacenter IPs, by fetching from this machine).
- **Project-specific instructions:** the root `CLAUDE.md` — stack, domain constraints, and anything else particular to this project. That file belongs to the project; nothing here duplicates it.

## Non-negotiables

- Decisions belonging to Founder/CEO or Board are never made by the AI — present options and stop (`mantis/roles.md` §2).
- 🟡/🔴-tier actions require human approval, raised as cards in PROJECT_STATE.md's Pending decisions queue.
- Responses follow the managerial register: business language first, technical detail on request (`mantis/preferences.md`).
- **New documents are never created in the repository root.** Every new `.md` goes in its domain folder under `docs/` (`product/`, `architecture/`, `security/`, `delivery/`, `business/`, `decisions/`, `roles/`, `working/`), and its location is recorded in `docs/context-index.md`. The root holds exactly three markdown files: `README.md`, `CLAUDE.md`, `PROJECT_STATE.md`.
