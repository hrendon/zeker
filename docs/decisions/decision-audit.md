# Decision Audit — Zeker

**Owner:** Decision & Outcomes Auditor
**Last updated:** 2026-08-31
**Status:** first audit on record

---

## How this works

Each decision is checked against what it predicted at the time it was made.
Only Decision 009 carries a "Predicted Outcome & Indicator" field; 001–008
predate it. For those, this audit reads what the decision stated or implied it
would deliver and compares that to what was built.

**No audit here judges whether a decision was the right one to make.** That
belongs to the owning role. This checks whether what was decided is what was
delivered.

---

## Findings, most severe first

### Decision 001 — the market scope moved, the market reasoning did not

**Severity:** 🔴 Must close before customers · **Status:** open

Decision 001 narrowed MVP scope from schools to generic locations, deferring
schools to a later phase. That was a valid scope call, recorded on 2026-08-19.

**It was never communicated back into the business case.** `docs/product/brief.md`
still argues that schools and daycares are the initial validation segment, and
still grounds the whole willingness-to-pay argument in parent pickup: the
liability, the school director as decision-maker, ~3,500 schools in Colombia.

What was built and deployed is residential: permits valid from one moment to
another with no daily window, visitor authorisation with no pickup role,
apartment-based rather than classroom-based. **The product solves the residential
problem well.** The document explaining why anyone would pay describes a
different product for a different buyer.

The pilot-recruitment plan inside that same brief still says to contact schools
in Bogotá — pointing first customer outreach at a segment this product does not
serve.

**Gap size:** large and standing. A prospect who reads the brief and then opens
the product sees two different propositions.

**Owner of the fix:** Product Owner rewrites the brief for the residential
market. Founder confirms the market choice has not changed. Neither is this
role's to do.

### Decision 008 — infrastructure declared, never deployed

**Severity:** 🟡 · **Status:** closed 2026-08-31

The retention rule that deletes old door checks was written into the repository
on 2026-08-30 and never switched on in Google. For as long as the product ran,
every check persisted, contradicting the 90/30-day retention promised in
`docs/security/data-minimization.md`.

Enabled and verified `state: ACTIVE` on 2026-08-31.

**Standing rule this leaves behind:** declaring infrastructure in the repository
is not deploying it. This has now happened twice — composite indexes on
2026-08-29, the retention rule on 2026-08-30. **A third occurrence is a systemic
problem, not a mistake**, and should be treated as one.

### Decision 009 — platform delivered, prediction not yet met

**Severity:** 🟡 · **Status:** outstanding, not blocking

Decision 009 predicted that within one session of deploying, the interface would
be reachable over HTTPS from a real phone and the camera would decode a real
permit for the first time. Its indicator: the first check in `access_events`
originating from a camera rather than a typed code.

The interface is deployed and reachable. The Founder completed a check using the
typed code. **The camera has still never decoded a real permit**, so the
indicator does not yet exist.

This is not a platform failure — Cloud Run delivered what was needed. The
prediction is simply untested, and testing it is next on the board.

---

## Decisions with no divergence

**002, 003, 004, 005, 006, 007** — predicted and delivered match. Each built what
was decided, and each trade-off recorded at the time is honoured in the product
that shipped. Decision 005's stated sacrifice (no way to message a visitor) and
Decision 007's (no shareable link, no daily time window, no entry email) are all
real in the built product, as intended.

---

**Methodology note:** from Decision 009 onward, every decision carries a
Predicted Outcome & Indicator, which makes later audits a comparison rather than
an interpretation. The eight before it can only be read for intent.
