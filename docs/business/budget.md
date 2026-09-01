# Budget — Zeker

**Owner:** Founder (the ceiling itself). FP&A Manager owns monitoring against it once activated.
**Set:** 2026-08-31
**Status:** Active

---

## The ceiling

**20,000 COP per month, total, across every service the project pays for.**

That is roughly US$5 at the exchange rates of late 2026 — the rate moves, the
peso figure is the binding one.

## The rule this expresses

Spend as little as possible. Use free tiers wherever a free tier does the job.
A paid plan is not chosen because it is more comfortable; it is chosen when the
free tier has actually run out and the work cannot continue without it.

The ceiling is a hard limit, not a target to grow into. Being far under it is
the expected state, not an opportunity.

## Why it is this low, deliberately

The project has no customers and no revenue. Until it does, every peso spent is
the Founder's own money funding an unvalidated bet. A low ceiling keeps that bet
small while the question that matters — will anyone pay for this — is still
unanswered.

## When it gets reviewed

**On real revenue, not on a calendar.** Once customers are paying, the ceiling is
reconsidered against actual income rather than against hope. At that point the
finance role decides what of that income is profit and what is reinvested into
the budget — that split is a finance decision under the Founder's approval, not
an engineering one.

Purchases recorded against this budget are part of the same review.

## What is being spent today

Everything currently in use sits inside a free tier:

| Service | What it does | Cost today |
|---|---|---|
| Cloud Run (`zeker-api`, `zeker-web`) | Runs the API and the site | Free tier; both scale to zero when idle |
| Firestore | The database | Free tier |
| Firebase Auth | Sign-in | Free tier |
| Cloud KMS | Encryption key | Free tier at one key |
| Artifact Registry | Stores the built containers | Free tier at this size |

**Both Cloud Run services scale to zero on purpose.** Keeping an instance warm
would remove the slow first load a visitor sees, and would also be the first
recurring charge this project takes on. That trade-off belongs to the Founder
under this ceiling, not to an engineering preference for a faster page.

## How this is enforced

`mantis/execution.md`'s Budget Gate: introducing a tool, service or dependency
with a recurring or usage-based cost is 🟡 — it is proposed with its cost stated
and checked against this file, never adopted silently. Without this file it
would be a 🔴 hard stop.

**Open action:** the GCP billing alert created on 2026-08-19 has never been
checked against this ceiling. It should be set to warn well below 20,000 COP so
the alert arrives while there is still room, not after.
