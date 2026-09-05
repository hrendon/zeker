# Decision 019: A building registers with its NIT

**Date:** 2026-09-05
**Status:** ✅ Approved — built
**Deciders:** Founder (D-013) + Residential Property Administration Consultant + Security Engineer / CISO
**Answers:** D-013. **Amends:** Decision 018, which left the approval with nothing to check

---

## What prompted it

The Founder asked a question nobody had asked: **what documents does the
approval actually require?** Decision 018 built a wall and never said what gets
you through it. Checking the code rather than answering from memory: **the
approval required nothing at all.** The operator tool printed the building's
name, its city and how far it had been set up, and the Founder raised a flag.

That works at zero customers with the Founder watching. It stops working the
first time somebody wants to be let in who should not be.

## The decision

**Creating an organization requires the building's NIT.** It is stored as
digits, and shown to whoever approves the building.

### Why the NIT and not a document

The Residential Property Administration Consultant was asked what actually
proves, in Colombia, that a person administers a building, and — the question
that mattered — **what that person already has on their phone.**

| | Proves | Costs the person |
|---|---|---|
| Nothing (before today) | Nothing | Nothing |
| **The building's NIT** | That a real propiedad horizontal exists behind the name | **Seconds.** It is already saved: banks and suppliers ask for it constantly |
| The acta naming the administrator, or the chamber-of-commerce certificate | The person↔building link — the only thing that really does | **It is what makes people abandon the registration.** It has to be found, generated, scanned |

**The NIT does not prove this person administers this building, and nothing
automatic does.** What it does is make the name real, give the approver
something to check, and cost the honest customer nothing.

**And it is the same attribute a payment will carry.** D-011 chose payment as
the identity check; Security's reconciliation is that a payment proves something
only when it carries a NIT or a cardholder name checkable against the building.
**So both roads ask for the same number**, and asking for it now means billing
inherits a field that already exists.

### The trap, written down rather than pretended away

**For a natural person in Colombia the NIT *is* their cédula**, and a cédula is
on the never-store list in `docs/security/data-minimization.md`. Nothing in the
code can tell one from the other. The mitigations are the wording on the screen
— *"El NIT de la copropiedad, no el suyo"* — and this paragraph. **If the field
turns out to collect cédulas, it must be removed, not patched.**

### What is checked

The shape: 8 to 11 digits, dots and dashes stripped, stored as digits so that
`901.234.567-8`, `901234567-8` and `901 234 567 8` are one building rather than
three.

**The check digit is deliberately not verified.** The algorithm is easy to get
subtly wrong, and getting it wrong refuses a real customer at the door — a cost
much larger than the mistyped digit it would catch.

## What this does not solve

**The firm that administers twenty buildings.** Each conjunto is its own legal
person with its own NIT, and the employee who would register all twenty
**appears by name in none of the twenty documents.** Only an internal letter
from the firm ties them to it, and that letter is verifiable against nobody.
The consultant raised it; no mechanism here addresses it, and pretending
otherwise would be worse than naming it.

## Consequences

* `orgs/{orgId}` gains `tax_id`. **Absent means created before 2026-09-05** —
  the Founder's own buildings are in that state and keep working, exactly as
  Decision 018's approval flag did.
* `POST /orgs` refuses a building without it, and writes nothing when it does.
* The approval tool prints it, so approving is a comparison rather than a guess.
* **A cost the Founder should see:** a person with no NIT at hand cannot create
  a building at all. That is a wall in front of the market Decision 010 chose,
  on top of the one Decision 018 already built. It is reversible in an hour by
  making the field optional.

## Predicted outcome & indicator

**Predicted:** every building created from now on carries a number the approver
can check against the building the person says they administer.

**Indicator:** buildings created with a NIT that does not match the name, and
buildings abandoned at the creation screen. **The second number is the one that
would reverse this decision.** Neither is measurable until real signups exist.

**Checked by:** the Founder, at the first five approvals.
