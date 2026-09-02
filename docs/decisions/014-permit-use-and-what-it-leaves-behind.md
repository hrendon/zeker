# Decision 014: A permit is used, and it says so

**Date:** 2026-09-02
**Status:** ✅ Approved
**Deciders:** Founder + Product Owner + Software Architect
**Supersedes:** nothing. Extends Decision 007 (what an entry permit is) and
Decision 008 (checking a permit at a door).

---

## What prompted it

The Founder issued a permit from a phone on 2026-09-02 — the first time anyone
used the product end to end — and immediately found the gap: **nothing on any
screen says whether a permit has been used.**

Two things were missing at once, and only one of them was a display problem.

## The finding underneath the request

**Decision 007 never said how many times a permit works.** In the built product
a permit opens the door as many times as anyone likes until it expires. That was
never decided; it is what the code happened to do. A resident issuing a permit
for one visit has no way to say "once", and no way to find out it was used
twice.

## The decision

**1. The person issuing the permit chooses how it may be used.**

Two kinds, chosen when the permit is created:

* **One entry** — the permit stops working after the first person is let in.
  A visit, a delivery, a courier.
* **Free entries until it expires** — today's behaviour, made explicit. A
  domestic employee, a technician working across a day, anyone who goes in and
  out.

Rejected: keeping only one kind. Both cases are real in a residential complex,
and picking either one alone makes the product wrong for half of its users.

**2. The permit itself remembers that it was used.**

When a guard lets someone in, the permit records the time and counts the entry.
Rejected: asking the entry history each time. That answer needs a new database
index — the thing that has silently failed to be deployed three times (R-16) —
it costs one query per permit in a list, and **the history is deleted after 90
days for privacy** while a permit's own record is not. A permit that has been
used should still say so afterwards.

**3. A refusal at the gate names this reason like any other.**

Decision 008 established that a guard who is only told "no" cannot explain
anything to the person in front of them. "Already used" joins revoked, expired,
not started, wrong entrance and does not exist.

## What this does not decide

**Permits that already exist keep working as they do now** — free entries until
they expire. They were issued under a rule that had no other option, and
silently converting them to single-use would revoke access nobody agreed to
revoke.

**A permit burned by mistake stays burned.** If a guard scans a one-entry permit
and the person then does not come in, the permit is spent. Giving somebody the
power to reopen it is a real need and a real risk — it is the power to reuse a
credential — and it is deliberately not part of this unit. Raised as a risk
rather than solved by guessing.

## Consequences

* The create-permit screen gains one choice. It is the first question that
  changes what a permit *is*, so its wording matters more than its layout.
* The gate gains one refusal reason, and the guard must be able to read it in
  one glance in the sun.
* The permit list and detail gain a state: never used, used at a time, or spent.
* Two guards scanning a one-entry permit at the same instant must not both be
  told yes. The count and the decision are written together, or the rule is
  decoration.
