# Meeting Framework

Extension of the AI Software Development Operating Framework (`mantis.md`).

`roles.md` defines who reasons about what. `lifecycle-gates.md` defines the business decisions that must be answered before a stage advances. `execution.md` defines the unit of work. None of them define the **recurring rhythm** at which roles actually convene, look at the same evidence together, and produce a record — so in practice a role's standard gets applied only when something happens to route work to it, never on a clock.

This framework adds that rhythm. Its purpose is that nothing waits for an accident to be noticed.

---

# 1. Purpose and Relation to the Base Framework

This framework extends `mantis.md` and reuses its mechanisms: knowledge classification (FACT / DECISION / ASSUMPTION / PROPOSAL / UNKNOWN), the L1–L4 memory layers, the Knowledge Promotion Protocol (§10), and the Continuity Principle. It reuses `roles.md` for who attends and for the Inter-Role Communication & Debate Protocol (§7) that governs how they disagree, and `execution.md` §9's `PROJECT_STATE.md` as the single place open work and pending human decisions live.

Context of this framework, fixed as DECISION:

* A meeting exists to produce a **record**, not a conversation. A meeting that produced no decision, action, finding, risk, escalation, or explicit "nothing changed" did not happen, regardless of how long it ran.
* Every meeting has a **fixed attendee list of named roles** (`roles.md` §4), a **fixed set of inputs it must read**, and a **fixed set of output types it must route** (Section 3). Improvised attendance is how a concern's owner stops being consulted.
* **Cadence is a trigger, not a suggestion.** A meeting nobody convenes is the same failure as a role whose scope covers something nobody ever routes to it (`mantis.md` §33) — Section 5 makes the cadence mechanical at Session Start.
* **A meeting requiring people who do not exist is not held, and never simulated.** A one-person company does not run an all-hands, a climate survey, or an offsite. Recording one that did not happen is fabricated evidence, prohibited by `mantis.md` §33 the same as a fabricated test result.

## Reconciling with "most gates are not meetings"

`lifecycle-gates.md` §6 warns that ceremony is what kills gated processes, and that most gates should collapse into a fast confirmation rather than a gathering. That warning stands, and this framework does not weaken it.

The resolution is that **the two frameworks are measuring different costs**. `lifecycle-gates.md` §6 is protecting *human* time: a gate that pulls five people into a room for an hour costs five hours, so it must earn them. In an AI-native company (`mantis.md` §1.1), the roles convened here are lenses the AI applies and subagents it calls — convening them costs minutes of model time, not a calendar. What stays expensive, and therefore stays rationed, is the founder's attention.

So both rules hold at once:

* **Convening is cheap; the founder's involvement is not.** A meeting runs, produces its record, and routes to the founder only what genuinely needs a human: 🔴-tier decisions, escalated blockers, and findings the Founder-Facing Audit Duty (`roles.md` §5) raises. Everything else is a written record the founder may read, not an interruption they must attend.
* **Ceremony is still the failure mode.** Meetings that produce records nobody reads, or that restate `PROJECT_STATE.md` back to itself, are exactly the waste §6 warns about. Section 5's proportionality rules exist to keep the cadence honest, and merging or dropping a meeting is a legitimate, recordable decision.

---

# 2. What a Meeting Is Here

A meeting is a **convened review**: a named set of roles, at a defined trigger, reading a defined set of evidence, producing a written record whose items are promoted to their canonical homes.

It is not a calendar event, and — outside of the meetings that genuinely involve other humans — it is not a synchronous conversation. Where the Agent Framework is in use (`README.md`), attendees are consulted as real subagents (`/dispatch`, `role-agent`) rather than as an internal impression of what they would say, exactly as `lifecycle-gates.md` §5 step 2 already requires at gates.

Three properties make a convened review different from simply doing the work:

1. **The evidence is read before the opinion is formed.** Section 3.1's inputs are not optional context; a meeting that skipped them is reasoning from memory, which is what the base framework's Context Resolution Protocol (`mantis.md` §7) exists to prevent.
2. **Disagreement is surfaced, not averaged.** Where attendees' conclusions conflict, the Inter-Role Communication & Debate Protocol (`roles.md` §7) applies in full, including preserving dissent that was overruled.
3. **Nothing leaves the room undocumented.** Every output is routed by Section 3.3, or it is explicitly parked with a named next occurrence. There is no third option.

---

# 3. The Standard Meeting Contract

Every meeting in Section 4, regardless of cadence, obeys this contract.

## 3.1 Inputs — what a meeting must read before it runs

1. **Its own previous record** (`docs/meetings/`) — specifically that record's open actions and parked topics. A meeting that does not check what it parked last time is how topics disappear permanently; this is the single most common way a cadence degrades into theater.
2. **`PROJECT_STATE.md`** (`execution.md` §9) — current status, open blockers, and the Pending decisions queue.
3. **`indicators.md`** (`roles.md` §10), for any meeting whose catalog entry names indicators — the current value and status of the entries in that meeting's scope, not a remembered version of them.
4. **The artifacts named in the meeting's catalog entry** (Section 4), resolved through `docs/context-index.md` (`mantis.md` §6), never by assuming paths.

Where an input does not exist yet, that absence is itself a finding (Section 3.2) — not a reason to proceed as though the information were known.

## 3.2 Outputs — the eight types

Every item produced in a meeting is exactly one of these. Classifying an item is what determines where it goes:

* **Decision** — a choice made, within some role's authority. Carries the owning role, the roles consulted, dissent, and (for strategic/administrative decisions) the Predicted Outcome & Indicator (`roles.md` §8).
* **Action / commitment** — something a named role will do, by a named date. An action without an owner and a date is a wish; record it as parked or drop it.
* **Finding** — something now known to be true that was not established before, including "the evidence for X does not exist."
* **Risk** — something that has not happened, could, and would cost something if it did. Distinct from a finding (already true) and from a blocker (already stopping work).
* **Escalated blocker** — work that is stopped and cannot be unstopped by the roles present.
* **Parked topic** — a real subject deliberately deferred, with the occurrence it returns at. Parking is legitimate; silently dropping is not.
* **Agreement** — a shared commitment between roles that is not a single decision or action (e.g. an interface contract between two roles' scopes, a working rule). Where an agreement constrains future work, it is promoted as a DECISION.
* **Alignment** — the shared understanding the meeting produced. This is the one output with no artifact of its own: it exists because the record exists and is current. If a meeting's only output is alignment, say so explicitly in the record — a meeting whose honest result is "nothing changed, everyone sees the same picture" is a valid outcome, and recording it as such is what distinguishes it from a meeting that produced nothing because nobody looked.

## 3.3 Routing — where each output goes

The meeting record is **episodic** (L3). The canonical home is **durable** (L2). Every item lands in both: written in the record, promoted to its home, per the Knowledge Promotion Protocol (`mantis.md` §10). The record links to the home; the home does not link back.

| Output | Canonical home | Who writes it |
|---|---|---|
| Decision (within a role's authority) | `decisions/` — with role attribution (`roles.md` §8) | the owning role |
| Decision (needs the human) | `PROJECT_STATE.md` → Pending decisions queue, one card (`execution.md` §9) | the role raising it |
| Action / commitment | `PROJECT_STATE.md` → In progress or Next, with owner and date | the committing role |
| Finding | the owning role's artifact — `interface-audit.md`, `decision-audit.md`, `analytics.md`, `security.md`, `user-research.md`, `customer-discovery.md`, … | the role that found it |
| Risk | `risks.md` (Section 6) | the role whose scope it falls in |
| Escalated blocker | `PROJECT_STATE.md` → Known issues, plus a Pending decisions card where a human call is what unblocks it | Project Manager / Scrum Master |
| Parked topic | the meeting record's own Parked section, carried into the next occurrence | the convening role |
| Agreement | the meeting record; promoted to `decisions/` where it constrains future work | the convening role |
| Alignment | the record itself — no separate artifact | — |
| Indicator movement | `indicators.md` (`roles.md` §10) | the indicator's owning role |

A meeting that produced items and routed none of them has not finished. This is the same rule `lifecycle-gates.md` §5 applies to gates, applied to cadence.

## 3.4 The meeting record

One file per occurrence, in `docs/meetings/`, named `YYYY-MM-DD-<meeting-slug>.md`:

```markdown
# Leadership Weekly — 2026-09-07

Convened by: COO
Attendees (roles): Founder/CEO, CCO/CRO, CMO, CFO, COO, Product Owner, Software Architect
Inputs read: previous record (2026-08-31), PROJECT_STATE.md, indicators.md, budget.md

## Decisions
- Hold paid acquisition spend flat through September — CCO/CRO owns.
  Consulted: CMO, CFO. Dissent: CMO (argues the channel is still improving).
  Predicted outcome: CAC stops rising by 2026-10-05. → decisions/ADR-014

## Actions
- Rebuild the checkout error-state copy — Content Strategist, by 2026-09-12. → PROJECT_STATE.md
- Pull last 60 days of gateway fees into the ledger — Bookkeeper, by 2026-09-09. → PROJECT_STATE.md

## Findings
- W4 retention is measured on signups, not on activated accounts; the 38% figure
  is not comparable to the 40% target. → analytics.md

## Risks
- Single payment processor with no fallback; an outage stops all revenue. → risks.md

## Escalated blockers
- Cannot verify tax treatment for cross-border subscriptions without a Tax Advisor.
  Needs the founder to decide whether to engage one. → PROJECT_STATE.md, Pending decisions

## Parked
- Pricing tier restructure — returns at the October MBR, needs a full quarter of data.

## Agreements
- Interface changes touching checkout go through Interface & Experience Auditor before
  merge, without exception, even for copy-only changes. → decisions/ADR-015

## Alignment
- Everyone is now working from the corrected retention definition, not the old one.
```

Sections with nothing in them are written as "None" rather than deleted — an empty Risks section states that risk was considered and none was raised, which is different from the section being absent because nobody looked.

---

# 4. Meeting Catalog

Attendees are named as they appear in `roles.md`'s catalog. **Attendees listed are the minimum**: apply `mantis.md` §7.1's decomposition — a meeting touching more concerns pulls in more roles, and any active role whose scope the agenda touches must be consulted (`roles.md` §5). Roles that are not active on the project (`roles/role-registry.md`) do not attend, and a meeting whose entire attendee list is inactive does not run.

🔴 marks a Human-Held attendee (`roles.md` §2) whose participation the AI never simulates.

## Daily

| Meeting | Attendees | Reads | Must produce |
|---|---|---|---|
| **Daily stand-up** | Project Manager / Scrum Master (convenes), every role with work In progress | `PROJECT_STATE.md` | Escalated blockers; updated In progress |
| **Shift open / close** | COO, Customer Support Agent, DevOps Engineer | `PROJECT_STATE.md`, `incident-log/`, `support-playbook.md` | Handover findings; escalated blockers |

**The stand-up is Session Start, not a second ceremony.** `mantis.md` §16's Session Start Protocol already reconstructs what was done, what is next, and what is blocked — that *is* the stand-up's three questions, already mechanized. Do not hold and record a separate daily meeting on top of it; record the stand-up's outputs through the Session Start path (`PROJECT_STATE.md`), and write a `docs/meetings/` record only when the day produced something the state file does not capture. The one rule the stand-up adds: **a blocker surfaces the same day it is found, not at the next weekly** — that is the whole point of a daily cadence, and it is the only reason this row exists.

**Shift open/close activates only where there is a real shift boundary** — support coverage, an operations window, a handover between a human and an unattended automated process. A solo operator with no shift structure runs Session Start and Session Close (`mantis.md` §16, §18) and nothing more.

## Two to three times a week

| Meeting | Attendees | Reads | Must produce |
|---|---|---|---|
| **Project sync** | Project Manager / Scrum Master (convenes), Product Owner, Tech Lead, QA Engineer, the implementing developer roles | `PROJECT_STATE.md`, `working/sprint.md`, `project-plan.md` | Actions; scope-change decisions or escalations |
| **Incident / on-call review** | DevOps Engineer (convenes), Security Engineer, Tech Lead, QA Engineer, Customer Support Agent | `incident-log/`, `PROJECT_STATE.md` Known issues, operational indicators | An owner and a deadline for every open incident |

Project sync is the Checkpoint Protocol (`mantis.md` §17) on a cadence rather than on accumulated context. Where a checkpoint already ran that day, the sync's record is the checkpoint's — not a duplicate.

The incident review's non-negotiable output is that **no open incident leaves without a named owner and a date**. An incident list reviewed without assigning either is the failure this meeting exists to prevent.

## Weekly

| Meeting | Attendees | Reads | Must produce |
|---|---|---|---|
| **Area weekly** | The area's owning role (convenes), every role inside that area's scope | `indicators.md` (that area's entries), `PROJECT_STATE.md` | Actions; findings; indicator updates |
| **1:1** | Founder/CEO 🔴 and one role, alone | that role's owned artifacts, its `indicators.md` entries | Findings; risks; escalations |
| **Leadership weekly** | Founder/CEO 🔴 (convenes), CCO/CRO, CMO, CFO, COO, Product Owner/CPO, Software Architect/CTO | `indicators.md` (all four kinds), `PROJECT_STATE.md` Pending decisions, `risks.md` | Cross-area decisions; escalations resolved or routed |
| **Pipeline review** | CCO/CRO (convenes), Account Executive, BDR/SDR, RevOps Manager; Sales Execution & Prospecting Advisor consulted | `sales-playbook.md`, `revops.md`, business indicators | A stated month-end projection, and the gap to target |

**The 1:1 is where the Founder-Facing Audit Duty is exercised conversationally.** For an AI-held role, this is that role stating plainly what the founder is not seeing inside its scope (`roles.md` §5) — the register is the role's obligation to be unwelcome, not a status update the founder already has from `PROJECT_STATE.md`. For a human report, it stays a literal private conversation whose agenda the report sets, and HR / People Manager owns the practice. In both cases: **the 1:1 is the most-cancelled meeting and the most expensive to cancel**, and a skipped one is recorded as skipped rather than silently omitted.

**Leadership weekly exists to decide what no single area can decide alone.** An agenda item that one role could have decided within its own authority (`roles.md` §3) does not belong here — routing it here is how a cadence turns into ceremony.

**Pipeline review must produce a number.** A review that walked the opportunity list without stating whether the month lands is a status recital; the projection, and the size of the gap, is the output.

## Biweekly

| Meeting | Attendees | Reads | Must produce |
|---|---|---|---|
| **Sprint planning** | Project Manager / Scrum Master (convenes), Product Owner, Tech Lead, QA Engineer, implementing roles | `PROJECT_STATE.md`, `requirements.md`, `working/sprint.md` | A committed scope; explicit out-of-scope |
| **Retrospective** | Project Manager / Scrum Master (convenes), the same delivery roles | previous retrospective's actions, process indicators | Process changes as actions, with owners |

Planning commits a scope that is realistic, which means the out-of-scope list is as much an output as the in-scope one (`execution.md` §10's Anti-Scope-Creep Rule governs what happens when that line moves mid-sprint).

**A retrospective's output is a change to how the work is done, not a list of feelings about it.** Where a retrospective identifies a recurring process problem, the fix is normally a **process indicator** in `indicators.md` (`roles.md` §10) with a target — that is what makes the improvement checkable at the next retrospective instead of re-discussed.

## Monthly

| Meeting | Attendees | Reads | Must produce |
|---|---|---|---|
| **Monthly business review (MBR)** | CFO (convenes), FP&A Manager, COO, CCO/CRO, CMO, Product Owner, Data Analyst, Bookkeeper/Accountant, **Decision & Outcomes Auditor** | `budget.md`, `indicators.md`, `ledger/`, `decision-audit.md` | An explanation for every material variance; correcting decisions |
| **Spend / investment committee** | CFO (convenes), FP&A Manager, Procurement / Vendor Manager, Founder/CEO 🔴 above the approval threshold | `budget.md`, `vendors.md` | Approve / reject / defer per request, recorded |
| **All-hands / town hall** | Founder/CEO 🔴, everyone | `indicators.md`, lifecycle position | Shared context; open questions answered |

**The MBR is Decision & Outcomes Auditor's scheduled recurring review** (`roles.md` §4, Independent Audit), not a separate obligation. Its non-negotiable output is that each material variance from `budget.md` gets an actual explanation — "revenue was below plan" is a restatement, not an explanation — while the quarter can still be corrected.

**The spend committee is the Budget Gate** (`execution.md` §5) run on a cadence rather than per-request. Both paths exist deliberately: the gate stops an individual cost-incurring decision the moment it arises, this meeting reviews the accumulated picture. Where `budget.md` has no ceiling defined, this meeting's first output is that finding, and the gate's 🔴 hard stop applies until a ceiling exists.

**All-hands is dormant in a one-person company, and is not simulated.** Its function — that everyone understands where the company is going and why — is served in an AI-native company by the Continuity Principle (`mantis.md` §34): `PROJECT_STATE.md` and `indicators.md` being current *is* the shared picture, readable by any session, agent, or person without a broadcast. This row activates the moment there is a second person, employee or contractor, and becomes quarterly rather than monthly as headcount grows.

## Quarterly

| Meeting | Attendees | Reads | Must produce |
|---|---|---|---|
| **QBR** | Founder/CEO 🔴 (convenes), every active area-owning role, Decision & Outcomes Auditor, Interface & Experience Auditor where an interface ships | `indicators.md`, `decision-audit.md`, `risks.md`, lifecycle position (`lifecycle-gates.md` §7) | Objectives closed and opened; resource reallocation |
| **OKR planning** | Founder/CEO 🔴 sets objectives; each owning role defines its own key results | previous quarter's `indicators.md`, QBR outputs | Key results **as `indicators.md` entries** — owner, metric, target |
| **Board meeting** | Board/Investors 🔴, Founder/CEO 🔴, CFO, General Counsel | `financial-model.md`, `budget.md`, `risks.md` | Governance decisions; formal approvals |
| **Performance check-in** | Founder/CEO 🔴 or the manager, and each human report | prior check-in, role expectations | Expectation gaps named early |

**OKR planning writes into `indicators.md`, not into a parallel OKR file.** A key result is by definition an owner, a metric, and a target — which is exactly an `indicators.md` entry (`roles.md` §10). Keeping them in one place is what allows the recurring indicator review (every Checkpoint and every gate) to double as OKR tracking, instead of a quarterly document nobody opens in week three.

A QBR frequently coincides with a `lifecycle-gates.md` gate. Where it does, the gate's protocol (`lifecycle-gates.md` §5) governs and the QBR is its record — not a second, competing review of the same evidence.

**Board meeting is dormant until outside investors or directors exist.** A founder does not hold a board meeting with themselves; the accountability that a board provides is, until then, partially supplied by the Founder-Facing Audit Duty (`roles.md` §5) and the Independent Audit roles — which is a weaker substitute, and naming it as weaker is more useful than pretending the function is covered. **Performance check-in is dormant with no employees.**

## Semiannual

| Meeting | Attendees | Reads | Must produce |
|---|---|---|---|
| **Strategy review** | Founder/CEO 🔴 (convenes), CCO/CRO, CMO, CFO, COO, Product Owner, Customer Discovery & Validation Advisor, Data Analyst | `vision.md`, `financial-model.md`, `customer-discovery.md`, `indicators.md`, competitive evidence | Which annual-plan premises still hold, and which do not |
| **Performance & compensation** | HR / People Manager (convenes), Founder/CEO 🔴 | `people-handbook.md`, check-in records | Calibrated outcomes; compensation decisions |
| **Climate survey & results** | HR / People Manager (convenes), the whole team | survey results | Findings; actions on what the results show |

**Strategy review's output is about premises, not results** — results are the QBR's job. The question is whether what the annual plan assumed about the market, the competition, and the financial model is still true, and the Customer Discovery & Validation Advisor attends specifically to challenge premises that were never validated in the first place (`roles.md` §4).

**Performance & compensation and the climate survey are dormant with no employees.** For a one-person company, the honest analog of the climate survey is not a survey: it is whether the operator's own working pattern is sustainable, and whether the company depends on their continuous availability with no fallback. COO's Founder-Facing Audit Duty already carries that question (`roles.md` §5 — "what only works because one specific person does it manually, and what happens the week that person is unavailable") and it is asked at the strategy review instead. A solo founder scoring their own engagement survey is theater; the continuity question is not.

## Annual

| Meeting | Attendees | Reads | Must produce |
|---|---|---|---|
| **Annual strategic planning** | Founder/CEO 🔴 (convenes), every active C-level role, Board/Investors 🔴 where one exists | full-year `indicators.md`, `financial-model.md`, `risks.md`, lifecycle position | The year's priorities and big bets; updated `vision.md` and `roadmap.md` |
| **Annual budget** | CFO (convenes), FP&A Manager, Founder/CEO 🔴 | strategic plan, prior-year `ledger/`, `vendors.md` | **`budget.md`** — ceilings by category, for the year |
| **Shareholders assembly** | Board/Investors 🔴, Founder/CEO 🔴, General Counsel, External Auditor, Bookkeeper/Accountant | financial statements, `audit-findings.md`, `legal-strategy.md` | Statutory approvals; appointments |
| **Team offsite** | The whole team | — | Relationships that make the rest work |

**The annual budget is what the Budget Gate depends on.** `execution.md` §5 hard-stops any cost-incurring decision when `budget.md` has no ceiling for the relevant category — this meeting is where those ceilings come from. A company that has never held it will hit that hard stop at its first paid tool, which is the intended behavior, not a malfunction.

**Shareholders assembly is a legal obligation where the entity has one**, and its timing is set by the jurisdiction and the company's own governing documents, not by this framework — General Counsel owns knowing which applies. It is dormant where there is no separate legal entity or no shareholders beyond the founder.

**The offsite is dormant with no team, and has no AI analog.** Its purpose is trust between people who work together; an AI-native company with one human has nobody to build it with, and the honest answer is that this row stays empty until there is a second person, rather than being reinterpreted into something it is not.

---

# 5. Cadence as a Trigger

A catalog of meetings that nobody convenes fails exactly the way a role's scope fails when nothing routes work to it (`mantis.md` §33). The cadence is therefore mechanical:

1. **At Session Start** (`mantis.md` §16.5), the AI checks `docs/meetings/` for the most recent record of each **active** meeting (Section 4, filtered by `roles/role-registry.md` and Section 5's activation rules). Any meeting whose cadence has elapsed is **overdue**.
2. Overdue meetings are raised in the session's opening summary, most overdue first, with what each one would read and produce. They are not run automatically — running six months of skipped MBRs unprompted is its own kind of noise.
3. A meeting the founder declines to hold is **recorded as skipped**, in that meeting's next record, with the date. A cadence that quietly stops is indistinguishable from one that was never adopted; a recorded skip is a decision, and a pattern of skips is a finding the Founder-Facing Audit Duty raises (`roles.md` §5).
4. Where a meeting's outputs would be empty — nothing changed, no decisions, no findings — it still produces a record stating that (Section 3.2, Alignment). This takes one line and is what makes "nothing is wrong" distinguishable from "nobody looked."

## Activation and proportionality

Meetings activate with the company, not all at once. `lifecycle-gates.md` §2's stages govern:

* **Stages 1–2 (Opportunity, Validation)** — Session Start/Close, project sync, and the strategy-side meetings. There is no pipeline to review, no month of revenue to close, and no team to align. The annual budget still applies the moment the first paid tool appears (Budget Gate, `execution.md` §5).
* **Stage 3 (MVP / Initial Product)** — add incident review, sprint planning and retrospective, and the MBR once there is spend or revenue to explain.
* **Stages 4–5 (PMF, Commercialization)** — add pipeline review and the area weeklies as commercial and marketing roles activate.
* **Stage 6+ (Scale)** — add the meetings that assume other people: all-hands, 1:1s with human reports, performance cycles, and the offsite.
* **Board and shareholders meetings** activate with investors and a legal entity respectively, regardless of stage.

**Merging is expected, and is recorded.** For a solo operator, the leadership weekly, the area weeklies, and the project sync frequently collapse into a single weekly review covering every active area — that is correct, and it is `mantis.md` §32's Adaptive Depth applied to cadence. Record the merge as a DECISION naming which meetings it absorbs, so a later session can tell a deliberate merge from a cadence that silently decayed.

The failure this section guards against is not skipping meetings. It is skipping them **without noticing** — which is why the trigger, the recorded skip, and the audit of skip patterns matter more than the calendar itself.

---

# 6. Canonical Artifacts This Framework Adds

* `meetings.md` — this file (L1): the meeting contract and catalog.
* `docs/meetings/` — project-specific (L3, episodic): one record per occurrence, `YYYY-MM-DD-<meeting-slug>.md`, in the shape of Section 3.4. These are the framework's episodic memory of *why* things were decided in sequence; the durable knowledge lives in the canonical homes Section 3.3 routes to. `docs/meetings/` is consolidated, not grown forever — records older than the current lifecycle stage may be summarized (`mantis.md` §10) once their open items are all closed or promoted.
* `risks.md` — project-specific (L2/L3): the risk register. One entry per risk: what could happen, its impact, its likelihood, the owning role, the mitigation or the explicit decision to accept it, and its current status. Kept current by the owning role for each risk, in the same shape `indicators.md` uses for indicators (`roles.md` §10) — each role owns its own entries; nobody owns the file as a whole.

  `risks.md` closes a gap the Founder-Facing Audit Duty already assumed existed: `roles.md` §5 obliges several roles to raise "what exposure is accumulating that no one has decided to accept," and until now there was no register for that answer to accumulate in. An accepted risk stays in the register with its acceptance recorded — accepting a risk is a decision (`roles.md` §2, the founder's authority), not a deletion.

Everything else this framework produces goes to artifacts that already exist — `decisions/`, `PROJECT_STATE.md`, `indicators.md`, `incident-log/`, and each role's owned artifact (Section 3.3). Like `lifecycle-gates.md`, this framework deliberately adds as little as it can.

---

# 7. Continuity

Extends `mantis.md` §34. From the repository alone, without the conversation that produced it, it should be possible to determine:

* which meetings are active for this company, at what cadence, and which are deliberately dormant or merged;
* when each last ran, what it read, and who attended;
* what each one decided, committed, found, and escalated — and where each of those was promoted to;
* what was parked, and at which occurrence it is due to return;
* which meetings were skipped, when, and whether a pattern of skipping was ever raised as a finding.

The test: a new qualified person or AI agent should be able to reconstruct not just what the company decided, but the rhythm at which it looks at itself — and to see honestly where that rhythm has been holding and where it has quietly stopped.
