# Lifecycle Gates Framework

Extension of the AI Software Development Operating Framework (`mantis.md`).

`mantis.md` defines a lifecycle for building software (`DISCOVER → … → LEARN`). `delivery-framework.md` gates a work item's path to production. `execution.md` gates a unit of work inside a coding session. None of them gate the **business** decisions those activities exist to serve: whether a problem is worth pursuing, whether customers will pay, whether the thing is ready for real customers, whether growth is economically viable.

This framework adds those gates. Its purpose is control: a company should not drift from one stage to the next because work happened, but because a specific question was answered with evidence and a human accepted the answer.

---

# 1. Purpose and Relation to the Base Framework

This framework extends `mantis.md` and reuses its mechanisms: knowledge classification (FACT / DECISION / ASSUMPTION / PROPOSAL / UNKNOWN), the L1–L4 memory layers, the knowledge promotion protocol, and the Continuity Principle. It reuses `roles.md` for who reasons about each gate, and `execution.md` §5's Autonomy Tiers for how much ceremony a decision warrants.

Context of this framework, fixed as DECISION:

* A stage is not complete because its work is complete. It is complete when its gate question is answered with evidence and a human accepts that answer.
* Gates are hard stops. The AI does not advance a project to the next stage on its own initiative, and does not treat a stage's activities as authorization to begin the next stage's.
* Every gate names a decision-maker. Where that decision-maker is Founder/CEO or Board/Investors, the gate routes to the human without exception (`roles.md` §2, Human-Held).
* A gate may be answered "no." Stopping, reframing, or abandoning at a gate is a successful outcome of that gate, not a failure of the project.
* Ceremony scales with consequence (Section 6). Most gates are not meetings.
* The company ships the smallest version that is genuinely useful to a real customer, as soon as that bar is met — not the smallest version that merely runs, and not a larger version held back for polish nobody asked for (`mantis.md` §1.1). Stage 3's exit condition (Section 2) is the concrete test.

This framework does not replace `mantis.md`'s lifecycle — it sits above it. A single stage here typically contains many full `DISCOVER → … → LEARN` passes, many `delivery-framework.md` work items, and many `execution.md` unit cycles.

---

# 2. The Eight Stages

```text
1. Opportunity & Discovery   → Is there a problem worth pursuing?
2. Validation                → Will customers use and pay for a solution?
3. MVP / Initial Product     → Can we build and deliver the smallest viable version?
4. Product-Market Fit        → Do users repeatedly choose and value it?
5. Commercialization         → Can we acquire customers predictably and economically?
6. Scale                     → Can we grow without breaking product or organization?
7. Maturity & Expansion      → Where is the next growth curve?
8. Strategic Outcome         → What is the right long-term ownership outcome?
```

Stage exit conditions:

| Stage | Exits when |
|---|---|
| 1. Opportunity & Discovery | A specific problem, target customer, value proposition, and business-model hypothesis exist — concrete enough to justify spending resources on validation |
| 2. Validation | Evidence that a defined segment has the problem, that the proposed solution addresses it, and that the company can plausibly deliver and monetize it |
| 3. MVP / Initial Product | A real customer can discover, acquire, receive, use, and get value from the product, and the company can support that |
| 4. Product-Market Fit | Repeatable customer value and retention — not individual successes or enthusiastic early adopters |
| 5. Commercialization | Customer acquisition and monetization repeatable enough to justify systematic growth investment |
| 6. Scale | Growth without proportional increase in chaos, outages, support burden, or financial risk |
| 7. Maturity & Expansion | A durable business with identified, funded growth levers |
| 8. Strategic Outcome | A completed strategic outcome, or an explicit decision to remain independent |

Not every company passes through all eight. A lifestyle business may deliberately stop at Stage 5 or 6 permanently; that is a decision to record (`mantis.md` §21), not a stage that was failed.

---

# 3. The Gate Chain

The stages reduce to a chain of decisions. This is the operational spine of this framework — each gate is a question that must be answered before the work of the next stage begins.

| Gate | Question | Decision-maker | Required output |
|---|---|---|---|
| **G0** Opportunity | Is there a meaningful problem worth investigating? | Founder/CEO 🔴 | Problem hypothesis |
| **G1** Customer | Is the problem important enough to a defined customer? | Founder/CEO 🔴, with Product Owner + UX Researcher | Customer/problem evidence |
| **G2** Solution | Does our proposed solution plausibly solve it? | Product Owner, with UI/UX Designer + Software Architect | Validated solution concept |
| **G3** Feasibility | Can we deliver it technically and economically? | Software Architect + CFO/FP&A | Feasibility assessment |
| **G4** MVP Scope | What is the minimum we must build to test this? | Product Owner + Software Architect, Founder/CEO 🔴 for trade-offs | Frozen MVP scope |
| **G5** Launch | Is it ready for real customers? | Product Owner + QA Engineer + DevOps Engineer | Release approval |
| **G6** Value | Are customers actually getting the promised outcome? | Product Owner + Customer Success + Data Analyst | Usage/retention evidence |
| **G7** PMF | Do customers repeatedly choose and retain it? | Founder/CEO 🔴, with Product Owner + CCO + CFO | PMF evidence |
| **G8** GTM | Can we acquire customers repeatably? | Founder/CEO 🔴, with CCO + CMO | Repeatable GTM model |
| **G9** Economics | Does growth create economic value? | Founder/CEO 🔴 + CFO, with Growth Marketer | Unit-economic model |
| **G10** Scale | Can we grow without proportional cost, risk, and complexity? | Founder/CEO 🔴, with COO + CTO/Architect + CFO | Scalable operating model |
| **G11** Expansion | Where should additional capital and resources go? | Board/Investors 🔴 + Founder/CEO 🔴 | Portfolio/capital allocation |
| **G12** Strategic Outcome | What maximizes stakeholder value from here? | Board/Investors 🔴 + Founder/CEO 🔴 | Strategic outcome decision |

🔴 marks a Human-Held decision-maker (`roles.md` §2): the AI prepares everything the decision needs and explicitly does not make it. Nine of the thirteen gates name a Human-Held decision-maker (G4 only for its trade-off calls), concentrated where consequences are largest.

Roles named per gate are the *minimum*. Apply `mantis.md` §7.1's decomposition: a gate touching more concerns pulls in more roles, and any active role whose scope the gate touches must be consulted (`roles.md` §5).

---

# 4. Substages

Stages decompose into substages. Each substage names the transition it performs, the roles that do it, and its exit decision. Roles are named as they appear in `roles.md`'s catalog.

## Stage 1 — Opportunity & Discovery

| Substage | Beginning → end | Roles | Exit decision |
|---|---|---|---|
| 1.1 Problem identification | Observation → specific problem statement | Founder/CEO 🔴, Product Owner | **G0** — worth investigating? Usually founder alone; no ceremony |
| 1.2 Customer discovery | Hypothesis → interview/observation evidence | Product Owner, UX Researcher, Customer Discovery Advisor | What did we learn? Which assumptions survived? |
| 1.3 Market & competitive discovery | Market hypothesis → defined market, alternatives, constraints | Advertising Strategist, CFO/FP&A, Product Owner | Go/no-go: is the opportunity attractive enough? |
| 1.4 Value proposition | Evidence → explicit value proposition and segment | Product Owner, PMM, CCO | Who exactly do we serve, and why would they choose us? |
| 1.5 Business-model hypothesis | Value proposition → preliminary revenue/cost model | CFO/FP&A, CCO, Founder/CEO 🔴 | **G1** — continue to validation, or reframe/abandon |

## Stage 2 — Validation

| Substage | Beginning → end | Roles | Exit decision |
|---|---|---|---|
| 2.1 Solution concept | Validated problem → solution concept | Product Owner, UI/UX Designer, Software Architect | Is it compelling and technically plausible? |
| 2.2 Prototype / blueprint | Concept → prototype, mockup, or service simulation | UI/UX Designer, Frontend Developer, COO | Does it solve the problem without unnecessary complexity? |
| 2.3 Customer validation | Prototype → observed reactions, intent, pre-orders, pilots | UX Researcher, Account Executive, Customer Discovery Advisor | Proceed, modify, or kill |
| 2.4 Technical validation | Technical concept → demonstrated feasibility | Software Architect, Security Engineer, DBA | **G3** — feasibility gate |
| 2.5 Commercial validation | Interest → evidence customers will transact | CCO, CFO/FP&A, Commercial Contracts Counsel | Will they pay under realistic conditions? |
| 2.6 MVP definition | Validated concept → prioritized minimum scope | Product Owner, Business Analyst, Software Architect | **G4** — freeze what is in and out |

## Stage 3 — MVP / Initial Product

| Substage | Beginning → end | Roles | Exit decision |
|---|---|---|---|
| 3.1 Specification | MVP concept → executable requirements | Business Analyst, Product Owner, UI/UX Designer | Kickoff: scope, success metrics, ownership |
| 3.2 Build | Specification → functional product | Engineering roles, QA Engineer, Tech Lead | Recurring reviews, not executive gates — `execution.md`'s Unit Cycle governs here |
| 3.3 Internal validation | Build → release candidate | QA Engineer, Security Engineer, DevOps Engineer | Safe and functional enough to expose? |
| 3.4 Pilot / beta | Candidate → controlled real-world use | Product Owner, Customer Success, DevOps Engineer | Continue, modify, or stop |
| 3.5 Initial launch | Pilot → publicly available | Product Owner, PMM, DevOps Engineer, General Counsel, Interface & Experience Auditor | **G5** — go-live |
| 3.6 Post-launch learning | First customers → behavioral and economic evidence | Data Analyst, Product Owner, Customer Success | **G6** — what must change before broader investment? |

## Stage 4 — Product-Market Fit

| Substage | Beginning → end | Roles | Exit decision |
|---|---|---|---|
| 4.1 Usage & retention analysis | First use → repeat use | Data Analyst, Product Owner, Customer Success | Analytics review |
| 4.2 Product iteration | Observed behavior → improved product | Product Owner, UI/UX Designer, Data Analyst | Prioritization by evidence, not anecdote |
| 4.3 Pricing & packaging | Initial price → tested monetization | CCO, CFO/FP&A, PMM, Founder/CEO 🔴 | Pricing decision |
| 4.4 Customer success | Acquisition → recurring successful outcome | Customer Success, Product Owner | Customer health review |
| 4.5 Repeatability | Individual successes → reproducible outcomes | Product Owner, CCO, COO | **G7** — is demand repeatable without founder heroics? |

## Stage 5 — Commercialization & Early Growth

| Substage | Beginning → end | Roles | Exit decision |
|---|---|---|---|
| 5.1 GTM design | Proven product → defined acquisition model | CCO, CMO, Product Owner, CFO | **G8** — GTM decision |
| 5.2 Demand generation | Target market → qualified demand | Growth Marketer, Content Strategist, Partnerships Manager | Marketing performance review |
| 5.3 Sales conversion | Opportunity → paying customer | Account Executive, Commercial Contracts Counsel | Deal approval where material |
| 5.4 Onboarding / fulfillment | Closed customer → customer receiving value | Customer Success, COO | Readiness review for complex products |
| 5.5 Unit economics | Revenue → measurable CAC, LTV, margin, payback | CFO/FP&A, Growth Marketer | **G9** — increase, hold, or cut growth spend |
| 5.6 Growth experimentation | Hypothesis → measured experiment → decision | Growth Marketer, Data Analyst, Product Owner | Scale, iterate, or kill |

## Stage 6 — Scale

| Substage | Beginning → end | Roles | Exit decision |
|---|---|---|---|
| 6.1 Organizational scaling | Founder-led → functional organization | COO, HR/People Manager, Recruiter, Founder/CEO 🔴 | Org-design decision |
| 6.2 Technology scaling | Working tech → reliable scalable platform | Software Architect, DevOps Engineer, Security Engineer, DBA | Architecture and reliability reviews |
| 6.3 Operational scaling | Manual → standardized processes | COO, QA Engineer, Customer Success | Operating model review |
| 6.4 Sales scaling | Founder-led sales → repeatable sales organization | CCO, Account Executive, BDR/SDR, Sales Execution Advisor | Forecast and pipeline review |
| 6.5 Financial control | Startup bookkeeping → institutional finance | CFO, FP&A Manager, Bookkeeper, External Auditor | Financial review |
| 6.6 Governance & risk | Informal → formal governance | General Counsel, Compliance Officer, CISO, HR | **G10** — scalable operating model confirmed |

## Stage 7 — Maturity & Expansion

| Substage | Beginning → end | Roles | Exit decision |
|---|---|---|---|
| 7.1 Core optimization | Existing business → optimized economics | Product Owner, CFO/FP&A, COO, Data Analyst | Portfolio and prioritization review |
| 7.2 New product development | Opportunity → validated adjacent product | Product Owner, UX Researcher, Customer Discovery Advisor | New-product investment gate — re-enters Stage 1 for that product |
| 7.3 New market expansion | Existing model → new geography or segment | CCO, CMO, Regulatory Counsel, CFO | Market-entry decision |
| 7.4 Platform / ecosystem | Standalone product → platform | Software Architect, Partnerships Manager, Product Owner | Platform strategy review |
| 7.5 Portfolio management | Multiple lines → capital allocation | CFO, Product Owner, Founder/CEO 🔴, Board 🔴 | **G11** — portfolio investment decision |

## Stage 8 — Strategic Outcome

| Substage | Beginning → end | Roles | Exit decision |
|---|---|---|---|
| 8.1 Strategic assessment | Mature business → ownership direction decision | Board 🔴, Founder/CEO 🔴, CFO, Investment Banker | Board strategic review |
| 8.2 Transaction preparation | Decision → transaction-ready company | CFO, Investment Banker, General Counsel, Tax Advisor, External Auditor | Board approval to transact |
| 8.3 Due diligence | Buyer interest → verified company | External Auditor, General Counsel, CISO, CFO, HR | Diligence decision |
| 8.4 Negotiation & execution | Indicative terms → closed transaction | Investment Banker, General Counsel, CFO, Board 🔴 | **G12** — signing and closing |
| 8.5 Integration | Closed transaction → integrated company | Integration/PMO Lead, COO, HR, Software Architect | Integration completion review |

---

# 5. Gate Protocol

Every gate runs the same way, regardless of size.

1. **State the question.** Name the gate and its question exactly as written in Section 3. A gate answered vaguely was not answered.
2. **Identify the roles.** Decompose the gate's concerns and match each to its active owning role (`mantis.md` §7.1, `roles.md` §3). Where the Agent Framework is in use, consult them as real subagents rather than as an internal impression of what they would say.
3. **Assemble the required output.** Section 3 names a specific output per gate. That artifact is the evidence the decision rests on; a gate cleared without it was not cleared.
4. **Run the Founder-Facing Audit** (`roles.md` §5). Every gate is an audit point: the roles carrying that duty state what the founder is not seeing, plainly, before the decision — not after. Where the gate's output includes a customer-facing interface, Interface & Experience Auditor's review feeds into this step (most relevant at G5). Where the gate revisits a prior strategic decision, Decision & Outcomes Auditor's predicted-versus-actual check (`roles.md` §8) feeds in the same way — both roles are `roles.md` §4's Independent Audit category, not a separate protocol step. **Every gate also checks `indicators.md`** (`roles.md` §10) where it exists — not only when a specific past decision is being revisited: a gate is exactly the point where "are we actually on target" must be asked plainly, and a stale or missed entry is itself a finding for this step.
5. **Surface disagreement.** Where roles conflict, apply the Inter-Role Communication & Debate Protocol (`roles.md` §7) and preserve dissent in the record, including when it is overruled.
6. **Decide, or route to the human.** Where the decision-maker is Human-Held 🔴, present options, trade-offs, evidence, and an explicit labeled recommendation — then stop and wait. Do not proceed on an assumed answer.
7. **Record the outcome** in `decisions/` with role attribution (`roles.md` §8), and update the current stage and last-cleared gate in `PROJECT_STATE.md`.

A gate that produced no artifact, no audit findings, and no recorded decision did not happen, regardless of how much discussion preceded it.

---

# 6. Proportionality — Most Gates Are Not Meetings

The failure mode of a gated process is ceremony: turning every transition into a committee and every decision into a document nobody reads. That is as damaging as having no gates at all, and it is the reason most gating frameworks are abandoned.

The governing principle: **use the smallest group capable of making the decision correctly, and add formality only as the financial, legal, technical, or organizational consequence of being wrong increases.**

This is `execution.md` §5's Autonomy Tiers applied at business scale:

* **🟢** — one role decides and proceeds. Problem identification, a customer interview, a prototype iteration, a technical feasibility check within known constraints, a growth experiment readout.
* **🟡** — the owning role proposes, the human approves. MVP scope, launch readiness, pricing changes, GTM model, hiring plan.
* **🔴** — hard stop for a Human-Held decision-maker. Every gate marked 🔴 in Section 3: G0, G1, G4 (trade-offs), G7, G8, G9, G10, G11, G12 — plus fundraising, restructuring, and any transaction.

For a solo operator, most 🟡 decisions collapse into a fast confirmation rather than a meeting. That is correct and intended — the gate's value is that the question was asked and answered with evidence, not that people gathered. What must not collapse is the 🔴 tier, whose entire purpose is that consequence has outgrown speed.

---

# 7. Where a Project Actually Is

The current stage and the last cleared gate are project status, and belong in `PROJECT_STATE.md` (`execution.md` §9) — not in a competing file:

```markdown
## Lifecycle position
Stage: 3 — MVP / Initial Product
Last gate cleared: G4 (MVP Scope) — 2026-08-14
Next gate: G5 (Launch) — blocked on QA verification coverage
Open audit findings: 2 (see analytics.md, security.md)
```

Claiming a stage the gates do not support is the same failure as claiming a test passed that never ran (`mantis.md` §27, §33). A project is in Stage 3 because G4 was cleared with a frozen scope artifact — not because it feels like it is building an MVP.

---

# 8. Canonical Artifacts This Framework Adds

* `lifecycle-gates.md` — this file (L1): the stage and gate protocol.
* Gate outputs are recorded in existing artifacts rather than new ones: problem and customer evidence in `customer-discovery.md` and `user-research.md`, scope in `requirements.md`, feasibility in `architecture.md`, economics in `financial-model.md` and `budget.md`, decisions in `decisions/`, current position in `PROJECT_STATE.md`.

This framework deliberately adds one file. Its gates produce evidence that belongs in the artifacts that already exist.

---

# 9. Continuity

Extends `mantis.md` §34. From the repository alone, without the conversation that produced it, it should be possible to determine:

* which stage the company is in, and which gate cleared it into that stage;
* what evidence each cleared gate rested on, and who decided;
* which gates were answered "no," and what changed as a result;
* what the Founder-Facing Audit found at each gate, and which findings remain open;
* what the next gate requires, and what is currently blocking it.

The test: a new qualified person or AI agent should be able to determine what the company has actually proven — as opposed to what it hopes — from the repository alone.
