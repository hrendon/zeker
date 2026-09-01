# Decision 013 — Which meetings Zeker actually holds, and which are dormant

**Status:** ✅ Accepted
**Date:** 2026-09-01
**Deciders:** Founder ("corre las reuniones que debemos tener al momento")
**Owning role:** Project Manager / Scrum Master (unfilled — the session convenes)
**Framework basis:** `mantis/meetings.md` §5, which requires that a merge be
recorded as a decision naming which meetings it absorbs, "so a later session can
tell a deliberate merge from a cadence that silently decayed"

---

## Context

Framework version 1.8.0, adopted today, added a meeting cadence: 23 meetings across
8 cadences. Zeker had held none of them, and `docs/meetings/` did not exist.

They were not skipped. **The cadence had never been adopted** — which is a different
thing, and the honest starting point.

Zeker is at Stage 3 (MVP built and deployed, zero customers, real infrastructure
spend inside free tiers), with one human and fifteen AI-embodied roles.

## Decision

### Held, merged into two occurrences

**1. Revisión Semanal Zeker** — absorbs six catalog meetings:
- Daily stand-up (which `meetings.md` itself says *is* Session Start, not a second
  ceremony — its one added rule, that a blocker surfaces the day it is found, is
  kept)
- Project sync
- Leadership weekly
- Area weeklies
- Incident / on-call review
- Sprint planning and retrospective

**2. Revisión Mensual de Negocio + Comité de Gasto** — absorbs two:
- Monthly business review (MBR)
- Spend / investment committee

Both paths to the Budget Gate are deliberately kept: the per-request gate stops an
individual cost-incurring decision the moment it arises; this meeting reviews the
accumulated picture.

### Dormant, and never simulated

| Meeting | Why |
|---|---|
| All-hands | One person. Its function — everyone understands where the company is going — is served by `PROJECT_STATE.md` and `indicators.md` being current, readable by any session without a broadcast. Activates the moment there is a second person |
| 1:1 with a human report | No reports. The AI-role version is exercised inside the two meetings above, as the Founder-Facing Audit Duty |
| Pipeline review | No pipeline, no prospects, no revenue |
| Board meeting | No outside investors or directors. **A founder does not hold a board meeting with themselves.** The accountability a board provides is partially supplied by the Independent Audit roles — which is a **weaker** substitute, and naming it as weaker is more useful than pretending the function is covered |
| Shareholders assembly | No separate legal entity, no shareholders beyond the Founder |
| Performance check-in, performance & compensation | No employees |
| Climate survey | One person. **A solo founder scoring their own engagement survey is theater.** The honest analog is whether the operator's working pattern is sustainable and whether the company depends on one person's continuous availability with no fallback — asked at the strategy review instead, and now partly captured as risk R-15 |
| Team offsite | No team, and **no AI analog.** Its purpose is trust between people who work together. This row stays empty until there is a second person, rather than being reinterpreted into something it is not |
| Shift open / close | No shift boundary. A solo operator runs Session Start and Session Close |
| QBR, OKR planning, strategy review, annual planning, annual budget | Not yet due — the company is 13 days old. `budget.md` already carries the ceiling the annual budget would produce |

## Cadence

- **Weekly review:** every session that opens a week, or whenever a unit closes —
  whichever is first.
- **MBR + spend committee:** monthly, and additionally whenever a Budget Gate item
  arises that the per-request gate cannot settle alone.
- **Overdue meetings are raised at Session Start**, most overdue first. They are not
  run automatically.
- **A declined meeting is recorded as skipped, with the date.** A cadence that
  quietly stops is indistinguishable from one that was never adopted. A pattern of
  skips is a Founder-Facing Audit finding.
- **A meeting whose outputs are empty still produces a one-line record.** That is
  what makes "nothing is wrong" distinguishable from "nobody looked."

## Why merged rather than held separately

`lifecycle-gates.md` §6 warns that ceremony kills gated processes. That warning
stands. The resolution the framework gives is that **convening AI roles is cheap;
the Founder's attention is not.** So the meetings run and produce records, and route
to the human only what genuinely needs one: decisions at the Founder's authority,
escalated blockers, and audit findings.

Held separately, these eight meetings would produce eight records covering largely
the same evidence — the waste §6 warns about. Merged, they produce two.

## Consequences

- `docs/meetings/` now exists and holds the first two records.
- `docs/business/risks.md` and `docs/business/indicators.md` were created because
  the first occurrence had outputs with nowhere to route. Both were canonical
  artifacts the framework already assumed existed.
- Two roles were activated and one registry rule was corrected — see
  `docs/roles/role-registry.md`.
- **The first occurrence found more than expected**, which is itself evidence the
  cadence was worth adopting rather than ceremony: a 13-day gap with no finance
  role, a re-opened audit finding, an unverified billing alert, and a potential
  100,000 COP/month trap behind a 3,480 COP/month purchase.

## Predicted outcome & indicator

**Predicted:** by the October MBR, both meetings have run on cadence and each has
produced at least one item that no other process would have surfaced. If instead the
records restate `PROJECT_STATE.md` back to itself, the cadence has become ceremony
and should be cut.

**Indicator:** items per occurrence that were not already known — recorded in each
meeting record. **Reviewable from:** the October MBR.
