# Decision 016: The days and hours a permit may be used

**Date:** 2026-09-04
**Status:** ✅ Approved — built the same day
**Deciders:** Founder (D-009, both halves) + Product Owner + Software Architect
**Extends:** Decision 014 (a permit is used once or many times)
**Partly reopens:** Decision 007, which removed the daily time window
**Answers:** D-009 in `PROJECT_STATE.md`, and R-08 / assumption A6 in
`docs/product/brief.md`

---

## What prompted it

The brief rewrite on 2026-09-04 consulted two domain roles separately — the
Residential Property Administration Consultant and the Physical Security
Consultant. Neither saw the other's answer. **Both said the same thing:** the
visitor a building deals with most is the one who comes back — the domestic
worker three days a week, the daily *domicilio*, the gardener — and the product
was described as unable to express that.

The Founder answered D-009 by choosing to build recurrence.

## The correction that changed the size of the work

**The consultants were reading Decision 007 and had not seen Decision 014**,
which shipped two days earlier. Checked against the code before anything was
designed:

* A permit can already be **`multiple`** — free entries until it expires
  (Decision 014, `entry_mode`).
* A permit can already last **up to 365 days** (`MAX_PERMIT_DAYS`).

So a resident could already issue **one** permit for the domestic worker,
running for months, with free entries. They never had to issue a fresh one per
visit. "The product has no recurrence" was not accurate.

**What is genuinely missing is narrower, and it is a security hole rather than a
convenience gap:** a permit valid for a year with free entries also opens the
door at 03:00 on a Sunday. A building that wants *"lunes, miércoles y viernes,
de 7:00 a 16:00"* cannot say so, and until it can, the long permit that solves
the recurring visitor is a long permit nobody responsible should issue.

The Founder chose the schedule, knowing this.

## The decision

**1. A permit may carry a weekly schedule: days of the week, and one range of
hours.**

Stored on the permit as `schedule: { days, from, to }` — `days` are 0 (Sunday)
to 6 (Saturday), `from` and `to` are `"HH:MM"`.

**2. Absent means no restriction.** Every permit issued before today has no
schedule and keeps working at any hour of any day. Reading a missing schedule as
"never" would revoke access nobody agreed to revoke — the same rule Decision 014
followed for `entry_mode`, for the same reason.

**3. The hours are the building's, not the reader's.** The organization gains a
timezone (IANA name, default `America/Bogota`). A resident travelling, or a
building administrator in another country, must not shift the hours a door
obeys.

**IANA names rather than a stored offset.** An offset is enough for Colombia,
which has never observed daylight saving, and is wrong the first time a customer
is in Santiago or Mexico City — wrong *silently*, by one hour, for half the
year. The runtime already carries every zone's history; a number in our database
would not.

**4. A window never crosses midnight.** `to` must be later than `from`. A night
shift (22:00–06:00) cannot be expressed, and the refusal says so and says what
to do instead: make two permits. The alternative is a wrap-around window whose
"which day is this" question has to be answered on the gate's hot path, and no
customer has asked for one. **This is a real limitation, recorded as one.**

**5. At the gate it is its own refusal, before the entrance is considered.**
The order is now:

```
no such code → revoked → already used → not started → finished →
outside its days and hours → wrong entrance
```

`outside_schedule` sits on the permit's side of the line that separates the
permit's own state from where the guard is standing. A visitor arriving on the
wrong day must never be told "try the other gate", where the answer would be
exactly as negative.

**6. The guard is told the schedule itself.** Alone among the refusals except
"ya se usó", this one is temporary: the visitor may come back. The gate screen
shows *"Sirve: de lunes a viernes, de 7:00 a. m. a 4:00 p. m."* A refusal that
does not say when is just a closed door, and at a real gate it becomes an
argument the guard has to win.

**7. The building's timezone is read only when a permit has a schedule.** The
gate is the one path in this product where a person is standing at a door
waiting, and most permits carry no schedule.

## What was considered and not done

* **Building this before talking to a customer.** R-08 says not to build
  recurrence on speculation, and it is still right. The Founder was told this,
  chose to build, and the choice is recorded as theirs. **The assumption it
  rests on (A5: residents will use the app at all) is still untested.**
* **A separate "recurring permit" object** that generates one permit per
  occurrence. Heavier, and it multiplies the records a resident has to manage
  to solve a problem one field solves.
* **Making the timezone a required question when creating an organization.**
  It would put a question in front of every new customer to serve a feature
  most will not use. The default is Colombia's, and the field is editable, so a
  wrong default is a correction rather than a trap.
* **Per-day hours** ("Monday 7–16, Saturday 8–12"). One range for all chosen
  days is what a building says out loud. Two permits express the other case.

## Consequences

* A permit gains one optional field; the organization gains one.
* The gate does one extra read, and only for permits that have a schedule.
* `docs/product/brief.md`'s A6 moves from "the model cannot express this" to
  "the model can express this, and nobody has confirmed it is what a building
  wants". **That is a smaller claim, not a validated one.**
* Decision 007's removal of the daily window stands for the *permit's dates*.
  What returns is a weekly pattern, which is a different thing and is now
  possible because the building has a clock.

## Predicted outcome & indicator

**Predicted:** in the first discovery conversations, an administrator shown a
long permit restricted to three days and a range of hours describes it as what
they would use for their recurring visitors — rather than asking for something
else again.

**Indicator:** across the first five to eight conversations, how many say the
schedule is what they need, versus how many raise a case it cannot express
(per-day hours, night shifts, a visitor with no fixed day).

**Checked by:** Decision & Outcomes Auditor, once those conversations exist.
**Nothing here is validated until then.**
