# Changelog

Notable changes to the Mantis framework, most recent first. The current version is stated at the top of `mantis/mantis.md`. An adopting project can diff its vendored `mantis/` against `upstream/main` at any time to see what changed since it last updated.

## 1.2.0 — 2026-08-31

- Added `indicators.md` (`roles.md` §10): a live, per-role indicator scoreboard (target, current value, status), owned by each role for its own entry. Turns the existing per-decision audit into an actual internal-control framework rather than isolated after-the-fact checks.
- Broadened Decision & Outcomes Auditor's mission to cover both per-decision audits (unchanged) and recurring review of `indicators.md`, flagging stale/missing/off-target entries — reviewed at every Checkpoint (`mantis.md` §17) and every gate (`lifecycle-gates.md` §5). Deliberately did not add a third audit role: the two checks share the same predicted-vs-actual spirit and, in a one-person AI-native company, the same "hands."
- `PROJECT_STATE.md` template gains an "Indicators" section mirroring `indicators.md`'s current line, so status is visible without opening a second file. Omitted until there is a real indicator worth tracking — never filled with invented numbers.
- Founder-Facing Audit Duty gains one line: is `indicators.md` actually current, or is a target being assumed met because nobody checked.

## 1.1.0 — 2026-08-31

- Split the root `CLAUDE.md` into a project-owned pointer plus a new framework-owned `mantis/orientation.md`. The framework's own activation and orientation instructions now live in `orientation.md` and update automatically; `CLAUDE.md` is never touched by a framework update again.
- Installation: documented why nesting this repo as a subdirectory silently breaks on a fresh clone (git stores a nested repo as an unresolvable gitlink, not files, with no `.gitmodules` entry to recover it from); confirmed `.claude/` checkout is additive-safe for a project that already has its own skills or `settings.local.json`.
- Updating an existing adoption: `git checkout upstream/main -- mantis/ .claude/` — no longer includes `CLAUDE.md`.

## 1.0.0 — 2026-08-31

- Added the AI-native company operating model (`mantis.md` §1.1) and revenue-first / launch-fast behavioral rules.
- Added the Independent Audit role category (`roles.md`): Interface & Experience Auditor, Decision & Outcomes Auditor; wired into the G5 launch gate and the customer-facing-UI merge gate.
- `preferences.md`: default communication language switched to plain Spanish.
