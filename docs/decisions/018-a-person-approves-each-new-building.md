# Decision 018: A person approves each new building

**Date:** 2026-09-04
**Status:** ✅ Approved — to be built
**Deciders:** Founder (D-006, open since 2026-08-27) + Security Engineer / CISO
**Answers:** D-006. **Closes:** R-01, the oldest 🔴 in the register
**Depends on:** R-02's caps, built the same day

---

## What prompted it

R-01 has been the project's most serious open risk since 2026-08-27, and it is
one sentence: **nothing checks that whoever registers a building actually runs
it.**

Held together, our records say where a named individual lives — *"apartment 302
= María García"*. The legal justification for storing that under Ley 1581/2016
is that the building's administration is managing access to its own property. If
the person who created the organization is not that administration, **the whole
justification is gone**, and what remains is a stranger holding a list of who
lives where.

The only control until today was that the address had not been advertised. That
is security by obscurity on a public Cloud Run deployment, and the Founder
decided on 2026-09-04 to remove exactly that protection: *"quiero que el mercado
decida."*

Security Engineer answered the *how* on 2026-08-27 and the answer has not
changed: **manual approval is the only mechanism that proves anything.** Every
automatic alternative — a phone number, a document upload, an email domain
check, a payment — either proves nothing about who runs a building, or collects
exactly the personal data this product refuses to hold.

## The decision

**A new organization is created immediately, and stays unapproved until a person
approves it.**

### What an unapproved building can do

Everything that concerns **only its creator**: create the organization, add its
entrances, add its interiors, look around, sign out and come back.

### What it cannot do

Anything that puts **a third person's data into the system**:

* **It cannot add people.** No member, no invitation, no Firebase account
  created for somebody else, no email sent by Google carrying our name.
* **It cannot issue permits.** A permit holds a visitor's name — a real person
  who never agreed to anything.

**That boundary is the whole decision, and it is chosen precisely:** the line is
not "can the product be used", it is "can data about somebody other than the
account holder enter it". A stranger setting up a fictional building on their own
is harmless and reversible. A stranger collecting the names of a real building's
residents and visitors is the thing R-01 describes.

### Who approves, and with what

**The Founder, using an operator script** — `scripts/aprobar-organizacion.sh` —
which lists what is waiting and flips the flag.

**Not an in-product admin screen, deliberately.** The same reasoning as
`backend/scripts/platform-report.ts`: a route that could approve any customer's
organization would be a privileged role *inside* the product, and since Decision
004 the backend's own membership check is the only thing keeping one customer out
of another's data. A privileged role inside that wall is a hole in it. The script
reads Firestore directly as whoever runs it, governed by Google IAM — take away
that person's project access and it stops working, with nothing to revoke inside
Zeker and no account to steal.

### What the administrator sees

A clear Spanish state on their own screens saying the building is being reviewed
before it is activated, and what they can do meanwhile (set up entrances and
interiors).

**It must not promise an email.** Zeker sends no email of its own — that is a
standing fact, not a temporary one — and a screen that says *"le avisamos"* is a
screen that lies.

## What this costs, honestly

* **It puts the Founder in the path of every new customer.** At zero customers
  that is minutes and it is also free market research. At a hundred a week it is
  a job, and the decision is reversed or automated then, not now.
* **It is a wall in front of the thing we are trying to measure.** If the market
  is meant to decide, every approval delay is a person who came and could not
  finish. **This is the real cost and it should not be minimised** — the
  mitigation is that approval takes seconds and the Founder is watching.
* **An unapproved administrator has no way to reach us.** Zeker has no contact
  address, D-008 is unanswered, and the domain that would give us
  `hola@zeker.com.co` does not resolve yet. So a person stuck on that screen has
  no next action — **which is exactly the failure the interface audit has already
  found four times.** Named here as a known gap, not solved by this decision.

## What was considered and rejected

| Option | Why not |
|---|---|
| **Open registration, risk accepted** | The Founder was offered it and did not take it. It is the fastest path to market evidence and the one that exposes real people's data with nothing standing in the way |
| **No public registration; the Founder hands the address to buildings they choose** | Also offered. It removes the exposure completely and reaches fewer people. Kept as the fallback if approval turns out to be a wall |
| **An automatic check** — phone verification, a document, a company email domain | Proves nothing about who runs a *building* (administrators use personal Gmail), and every version of it collects data Decisions 005 and 007 refused to hold |
| **Approve at first invitation instead of at creation** | Same boundary, later, and it moves the wall to the moment the customer is most engaged — the worst possible time to stop them |

## Consequences

* `orgs/{orgId}` gains an approval state. **Absent means approved**, so the
  organizations that exist today are unaffected — the alternative would lock the
  Founder out of their own test building.
* The member and permit routes gain one refusal each, with its own error code so
  the screen can say what actually happened rather than "no permitido".
* **R-01 closes when this is built and proven, not when this is written.**
* D-008 (how somebody contacts us) stops being a small copy question and becomes
  a prerequisite for this to be humane.

## Predicted outcome & indicator

**Predicted:** a stranger can create an organization and set up their building,
and cannot cause a single email to be sent or a single visitor's name to be
stored, until a person has approved it.

**Indicator:** the count of organizations that were created, never approved, and
never caused a member or a permit to exist. **A number above zero is this
decision working**, and each one is also a discovery conversation the Founder did
not have to ask for.

**Checked by:** Security Engineer, once real signups exist.
