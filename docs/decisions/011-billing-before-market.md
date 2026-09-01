# Decision 011 — Billing and subscriptions must exist before going to market

**Status:** ✅ Accepted
**Date:** 2026-08-31
**Deciders:** Founder (Human-Held — this is a go-to-market and revenue call)
**Relates to:** Decision 001 (freemium model; pricing decided after seeing usage),
Decision 010 (the segment), D-005 (unanswered: free-organization limits)

---

## Decision

**The product does not go to market until it can take money.** The payment and
subscription model — plans, upgrade path, and charging — is part of being
market-ready, not a phase that follows it.

## Why

The framework's own operating model states it plainly: revenue is the test, not
a side effect. A product that cannot be paid for produces users, not customers,
and the two answer different questions. Going to market without billing would
mean discovering demand and then asking those people to wait — which is when
interest goes cold.

## What this does not change

**Decision 001 still holds: the price is set after seeing real usage.** These are
not in tension, and the distinction matters enough to state:

- **The machinery** — plans, limits, upgrade flow, a payment processor — is built
  before market. That is this decision.
- **The number** — what a building actually pays per month — comes from watching
  what pilot customers do. That is Decision 001, unchanged.

Building the machinery does not require knowing the final price. Launching does.

## What must happen first

**D-005 is now blocking, and was not before.** It asks how many free
organizations one person may create — which is another way of asking what the
free tier actually is. There is no way to build an upgrade path from a free plan
whose boundary has never been defined. It moves from "not blocking today" to a
precondition of this work.

The same applies to the two uncounted limits already recorded in Known Issues:
nothing caps how many permits a customer may issue, and nothing caps how many
accounts an organization may create. Both are exactly the kind of limit a paid
tier is sold against.

## Consequences

- Payment / Fintech Specialist and Risk & Fraud Analyst are registered, and
  activate when this work starts (`roles.md`, framework 1.4.0).
- A payment processor is a recurring cost and per-transaction fee. It is a 🟡
  Budget Gate decision against `docs/business/budget.md`, proposed with its cost
  rather than adopted. Colombia's practical options differ from the default
  assumption of Stripe, and that comparison is its own piece of work.
- Regulatory & Data Privacy Counsel and Compliance Officer become relevant once
  card data is in the picture, and neither is active.
- **This lengthens the road to market.** That is the trade the Founder is making
  deliberately: fewer, later conversations with buyers who can actually buy,
  rather than earlier conversations that cannot convert.

## Predicted Outcome & Indicator

**Predicted:** the first customer conversation that ends in agreement can be
converted to a paying subscription in the same week, rather than parked until
billing exists.

**Indicator:** time between a customer saying yes and money arriving. If that gap
is still weeks, this decision did not buy what it was meant to buy.

**Checked by:** Decision & Outcomes Auditor, at the first such conversation.
