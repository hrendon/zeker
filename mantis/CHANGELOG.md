# Changelog

Notable changes to the Mantis framework, most recent first. The current version is stated at the top of `mantis/mantis.md`. An adopting project can diff its vendored `mantis/` against `upstream/main` at any time to see what changed since it last updated.

## 1.1.0 — 2026-08-31

- Split the root `CLAUDE.md` into a project-owned pointer plus a new framework-owned `mantis/orientation.md`. The framework's own activation and orientation instructions now live in `orientation.md` and update automatically; `CLAUDE.md` is never touched by a framework update again.
- Installation: documented why nesting this repo as a subdirectory silently breaks on a fresh clone (git stores a nested repo as an unresolvable gitlink, not files, with no `.gitmodules` entry to recover it from); confirmed `.claude/` checkout is additive-safe for a project that already has its own skills or `settings.local.json`.
- Updating an existing adoption: `git checkout upstream/main -- mantis/ .claude/` — no longer includes `CLAUDE.md`.

## 1.0.0 — 2026-08-31

- Added the AI-native company operating model (`mantis.md` §1.1) and revenue-first / launch-fast behavioral rules.
- Added the Independent Audit role category (`roles.md`): Interface & Experience Auditor, Decision & Outcomes Auditor; wired into the G5 launch gate and the customer-facing-UI merge gate.
- `preferences.md`: default communication language switched to plain Spanish.
