# Decision 012 — One free organization per person, counted by who created it

**Status:** ✅ Accepted
**Date:** 2026-09-01
**Deciders:** Founder (Human-Held authority, `roles.md` §2) — answered D-005 with Option A
**Consulted:** Product Owner (product scope and the exits), Security Engineer / CISO
(enforcement point, the bypass, the sibling limits)
**Closes:** D-005, open in `PROJECT_STATE.md` since 2026-08-25
**Related:** Decision 001 (freemium), Decision 003 (interiors and plan quotas),
Decision 006 (an administrator creates every member account), Decision 011 (billing
before market)

---

## Context

The free plan gives each organization 1 location and 10 interiors. Nothing stopped
one person creating ten free organizations and taking ten times the free allowance.
The paid plans would then sell something the free plan already gave away.

This hole was never opened deliberately. Decision 001 describes limits *inside* one
organization; `CLAUDE.md`'s non-negotiables separately require that one person can
manage several organizations. Both are true. Nobody joined them up.

## Decision

**A person may create one free organization.** Additional organizations require a
paid plan, or an invitation from someone who already has one.

**The limit counts creation, never membership.** Being added to any number of other
organizations by their administrator (Decision 006's path) is unlimited and
unaffected. This distinction is load-bearing: `CLAUDE.md`'s "one user can manage
multiple organizations" and requirement US-009 both survive only if the count is of
organizations a person created on a free plan. A naive "one organization per user"
would break a shipped, tested requirement.

**Existing organizations are grandfathered.** The limit applies at creation time
only. This matters immediately — the Founder's own account and the test data
predate it.

## What is counted, exactly

Inside a transaction on the org-creation path, read the person's membership list and
count the organizations where **all three** hold:

- `created_by` is this person, **and**
- `plan` is `free`, **and**
- `status` is not `deleted`.

Refuse at one or more, before any write.

The third condition is not a detail. `DELETE /orgs` is a soft delete and does not
remove the membership. Counting memberships alone would permanently lock out anyone
who deleted their first organization.

## How it is enforced

`POST /orgs` currently uses a Firestore batch, which performs no reads and therefore
cannot carry a precondition. Adding a read in front of the batch would be a
check-then-write race: two requests arriving together would both read "zero" and both
create. **The handler becomes a transaction**, following the pattern already
established in `backend/src/lib/quota.ts` — the person's own user document is the
contended document, so a concurrent creation forces a retry.

The refusal carries **its own error code**, not `quota_exceeded`. That code means
"buy more capacity for this organization" and its way out is different. A distinct
code is what lets the screen show a different message with different exits.

There is no second enforcement point: Firestore rules deny all client access
(Decision 004), so the backend is the only writer.

## What a person hits, and how they get out

At the limit, the "create organization" action is **removed rather than shown and
then refused** — the rule the setup screens already follow. The server refuses
independently, whatever the screen showed.

Three exits, in this order:

1. **Be added to an existing organization** by its administrator. Built today.
2. **Delete or hand over the organization you have.** Built today.
3. **Register interest in a paid plan.** ⚠️ **This exit does not exist yet.** Until
   billing ships, the screen must not show an upgrade button — a button that leads
   nowhere is the dead end this decision exists to prevent. Whether exit 3 appears at
   all as a contact channel is an open Founder call.

The Spanish wording belongs to Content Strategist / Copywriter; the screen treatment
to UI/UX Designer.

## When it ships

**With the billing unit, not before.** The specification is recorded now; the
enforcement code lands when exit 3 is real. There are no customers, so nothing is
being abused today, and shipping a wall before the commercial exit exists trades a
zero-cost risk for a worse first-run experience during exactly the discovery period
Decision 010 opens.

## What this limit is, and what it is not

**It is an accounting control, not a security control.** It stops the honest customer
who would otherwise click "create another building" for a second free allowance, and
it gives the paid plan something to sell.

**It stops nobody who wants to abuse it.** Nothing in the product checks
`email_verified` today, so a second account costs about eight seconds. Even with
verification enforced, one real inbox yields unlimited accounts through `+tag` and
dot variants, which Firebase treats as different addresses. The bypass cost never
rises above trivial through identity deduplication.

Anyone presenting this limit as a defence against abuse is misdescribing it. Security
Engineer declined to sign off on that framing, and that dissent is recorded here
rather than resolved.

## Agreed alongside it: no identity profiling to police a free tier

Device fingerprinting, linking accounts by internet address, and phone-number
verification would each store a new class of personal data about our customers in
order to enforce a free plan. That contradicts Decision 008's reasoning for refusing
to keep a guard's address and device, and Decision 005's reasoning for holding no
phone numbers.

**The correct answer to "we cannot tell these two accounts apart" is to accept it,
not to start profiling.** Revisiting this is a fresh decision with Regulatory & Data
Privacy Counsel consulted, never an implementation detail.

## What this does not close

Answering D-005 resolves one of three limit questions. It makes the other two **more**
attractive, because every free user is now concentrated into a single organization:

- **Permits per organization are still uncounted** — and unlike entry records, permits
  have no expiry policy at all, though `data-minimization.md` promises one.
- **Accounts per organization are still uncounted.** Security Engineer raised this as
  the more serious of the two: any administrator can create Firebase accounts for
  arbitrary email addresses, each of which triggers a Google-sent email naming the
  recipient. With this decision in force it becomes the only expansion route a free
  customer has. **A blunt cap is needed before the URL is publicised.**

Both were parked against D-005's card. They are not resolved by answering it.

## Predicted outcome & indicator

**Predicted:** once enforcement ships with billing, no person holds more than one
self-created free organization, and the first paid conversion is triggered by this
wall rather than by a capacity limit inside an organization.

**Indicator:** self-created free organizations per person — target maximum 1, measured
against live data at each checkpoint after enforcement ships. Before then the
indicator is not measurable and must not be reported as met.

**Reviewable from:** the first paid plan going live.
