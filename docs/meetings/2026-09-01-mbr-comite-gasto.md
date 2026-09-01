# Revisión Mensual de Negocio + Comité de Gasto — 2026-09-01

**First occurrence.** Monthly business review and spend / investment committee,
merged into one for a one-person company (`meetings.md` §5) — see Decision 013.

**Convened by:** FP&A Manager, **by exception.** `meetings.md` §4 names the CFO as
convener for both; the CFO is not active.
**Attendees (roles):** FP&A Manager (activated today, backdated to 2026-08-19),
Procurement / Vendor Manager (activated today), Decision & Outcomes Auditor.
**Absent and material:** CFO, Bookkeeper, DevOps Engineer, COO, CCO/CRO, CMO — six
of the nine roles this meeting's catalog entry names do not exist on this project.
Product Owner and Data Analyst are active and touched but were not consulted here.
**Inputs read:** `docs/business/budget.md`, `PROJECT_STATE.md`, all eleven decision
records, `docs/decisions/decision-audit.md`, `docs/roles/role-registry.md`,
`backend/scripts/platform-report.ts`, `mantis/execution.md` §5.
**Inputs that do not exist:** previous record, `indicators.md`, `risks.md`,
`ledger/`, `vendors.md`. Each absence is a finding (`meetings.md` §3.1).

---

## Material variances, with explanations

The MBR's non-negotiable output is an explanation for every material variance — not
a restatement.

**V1 — Spend: ceiling 20,000 COP/month, actual asserted 0, ~100% under.**
The explanation is **deferral, not frugality.** Every cost surface this company
would actually pay for is switched off: no domain, no verified sender, no
monitoring, no payment processor, no warm instance. Each is a named, deferred
purchase, and every one of them is currently blocking something. And the actual is
**asserted, not measured** — see F-1.

**V2 — Revenue: 0, against no target.**
Not a variance, and that is the finding. No revenue target exists for any period,
so revenue is structurally incapable of being off-plan. **A number that cannot be
missed is not being managed.**

**V3 — Customers: 0, with a functionally complete MVP.**
Decomposes into four separately-owned blockers, three of them self-imposed:
D-006 unanswered (the URL must not be publicised); privacy policy and terms absent
and legally required; the onboarding email lands in spam; and Decision 011 places
billing ahead of market. **Only the legal one is externally imposed.**

**V4 — Decision 009's predicted indicator: window elapsed, indicator absent.**
Predicted "within one session of deploying." That session closed 2026-08-31 with
the camera never having decoded a real permit. The platform is not implicated — the
decision said so pre-emptively and correctly. **Upgraded from "outstanding" to
"prediction failed on its own stated timeframe."**

---

## Findings

**F-1 — "Everything sits inside a free tier" is ASSUMED, not verified, and is not
repeated as fact.** In the 13 days since the GCP project was created, **no billing
report has been read by anyone and no cost figure exists on record from any
source.** The MBR's required output — an explanation for every variance — cannot be
produced, because there is no actual to vary from. Corroborating: a Software
Architect cost figure on 2026-08-31 was ~10× high and did not survive checking.
Cost figures in this project have been asserted in both directions and measured in
neither. → `budget.md`

**F-2 — Partially closed during this session.** Read live against the project:

| Checked | Result |
|---|---|
| Billing account linked | ✅ `01C0F1-38F3BC-DE3AFA`, `billingEnabled: true` |
| **Cloud Billing Budget API** | ❌ **Never enabled on this project.** Strong signal against the 2026-08-19 alert being real, though not conclusive — a console-created budget need not enable it here. **Cannot be verified further without enabling an API, which is a change to the project and was not made.** |
| Artifact Registry | `cloud-run-source-deploy`, **107.4 MB**, created 2026-08-31. Free allowance ~500 MB, so ~21% consumed. Grows with every deploy; no retention policy exists |
| Cloud KMS | `zeker-master-key`, **1 enabled version**, 90-day rotation, `ENCRYPT_DECRYPT` |

**Still unread and still the largest unknown:** actual spend by SKU, and **whether a
US$300 free-trial credit is active and when it expires.** A stack inside Always Free
and a stack billed-then-credited-to-zero look identical in a US$0.00 top line and
behave completely differently later. Needs the console, which only the Founder has.

**F-3 — Where the first real charge most likely comes from, ranked.**

1. **Cloud KMS, and the page I own may be wrong.** `budget.md` says "free tier at
   one key." Key *versions* carry no always-free allowance to FP&A's knowledge and
   bill at roughly US$0.06/version/month (~240 COP). Confirmed live: one version,
   rotating every 90 days, so versions accumulate. **And Decision 005 closed the
   encryption requirement — nothing in the MVP uses this key.** If it bills, the
   project's first non-zero line is a resource it does not need. That is a
   cost-*removal* decision, not a cost-acceptance one.
2. **Artifact Registry.** Confirmed at 107.4 MB against a ~500 MB allowance, with no
   cleanup policy and two images pushed per deploy. **This is the line that goes
   non-zero first and independently of customers**, because it grows with deploy
   count, not with usage.
3. **Cloud Run egress.** Free tier covers requests and compute; **egress bills
   separately and by destination.** We serve `us-central1` → Bogotá, which is South
   America egress, not the North-America allowance. The multiplier is the browser
   bundle — which `PROJECT_STATE.md` records as having no owner, no limit and no
   monitoring. This is the line that scales with customers.
4. **Firestore.** Not close, but a different failure *shape*: the allowance is
   per-day, so an unbounded query burns a day's quota in minutes. A cliff, not a
   slope. `npm run report` reads across all collections by design.

**F-4 — "Declared, not deployed" has now happened a third time, in finance.**
Composite indexes (2026-08-29). TTL policy (2026-08-30). And now: a billing alert
created 2026-08-19, **marked ✅ COMPLETE, never verified to have a threshold, a
currency, or a recipient.** Each time the surrounding evidence looked green. **The
pattern is not a coding problem. It is a habit of treating recording an action as
performing it.** → `budget.md`, `decision-audit.md`

**F-5 — The Budget Gate's standing control does not exist.** `execution.md` §5
requires spend against the ceiling to be a Business indicator reviewed at every
Checkpoint and gate. There is no `indicators.md`. The ceiling was therefore a
question asked once on 2026-08-31 and never checked again — exactly what that clause
exists to prevent. **Closed today** by creating `docs/business/indicators.md`.

**F-6 — An annual charge against a monthly ceiling has no stated convention.**
`budget.md` says "20,000 COP per month, total" and is silent on non-monthly charges.
Amortized, a US$10–15/year domain is 3,333–5,000 COP/month = **17–25% of the
ceiling: it fits.** On a cash basis the charge lands as a single 40,000–60,000 COP
outlay = **2–3× the monthly ceiling in the month it is paid: it breaches.** Both
readings are defensible from the text and they give opposite answers. This is the
difference between "approved" and "breach" on the project's first purchase.

**F-7 — Attaching the domain to Cloud Run can cost 3.6×–5× the entire ceiling.**
A Google Cloud external Application Load Balancer runs roughly US$18–25/month —
**72,000–100,000 COP/month, permanently.** The free paths are Cloud Run domain
mapping (region-limited; must be confirmed for `us-central1`) or Firebase Hosting in
front (free Spark tier, free managed SSL). **Approving the domain without settling
this is how a 3,480 COP/month decision silently becomes a 100,000 COP/month one.**
Owner: Software Architect. → `vendors.md`

**F-8 — Predicted vs. actual, all eleven decisions.** Decisions 001–008 carry **no
Predicted Outcome & Indicator field at all** — including the two that set the
company's cost base and its free-tier offer. Eight of eleven decisions were recorded
with nothing that could later be checked. Verdicts:

| # | Verdict |
|---|---|
| 001 Freemium + GCP | **Mixed.** Stack delivered; cost claim never measured; its own 9-item checklist still entirely unticked; Vercel reversed by 009 within 12 days |
| 002 Client-side auth | **Delivered, with an unpredicted consequence now rated 🔴** — it made a third party's default sender the sole onboarding channel |
| 003 Interiors + quotas | **Delivered.** Applied to two resources only; permits and accounts remain uncounted |
| 004 Backend-only Firestore | **Delivered in code; the guarantee is untested against reality** — two real organizations have never been used against the deployed system |
| 005 No visitor phone | **Delivered.** But `PROJECT_STATE.md` still lists "Encryption at Rest — AES-256 for emails, phones" as an *active* decision. Stale, twice |
| 006 Responsable accounts | **Delivered; its own recorded risk unmitigated; its delivery path defective** |
| 007 Entry permits | **Delivered.** Its process rule ("deploying indexes is part of shipping a query") was broken the next day |
| 008 Door check | **Delivered with one stated precondition still unmet** — the camera |
| 009 Cloud Run | **Prediction failed on its own stated timeframe.** Its revisit condition ("measurably slow in Colombia") is arguably triggered and unmeasured |
| 010 Target segment | **Not yet testable — but its remediation has not shipped.** See F-9 |
| 011 Billing before market | **Not yet testable.** Its cost accrues from day one; its benefit is contingent on a conversation nobody has scheduled |

**F-9 — A finding closed on 2026-08-31 is re-opened.** It was closed on the strength
of Decision 010 being *recorded*. One day later `brief.md` still argues schools.
**A decision that supersedes a document does not change the document.** And the drift
spread rather than being contained: `PROJECT_STATE.md`'s Phase 2 still says "contact
schools in Bogotá", and — most seriously — **the Risk Register's mitigation for the
company's single 🔴 risk, "No market demand", still reads "Validate with 5-10 schools
ASAP."** The mitigation for the risk that kills this company points at a segment the
company decided to abandon. → `decision-audit.md`

**F-10 — Zero of the four indicator kinds have a real, current, owned entry.**
`backend/scripts/platform-report.ts` is a genuine instrument that computes real
counts from live Firestore — more than most projects have at this stage. **But no run
of it has ever been recorded anywhere.** No dated value, no series, no target. And
three targets in "Metrics We Care About" — API latency, error rate, Firestore cost —
have zero instrumentation and read on the page as though they were being watched.

---

## Decisions

- **D-FPA-1 — Spend against the ceiling this period is recorded as UNVERIFIED, not
  as compliant.** Owning role: FP&A Manager. Consulted: none available. Dissent:
  none. Rationale: repeating an unverified claim in a finance artifact is how it
  becomes a fact by repetition. *Predicted outcome:* the first actual reading lands
  at or near zero, confirming the claim. If it does not, the claim was load-bearing
  and wrong for 13 days. Checked by Decision & Outcomes Auditor. → `budget.md`

- **Cost reporting into `budget.md` has no reporter.** `execution.md` §5 assigns
  infrastructure cost to DevOps and subscriptions to Procurement; FP&A only
  aggregates. Neither reporter is active, so **FP&A reads the figures directly as an
  explicit, recorded stopgap that breaks the framework's separation between who
  incurs cost and who checks it** — not as the standing arrangement. → `decisions/`

## Committee output on the pending purchase

**DEFERRED**, pending two preconditions — neither a judgment on the merits. The 🔴
issue is real and the fix is well-justified.

1. The Founder states the annual-vs-monthly convention (F-6).
2. The billing alert is configured and one clean zero-baseline reading is taken.

**Recommended convention:** amortize — the ceiling is a run-rate control on
recurring commitments, not a cash-flow limit — **with a guardrail so amortization
cannot slip a large purchase through: any single cash outlay above 50,000 COP
requires explicit Founder approval regardless of how it amortizes.**

**The Founder may override this deferral,** and there is a real argument for it:
registering a name is time-sensitive in the one way nothing else here is — a name
someone else takes cannot be recovered. If overridden, it is recorded as a purchase
made **ahead of** the control, not one that passed it.

**The email sender must not ride along in this approval.** Approving "a domain plus
a possible email service" as one item is exactly how a ceiling is breached by the
component nobody sized. It comes to the gate as its own proposal with its own number
— currently **COP 0** on a free tier, with a cliff recorded in `vendors.md`.

## Actions

- **A-1** ✅ Done today — FP&A Manager and Procurement / Vendor Manager recorded as
  active in the registry, FP&A backdated to 2026-08-19, and the contradicting
  "Finance / CFO: when revenue > $0" rule corrected.
- **A-2 — Configure the GCP billing alert.** Founder, in the console, by
  **2026-09-05**, **before any domain purchase.** Budget amount 20,000 COP —
  ⚠️ **verify the billing account's currency first; if it is USD the amount is
  US$5, and entering "20000" creates a US$20,000 budget that would never fire
  again.** Thresholds on *actual* spend at **25% (5,000 COP)**, 50%, 90%, plus one
  rule at **100% of forecasted** spend. Why 25% and not the ceiling: expected spend
  today is zero, so the alert's job is not "are we near the limit" but "has this
  project started costing money at all."
- **A-3 — Read the actual billing report by SKU, and settle the free-trial-credit
  question.** Founder, by **2026-09-05**. Output is a figure in COP with a date, not
  a "looks fine."
- **A-4** ✅ Done today — `docs/business/indicators.md` created.
- **A-5 — Confirm the Cloud Run attachment method is free** before the domain is
  paid for (F-7). Software Architect, before purchase.
- **A-6 — Investigate removing the unused KMS key** (F-3 #1). Security Engineer with
  Software Architect. Decision 005 closed its purpose.
- **A-7 — Remove the stale "Encryption at Rest — AES-256 for emails, phones" line**
  from `PROJECT_STATE.md`'s Active Decisions and the matching Completed bullet.
  Security Engineer.
- **A-8 — Correct the Risk Register's "No market demand" mitigation** (F-9). Product
  Owner, same pass as the brief rewrite.
- **A-9 — Create `docs/business/vendors.md`** with the first entry before any card
  is charged. Procurement / Vendor Manager. ✅ Done today, as a proposal record.

## Risks

→ `docs/business/risks.md`, created today.

- A free-trial credit may be masking real spend, expiring on a date nobody knows.
- The first recurring commitment has no renewal register; an auto-renewing annual
  charge at a likely higher renewal price arrives in ~12 months.
- Domain lapse: redemption costs **US$80–150 ≈ 320,000–600,000 COP, which is
  1.3×–2.5× this project's entire annual budget** — and DKIM/SPF stop validating,
  onboarding dies silently, and a third party who re-registers the name can receive
  address-based recovery mail. That is a security incident, not a billing lapse.
- The email sender's free tier has no affordable step above it: the next tier is
  1.8×–4× the entire ceiling. Email volume growth is a budget event.
- Artifact Registry grows monotonically with deploys and has no cleanup policy.

## Escalated blockers

- **Cannot compute this period's variance.** Actual spend is unknown, so variance is
  undefined. Unblocked only by console access, which only the Founder holds. **This
  is the meeting's one hard dependency on a human.**

## Parked

- Reviewing the 20,000 COP ceiling itself. Returns at the first paying customer, or
  at the October MBR if the domain plus an email service consume more than half of
  it — whichever comes first.
- Unit economics (cost per active organization). Returns at ~5 pilot organizations.
- Pricing the Founder's time as a burn input. Touches COO and Founder/CEO scope.
  Returns at the next MBR.
- Choice between Resend and Brevo. Both free, both adequate, neither configurable
  without a domain. Returns the day the domain resolves.
- Defensively registering `zeker.com.co` alongside `zeker.com`. No at this budget.
- Decisions 010's and 011's indicators — the two most important open predictions on
  record. Return at the next MBR or the first discovery conversation.

## Agreements

- **Every future recurring cost enters through Procurement and is recorded in
  `vendors.md` with its renewal date and its exit terms *before* the card is
  charged, not after.** A subscription nobody recorded is a subscription nobody
  cancels. → promote to `decisions/` if the Founder accepts it as a standing rule.

## Alignment — the Founder-Facing Audit Duty, exercised

Two roles reached the same conclusion independently, from different directions.

**On money:** *"Zeker's cash exposure is genuinely trivial and genuinely unmeasured,
and those are two different statements that have been treated as one."* Nothing
found here suggests the project is spending too much. Everything found here says
nobody knows what it is spending — and the first recurring commitment is about to be
made against that blank.

**And the ceiling is doing the work of financial control without providing any.** A
US$5/month limit means no purchase can ever be large enough to hurt, so the budget
cannot fail loudly, and a control that cannot fail loudly conveys no information.
Meanwhile the real investment sits entirely outside it: **founder-months, which are
unpriced, unbudgeted, and untracked.** This company has a rigorous ceiling on its
cheapest input and none whatsoever on its most expensive one. Cash runway is
effectively unbounded and therefore uninformative; the scarce resource is not money.

**On decisions:** *"This company's decision record is strong and its evidence record
is empty, and the two have been mistaken for each other."* Eleven decisions in
thirteen days, zero conversations with a buyer. Every one was the next reasonable
step — and a sequence is not evidence. **The tell: the one decision forced by contact
with the outside world (009, deploying) was the only one that produced a genuine
surprise** — every API call returning 401 on a service account permission, while 188
tests stayed green. Reality contradicted the plan the first time it was consulted.
The other ten have never been given that chance.

**And Decision 010 chose the market backwards, in its own words:** *"the product that
exists already fits this segment… choosing schools would mean rebuilding the permit
model."* That selects a buyer to avoid rework. It may well be right. But until the
5–8 conversations its own indicator requires actually happen, **the target market is
an assumption wearing a decision record's clothes.**

**Finally, on this meeting itself:** it was convened by nobody. Its catalog convener
is not active, six of its nine named attendees do not exist, and it was held by its
own auditor reviewing decisions in the absence of the roles that made them. Naming
that is more useful than proceeding as though a room were full.
