# Changelog

Notable changes to the Mantis framework, most recent first. The current version is stated at the top of `mantis/mantis.md`. An adopting project can diff its vendored `mantis/` against `upstream/main` at any time to see what changed since it last updated.

## 1.8.0 — 2026-08-31

- New framework file `mantis/meetings.md`: a meeting cadence framework. Twenty-three meetings across eight cadences (daily → annual), each with attending roles named from `roles.md`, the artifacts it must read first, and what it must produce.
- Defined the standard meeting contract — eight output types (decision, action, finding, risk, escalated blocker, parked topic, agreement, alignment) and a routing table sending each to its canonical home, so meetings feed the artifacts that already exist rather than creating a parallel record system. Meeting records (`docs/meetings/YYYY-MM-DD-<slug>.md`) are episodic L3; durable knowledge is promoted out of them per `mantis.md` §10.
- Made cadence mechanical rather than aspirational, per §33's own rule: `mantis.md` §16.5 (Session Start) now raises overdue meetings, a declined meeting is recorded as skipped, and a pattern of skips is a Founder-Facing Audit finding.
- Reconciled with `lifecycle-gates.md` §6 ("most gates are not meetings") rather than contradicting it: convening role-lenses is cheap in an AI-native company, the founder's attention is not — so meetings run and produce records, but route to the human only 🔴 decisions, escalations, and audit findings.
- Honest dormancy: all-hands, offsite, climate survey, board meeting, and performance cycles are never simulated for a one-person company. Where a function has a real AI-native substitute (all-hands → the Continuity Principle) the framework names it; where it does not (offsite, board accountability), it says so plainly instead of pretending coverage.
- Added `risks.md`, the risk register — closing a gap the Founder-Facing Audit Duty already assumed existed ("what exposure is accumulating that no one has decided to accept" had no register to accumulate in). Same ownership shape as `indicators.md`: each role owns its own entries.
- `docs/meetings/` added to the allowed domain folders in the artifact-placement rule (`mantis.md` §20, `orientation.md`), which otherwise would have contradicted where meeting records go.

## 1.7.0 — 2026-08-31

- User validated a 14-role "who brings in money / manages money / builds the product / runs operations" list against the catalog. 9 of 14 already matched exactly (Founder/CEO, Account Executive, CMO, Customer Success Manager, CFO, Bookkeeper/Accountant, UI/UX Designer, COO, HR/People Manager + Recruiter). 5 were real roles under different, common titles the catalog didn't name — fixed by adding aliases/scope, not new roles, per the Role Creation Protocol's naming-mismatch check:
  - Product Owner / Product Manager → added **(CPO)**.
  - Software Architect → added **(CTO)**, with a boundary note for when a project outgrows the merged form.
  - Chief Commercial Officer → added **CRO** and **Head of Growth** aliases; mission reworded to "owns the revenue number."
  - Partnerships Manager → added **Business Development** alias; scope broadened to explicitly include licensing and new-market channel entry, which weren't named before.
  - General Counsel → **intellectual property** (trademarks, copyright, trade secrets, patent strategy) added explicitly to scope; it existed only implicitly under "corporate risk management" before.

## 1.6.1 — 2026-08-31

- Fix (found in post-change validation): the instructional paragraph about when to omit the Indicators section had been placed *inside* `PROJECT_STATE.md`'s template code block (`execution.md` §9), so copying the template would copy meta-instructions into a real status file. Moved the rule into the prose below the template, where the section's other guidance already lives; the template now holds only example lines.

## 1.6.0 — 2026-08-31

- Landing page now has an explicit lifecycle trigger, in two moments: as a validation instrument at Stage 2.3 (Customer validation — before committing to a full prototype, a page with a real call-to-action produces stronger evidence than opinions) and as the required public GTM asset at Stage 3.5 (Initial launch, G5) — "publicly available" now explicitly includes it, not just the product. Customer Discovery & Validation Advisor's scope names it as the standard low-cost instrument.
- Added a "Go-to-Market" category to `mantis.md` §19's canonical artifact list (`landing-page.md`, `messaging.md`, `marketing-plan.md`, `content-calendar.md`) — these were owned by roles in `roles.md` but never appeared in the master artifact list.
- Root-cause fix, not just this instance: added a rule to `mantis.md` §33 (Always/Never) that a role's scope, or a principle stated in §1.1, does not by itself cause proactive action — it must be paired with a concrete trigger (an Interview Protocol category, a `lifecycle-gates.md` substage, or an Autonomy Tier rule). This is why the Budget Gate and the landing-page substages needed adding even though the relevant roles' scope already implied both — scope is authority, not a trigger.

## 1.5.0 — 2026-08-31

- The framework now actually asks about budget. Added a "Budget" category to the Interview Protocol (`mantis.md` §14: spending ceiling, per-category limits, approval threshold, review cadence) and to Project Discovery (§13).
- Added the Budget Gate (`execution.md` §5): introducing a tool/service/dependency with a recurring or usage-based cost is 🟡 by default (propose it, state the cost, check it against `budget.md`); if `budget.md` has no ceiling defined yet, it's a 🔴 hard stop — ask the human first, instead of proceeding silently.
- No new role: extended FP&A Manager (aggregate spend monitoring and alerting against `budget.md`), DevOps Engineer (reports infrastructure/usage-based cost), and Procurement / Vendor Manager (reports subscription/contract cost) — each already owned the adjacent concern. FP&A Manager's activation trigger clarified: spend alone activates it, not only revenue.
- Budget/spend vs. ceiling is now a first-class Business indicator in `indicators.md`, reviewed on the same recurring cadence (Checkpoint, gates) as every other indicator — this is what makes the alert actually recurring instead of a one-time question.

## 1.4.0 — 2026-08-31

- Added two roles for products that process payments or subscriptions: Payment / Fintech Specialist (Engineering — payment methods, processors, PSP quirks, interchange/fees) and Risk & Fraud Analyst (Security & Compliance — fraud scoring, chargebacks, dispute response). Both activate only once the product actually processes payments.
- Extended Bookkeeper / Accountant's scope to cover settlement reconciliation, gateway fees, and multi-currency handling where the product processes payments directly — checked first for a naming-mismatch fix (`roles.md` §6) before considering a new role, per the Role Creation Protocol.
- Compliance Officer's example list now names PCI DSS explicitly; Regulatory & Data Privacy Counsel's FinTech scope now names AML/KYC and payments regulation explicitly. Both were already covered by the existing scope — this just makes it visible rather than implicit.

## 1.3.0 — 2026-08-31

- Independent Audit roles now activate early by default, reversing the previous guidance. Interface & Experience Auditor activates at the first internally testable build (Stage 3.3, Internal validation) instead of waiting for real customers/launch (Stage 3.5) — a finding is cheapest to act on before customers see it and before more gets built on top of it, not after. Decision & Outcomes Auditor activates from the company's first recorded strategic decision (Stage 1) instead of waiting for decision volume or revenue. Added to Stage 3.3's substage table accordingly.
- `indicators.md` broadened beyond business/revenue metrics to four kinds: business, management, process, and operational/results — each owned by whichever role's scope it falls under. A pre-revenue project can have real management/process entries and no business ones yet; that's expected, not a gap. `PROJECT_STATE.md`'s Indicators example now shows all four kinds.

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
