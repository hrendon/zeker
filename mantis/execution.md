# Execution Framework

Extension of the AI Software Development Operating Framework (`mantis.md`).

AI-assisted development can drift into building code that accumulates without anyone — human or AI — having a clear, current picture of what's actually built, why, or whether it's really done. This framework exists to prevent that drift: a concrete cycle for building one unit of work at a time, explicit tiers of what the AI may decide alone versus what it must ask about, and a single file that always answers "where are we, really."

---

# 1. Purpose and Relation to the Base Framework

This framework extends `mantis.md` and reuses its mechanisms: knowledge classification (FACT / DECISION / ASSUMPTION / PROPOSAL / UNKNOWN), the L1–L4 memory layers, the Session Lifecycle, and the Continuity Principle. It operationalizes the `IN_PROGRESS` state of `delivery-framework.md` §3 — the concrete "how" inside that one state, not a competing state machine. It sits underneath `roles.md`: role ownership (`roles.md` §2–§3) determines *who* reasons about a decision; the Autonomy Tiers defined here (Section 5) determine *whether the AI may act on it alone*, regardless of which role owns it.

Context of this project, fixed as DECISION:

* Work proceeds one unit at a time. The whole project is never implemented in a single uninterrupted pass.
* Every unit follows the same cycle (Section 4), without exception.
* The project's current, verifiable status lives in exactly one file: `PROJECT_STATE.md` (Section 9).
* The AI's authority to act unilaterally is explicit and tiered (Section 5) — never assumed by default.
* Product user interfaces default to Spanish (es) unless a project's context specifies otherwise. Where scope and audience justify it, prefer building in language-selection (i18n) support over hardcoding a single locale. This applies only to the shipped product's UI text — the framework's own files, AI reasoning, and developer-facing documentation stay in whatever language the project already uses for them (in this repository: English for `mantis.md`, `roles.md`, and `execution.md`; Spanish for `delivery-framework.md`).

---

# 2. The Four Layers

```text
PRODUCT
   ↓
SPECIFICATION
   ↓
IMPLEMENTATION
   ↓
VERIFICATION
```

This is not a new lifecycle competing with `mantis.md`'s `DISCOVER → DEFINE → DESIGN → PLAN → BUILD → VERIFY → RELEASE → OPERATE → LEARN` — it is a concrete lens on the `PLAN → BUILD → VERIFY` portion of it, applied per unit of work rather than once for the whole project.

* **Product** — not a new artifact. This is `brief.md` / `vision.md` / `requirements.md` / `roadmap.md`, owned by Product Owner (`roles.md`), made explicit as: what problem it solves, for whom, what the MVP is, what's explicitly out of scope, the primary flows, and what success means.
* **Specification** — user stories with acceptance criteria, derived from the Product layer, living in `requirements.md`. Owned by Product Owner / Business Analyst (`roles.md`).
* **Implementation** — the Unit Cycle (Section 4).
* **Verification** — the QA discipline already defined in `delivery-framework.md` §7, applied at unit scope through the feature-level Definition of Done (Section 6).

---

# 3. Working One Unit at a Time

A unit is one feature, one user story, or one bug fix — small enough to be fully understood, implemented, and verified before the next one starts. The AI does not implement several units in parallel within one pass, and does not start a new unit before the previous one's cycle (through Checkpoint) has closed.

This is the concrete shape of `delivery-framework.md` §3's `IN_PROGRESS` state and `mantis.md` §24's Implementation Protocol — not a second process alongside them.

---

# 4. The Unit Cycle

```text
Choose the unit
      ↓
Understand it
      ↓
Plan
      ↓
Implement
      ↓
Verify
      ↓
Update state
      ↓
Checkpoint
      ↓
Next unit
```

## 1. Choose the unit

Pick the next unit from `PROJECT_STATE.md`'s "Next" list or the roadmap. Never invent a new unit mid-cycle — introducing unrequested scope is a 🔴 Autonomy Tier action (Section 5).

## 2. Understand it

Read `PROJECT_STATE.md`, the relevant requirement/story, and the relevant existing code — before writing any code. This is the Context Resolution Protocol (`mantis.md` §7) applied at unit scope.

## 3. Plan

Propose an implementation plan and surface ambiguities *before* writing code. An unresolved ambiguity becomes either an explicit ASSUMPTION with accepted risk (`mantis.md` §3, §30) or a question — never a silent guess.

## 4. Implement

Follow `mantis.md` §24's Implementation Protocol and satisfy the standard of every active role whose scope the work touches (`roles.md` §5). If the unit is a bug fix, follow the Debugging Discipline (Section 7) instead of fixing on sight.

## 5. Verify

Run tests, check acceptance criteria, and apply the feature-level Definition of Done (Section 6).

For 🟡- or 🔴-tier work, verification runs through a role other than the one that implemented it (QA Engineer, Tech Lead — `roles.md`), mirroring `delivery-framework.md` §4's reviewer-distinct-from-author rule: no agent certifies its own consequential work. Where the Agent Framework is in use, that means a separate subagent call, not the implementing pass re-reading its own output.

## 6. Update state

Update `PROJECT_STATE.md`. This is not optional cleanup — "code complete does not automatically mean work complete" (`mantis.md` §31), and an unupdated `PROJECT_STATE.md` means the unit is not done.

## 7. Checkpoint

Run `mantis.md` §17's Checkpoint Protocol. If the unit that just closed was a significant feature, the checkpoint includes running the Audit Protocol (Section 8) before continuing.

## 8. Next unit

Return to step 1. Never begin implementing a new unit before the previous one's cycle has closed through Checkpoint.

### Mapped to a coding session

```text
Before writing code → steps 1-3: read PROJECT_STATE.md, read relevant
                       requirements, identify the unit, determine
                       dependencies, propose a plan, surface ambiguities

During               → step 4: implement, run tests, review errors,
                       check acceptance criteria as they're met

At the end           → steps 5-7: review the diff, run tests again,
                       update PROJECT_STATE.md, record significant
                       decisions, commit
```

---

# 5. Autonomy Tiers

What the AI may decide alone is explicit, not assumed. This is role-agnostic — it applies underneath whichever role (`roles.md`) would normally own the decision. Owning a concern determines who reasons about it; the tier below determines whether the AI may act on it without stopping.

## 🟢 High Autonomy

The AI decides directly and proceeds — no PROPOSAL loop required:

* variable and identifier naming
* internal component structure
* small refactors
* tests
* documentation
* local bug fixes
* implementing a feature that is already specified

## 🟡 Medium Autonomy

The AI proposes; the human approves. This is `mantis.md`'s existing PROPOSAL → DECISION mechanism (§3, §21) — every such proposal follows the standard proposal shape (`mantis.md` §3) and is raised in `PROJECT_STATE.md`'s Pending decisions queue (Section 9). These are the categories that always require it:

* architecture changes
* new dependencies
* schema changes
* significant UX changes
* API changes
* security decisions
* large refactors

## 🔴 Low Autonomy

The AI must not decide *or propose* without being explicitly asked — a hard stop, same in kind as `delivery-framework.md` §8's non-negotiable rules:

* changing product scope
* removing functionality
* redefining users
* changing the business model
* introducing functionality that wasn't requested
* changing a foundational architectural decision
* turning an MVP into something else

A 🟡- or 🔴-tier action still goes through the same human review gate at `delivery-framework.md` §4's `IN_REVIEW → MERGED` — the tiers tell the AI when to stop and ask *before* reaching that gate, they don't create a second approval mechanism.

## Model Tier (where subagents are used)

Where work is delegated to a real subagent (`.claude/agents/`, per the Agent Framework — see `README.md`) rather than reasoned about directly, the autonomy tier above is also a reasonable default for which model strength that subagent runs on — cost and stakes move together:

* 🟢 High Autonomy work — bounded, well-specified, low-consequence — is a good fit for the cheapest capable model tier. Most subagent calls fall here: a role-agent producing one scoped brief, a copy pass, a layout pass.
* 🟡 Medium and 🔴 Low Autonomy work — anything that would otherwise need a PROPOSAL or a hard stop — stays on the strongest model tier available, regardless of cost. The tier exists because getting it wrong is expensive in a way token cost isn't.

This is a default, not a rule with the force of the tiers themselves: a project may still choose a stronger model for a 🟢-tier step whose output quality matters more than its cost (e.g. the final synthesis/implementation step that combines several subagents' output), or a cheaper one for a 🟡-tier draft a human will review anyway before it takes effect. Set the subagent's `model` frontmatter field accordingly; leaving it unset inherits the orchestrating session's model.

---

# 6. Feature-Level Definition of Done

The per-unit operationalization of `mantis.md` §31's Definition of Done — not a replacement for it:

```text
[ ] Implemented
[ ] Works
[ ] Meets acceptance criteria
[ ] Handles errors
[ ] Has appropriate tests
[ ] UX verified
[ ] Interface language follows the project default, or the language switcher (§1)
[ ] Does not break existing functionality
[ ] Documentation updated
[ ] Project state updated
```

---

# 7. Debugging Discipline

A bug is not fixed on sight. The AI does not jump straight to a patch:

```text
Symptom
   ↓
Root cause
   ↓
Affected components
   ↓
Proposed solution
   ↓
Risks
   ↓
Implementation
```

This supplements `mantis.md` §24's Implementation Protocol specifically for defects — a fix proposed before the root cause is identified is a guess, not a fix.

---

# 8. The Audit Protocol

Triggered after a significant unit or feature completes, before the next one starts:

```text
Audit the current state of the project. Do not modify code. Compare the
real state of the repository against PROJECT_STATE.md, the requirements,
and the architecture. Identify inconsistencies, incomplete functionality,
technical debt, known bugs, and decisions that have changed. Do not
propose new functionality.
```

This is distinct from `mantis.md` §17 Checkpoint (which consolidates *and continues* work) and §18 Session Close (which ends the session): the Audit is narrower, touches no code, and is gated specifically to "a feature just finished" rather than to session boundaries. Its findings feed `PROJECT_STATE.md`'s "Known issues" section and the next Checkpoint.

---

# 9. PROJECT_STATE.md — Single Source of Current Status

`PROJECT_STATE.md` replaces the fragmented `working/current-objective.md` / `sprint.md` / `bugs.md` / `todo.md` as the canonical L4 artifact — one file, always current, instead of several scattered ones. `working/` may still hold overflow detail (e.g. a long-running bug backlog) that this file only summarizes, but `PROJECT_STATE.md` is the canonical snapshot. It is the first thing read at Session Start (`mantis.md` §16.3) and is written at Unit Cycle step 6 and at Session Close.

**Loading `execution.md` does not create `PROJECT_STATE.md`.** The same rule `roles.md` §9 established for role activation applies here: if `execution.md` is loaded but `PROJECT_STATE.md` does not exist, the first time the Unit Cycle is about to reference it (Section 4, step 1) is a trigger, not a detail to skip — bootstrap it first. Infer what evidence already supports (completed work from git history and code, known issues from open bugs) and confirm the rest, following `mantis.md` §13's Project Discovery Protocol. Reasoning about "what's next" without a real `PROJECT_STATE.md` behind it is the same failure this whole framework exists to prevent.

```markdown
# Project State

## Current milestone
MVP — Core workflow

## Current status
🟡 In development

## Completed
- Authentication
- User onboarding
- Project creation

## In progress
- Project dashboard

## Next
- Project editing
- Project deletion

## Known issues
- Dashboard loading state
- Mobile navigation

## Pending decisions
- D-007 — Database strategy
  Options: A) PostgreSQL  B) DynamoDB
  Recommendation: A — relational transactions are central to the domain
  Cost impact: low · Reversibility: medium
  Waiting since: 2026-08-12

## Technical decisions
- PostgreSQL
- Next.js
- API routes
- Auth provider X

## Explicitly out of scope
- Billing
- Team permissions
- Mobile app

## Last verified
2026-08-12
```

"Technical decisions" is a live summary, not a duplicate source — full rationale still lives in `decisions/` (`mantis.md` §21); this section just lists what's currently active.

**"Pending decisions" is the single queue of everything waiting on the human.** One card per decision: the options, a labeled recommendation, cost impact, reversibility, and how long it has been waiting. Every 🟡/🔴 approval request is raised here — never only scattered through conversation, where it competes with everything else for attention and is lost when the session ends. Answering a card is all the human has to do; a resolved card becomes a record in `decisions/` and leaves the queue. The queue empty means: nothing is blocked on you.

Progress is tracked per feature group, not just as a single percentage:

```text
MVP

12 features required

████████░░░░  8/12 complete

Core workflow:
██████████ 100%

Onboarding:
██████████ 100%

Dashboard:
██████░░░░ 60%

Billing:
░░░░░░░░░░ 0%
```

"Last verified" must reflect the date of an actual Audit (Section 8), not just the date the file was last edited — consistent with `mantis.md`'s rule to never claim verification that did not occur (§27, §33).

---

# 10. Anti-Scope-Creep Rule

Do not add functionality while existing functionality is not yet fully understood and verified. This is the 🔴 tier's "introducing functionality that wasn't requested" made explicit as a standing rule, consistent with `mantis.md` §33's existing "never treat roadmap ideas as requirements."

---

# 11. The Full Sequence

The Unit Cycle (Section 4), viewed end to end:

```text
PRODUCT VISION
      ↓
ROADMAP / MVP
      ↓
SPECIFICATION
      ↓
AI IMPLEMENTS
      ↓
VERIFICATION
      ↓
PROJECT STATE
      ↓
CHECKPOINT
      ↓
NEXT UNIT
```

---

# 12. Canonical Artifacts This Framework Adds

* `execution.md` — this file (L1): the execution protocol.
* `PROJECT_STATE.md` — project-specific (L4, canonical): current status, superseding the fragmented `working/` file set where adopted.

---

# 13. Continuity

Extends the base framework's Continuity Principle (`mantis.md` §34). From `PROJECT_STATE.md` alone, without the conversation that produced it, it should be possible to determine how much of the product is verifiably done, what's next, what's explicitly out of scope, and when that state was last actually checked against reality rather than assumed.
