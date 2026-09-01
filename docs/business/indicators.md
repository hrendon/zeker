# Indicators — Zeker

**Created:** 2026-09-01, from the first MBR.
**Shape:** `mantis/roles.md` §10. Each role owns its own entries; **nobody owns the
file as a whole.** Reviewed at every Checkpoint, every weekly review, every MBR and
every gate.

---

## The rule this file exists to enforce

**No invented numbers.** Where nothing has been measured, the current value is the
word **UNMEASURED** — not a guess, not a plausible figure, not last month's number
carried forward. An indicator whose value is unmeasured is honestly at risk, and
saying so is the entire point.

Before today, this project had a section in `PROJECT_STATE.md` called "Metrics We
Care About": no owners, no current values, no dates, no status, and no place a value
was ever written down. **It was a list of things someone would like to know.** Three
of its targets — API latency, error rate, Firestore cost — had zero instrumentation
and read on the page as though they were being watched.

`backend/scripts/platform-report.ts` is a genuine instrument that computes real
counts from live Firestore. **No run of it has ever been recorded anywhere.** A tool
that can produce a number is not a metric that is being tracked.

---

## Business

| Indicator | Owner | Target | Current | Updated | Status |
|---|---|---|---|---|---|
| Monthly GCP spend vs. ceiling | FP&A Manager | Under 20,000 COP/month | **UNMEASURED** — asserted 0; no billing report read in 13 days | 2026-09-01 | 🔴 at risk, because unmeasured — not because spend is high |
| Paying customers | Product Owner | **No target exists — the Founder's to set** | 0 (measured) | 2026-09-01 | ⚪ |
| Organizations created by someone who is not the Founder | Product Owner | To be set | 0 | 2026-09-01 | ⚪ The first business number here that is not zero by construction |

> **The indicator that decides this company is "does anyone pay", and it cannot be
> tracked until Decision 011's billing exists.** Until then the honest leading proxy
> is the third row. Naming that plainly is more useful than tracking a number that
> cannot move.

## Management

| Indicator | Owner | Target | Current | Updated | Status |
|---|---|---|---|---|---|
| Age of the oldest open Pending decision | the raising role / Founder | To be set | D-006: 5 days (open since 2026-08-27) | 2026-09-01 | 🟡 D-005 closed today after 7 days |
| Discovery conversations with building administrators or facility managers | Customer Discovery & Validation Advisor | **5–8** — the number Decision 010's own indicator requires | **0** | 2026-09-01 | 🔴 |
| Recorded decisions carrying a Predicted Outcome & Indicator | Decision & Outcomes Auditor | 100% of new decisions | 3 of 12 (009, 010, 011 — and 012 as of today, so 4 of 12) | 2026-09-01 | 🟡 Decisions 001–008 carry none, including the two that set the cost base and the free-tier offer |

## Process

| Indicator | Owner | Target | Current | Updated | Status |
|---|---|---|---|---|---|
| **Declared infrastructure verified live** — of all changes declaring or modifying a Google-managed resource (composite index, TTL policy, IAM binding, Firestore rule, Cloud Run config, Firebase Auth setting), the share that record a read-back of that resource's live state **in the same change** | Software Architect (verifier: QA Engineer) | **100%** | Not yet computed; instrument defined today | 2026-09-01 | 🟡 |
| **Declared-but-unverified resources currently outstanding** — the companion measure, checked at every Session Close | Software Architect | **0** | Unknown; 3 past occurrences | 2026-09-01 | 🟡 |

> **Why the percentage needs a companion.** A percentage is blind when nothing was
> declared: the TTL policy sat declared-and-undeployed for a full day and would not
> have appeared in any per-change percentage on the days nobody touched it.
>
> **Why this is not a test.** All three failures happened with a fully green suite —
> the in-memory Firestore double answers queries real Firestore refuses. This
> indicator therefore lives at Session Close **against the live project**, never
> inside the test run. A small denominator (two to five such changes a month) is
> normally a weakness; here it is the right instrument, because a single miss has
> already cost this project three times.

## Operational

| Indicator | Owner | Target | Current | Updated | Status |
|---|---|---|---|---|---|
| Critical flows verified by hand on a real phone | QA Engineer | 1 of 1 (the guard gate, camera path) | **0 of 1** | 2026-09-01 | 🔴 Decision 009's own unmet indicator |
| Load time on a real phone, on mobile data | Software Architect | Under 2 s to usable | **UNMEASURED.** 1.34 s cold / 0.68 s warm, **wired** — explicitly not a phone. The Founder reported it as very slow | 2026-09-01 | 🔴 |
| Artifact Registry size vs. free allowance | Software Architect | Under ~500 MB | **107.4 MB** (measured live 2026-09-01) | 2026-09-01 | 🟢 ~21%, but grows with every deploy and has no cleanup policy |

---

## What is deliberately absent

- **Retention at 1/4/12 weeks.** No cohort logic exists anywhere; the report computes
  only a 7-day-active flag. Listing a retention target without an instrument is what
  this file exists to stop.
- **CAC, LTV, pricing elasticity, willingness to pay.** No instrument, no owner —
  CCO and CMO are not active.
- **Uptime, error rate, deploy frequency.** Monitoring and alerts are not configured.
- **Cost per active organization** — the first genuine unit economic. Available at
  roughly 5 pilot organizations: the denominator is already instrumented by
  `npm run report`, the numerator arrives with the first billing reading. Flagged
  now because **Decision 011 commits to building pricing with no cost figure
  underneath it, and a price set without knowing cost per organization is a guess
  wearing a decimal point.**
