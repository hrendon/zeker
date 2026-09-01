# Decision 010 — The market is residential and business complexes, not schools

**Status:** ✅ Accepted
**Date:** 2026-08-31
**Deciders:** Founder (the segment itself — Human-Held authority, `roles.md` §2)
**Raised by:** Decision & Outcomes Auditor and Customer Discovery & Validation Advisor, independently, on the same day
**Closes:** the 🔴 standing divergence recorded in `decision-audit.md`
**Supersedes:** the market half of `docs/product/brief.md`

---

## Context

On 2026-08-19, Decision 001 narrowed MVP scope from schools to generic locations.
That scope call was recorded and honoured — everything built since serves it.

**The business case was never moved with it.** `brief.md` still argued that
schools and daycares were the segment to validate, still grounded willingness to
pay in parent pickup and school-director liability, and still instructed that
pilot customers be recruited from schools in Bogotá. Two roles found this
separately on 2026-08-31: a prospect reading the brief and then opening the
product would see two different propositions.

## Decision

**The target market is residential complexes and business complexes** — gated
communities, apartment buildings, condominiums, and office or corporate parks.
Access control at a company entrance is the same problem the product already
solves.

**Schools are out of scope**, not deferred-but-assumed. If they return, it is as
a new decision with its own reasoning, not as an inherited default.

## Why this and not schools

The product that exists already fits this segment. Decision 007 deliberately gave
up the daily time window ("Fridays 3–5pm") that school pickup depends on, and
Decision 005 gave up the visitor phone number. A permit here is a visitor
authorised between two moments for one interior — which is how a building or an
office gate works, and is not how a school pickup works.

Choosing schools would mean rebuilding the permit model. Choosing this segment
means the product is already aimed at its buyer.

## Consequences

- `docs/product/brief.md` must be rewritten: the problem, the buyer, the reason
  anyone would pay, and the pilot-recruitment plan. **Owner: Product Owner.**
  Until that is done, the brief remains wrong on record.
- Customer discovery targets building administrators and office facility
  managers, not school directors.
- Two of the roles activated on 2026-08-31 are now directly relevant: the
  Residential Property Administration Consultant for the first half of this
  segment, and the Physical Security Consultant for the corporate half, where
  access control sits alongside CCTV, guard rounds and evacuation.
- The Childcare & School Administration Consultant stays active but idle. It is
  not removed: if the school segment is ever revisited, that is the role that
  says whether the product could serve it.

## Predicted Outcome & Indicator

**Predicted:** conversations with building administrators and office facility
managers produce concrete, unprompted descriptions of the problem this product
already solves — rather than requests for features it does not have.

**Indicator:** across the first five to eight discovery conversations, the count
that describe a problem the current product solves as-is, versus the count that
require a capability it does not have. A majority in the second column means this
decision was wrong and the segment needs revisiting.

**Checked by:** Decision & Outcomes Auditor, once those conversations exist.
