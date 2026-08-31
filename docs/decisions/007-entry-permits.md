# Decision 007 — What an entry permit is, and what its code is

**Status:** ✅ Accepted
**Date:** 2026-08-29
**Deciders:** Founder (scope), Software Architect + Security Engineer (shape of the record and the code), UI/UX Designer + Frontend Developer + QA Engineer (consulted)
**Extends:** Decision 003 (a permit belongs to one interior), Decision 005 (a permit stores no visitor phone number), Decision 006 (a responsable is a real account)

---

## Context

Entry permits are the half of the product that makes money: a resident invites
their own visitor, and a guard checks a code at the gate. Everything they depend
on now exists — organizations, sites, interiors, and residents with accounts.

The written specification for permits in `../architecture/api.md` and
`../architecture/data-model.md` was drafted before Decisions 003, 005 and 006.
Read literally it contradicts all three, and two of its details are unsafe. This
decision records what was actually built and why it departs from that draft.

---

## Alternatives considered

The Founder answered four scope questions on 2026-08-29. Each is recorded with
what was not chosen, so a later reader can see the trade-off rather than only
the outcome.

**1. How much to build in one pass.** ✅ The creation side only — issue, list,
show the code, revoke. Checking a permit at a door is the next unit. Building
both at once was available and rejected: one unit is finished and verified
before the next starts (`../../mantis/execution.md` §3).

**2. How the QR is drawn.** ✅ A small library (`qrcode`, ~20KB) draws it in the
browser. A free external QR service needed no dependency but would have sent
every permit code to a third party — which leaks who is visiting which building.
Showing only the typed number was cheapest and was rejected because a guard
typing every code by hand is the slow experience the product exists to remove.

**3. A shareable link for the visitor.** ✅ Not built. US-004 asks for an
"ephemeral share link". A public page keyed by a permit code is a new
unauthenticated entrance to the product, and it would tell anyone holding the
link where a named person is going. The resident sends the QR image or the eight
characters through whatever they already use to talk to their visitor.

**4. A daily time window** (valid every day, but only 14:00–17:00). ✅ Not
built. A permit runs from one moment to another moment. The daily window is
closer to a school pick-up, but it needs each building's local time, which is
not stored, and it makes a refusal at the gate harder to explain to a guard.

Separately, **entry-notification email** (US-005) is not built. The product can
send no email of its own — Firebase Auth sends only password emails — so this
needs a paid notification service, a new supplier, and a privacy decision about
telling an outside company who visited whom. Deferred until real customers say
whether they want it.

---

## Decision

**1. A permit points at an interior, not a site.** Decision 003. The
`location_id` is copied from the interior when the permit is created — safe to
denormalize because an interior's site can never change, by design — so a guard
standing at one entrance can be checked against it in a single read.

**2. The code is randomly generated and never derived from the permit's id.**
The draft showed `auth_p1k2p9m` becoming `P1K2-P9M7`. That code alone admits
someone through a door, so anything predictable from a visible identifier is a
way in. Codes are eight characters drawn with the system's cryptographic random
source from a 32-character alphabet with no I, L, O or U — the letters a guard
misreads in bad light — giving about 1.1 × 10¹² possibilities. Uniqueness within
the organization is checked inside the same transaction that writes the permit.

**3. The QR image is not stored.** It encodes the code and nothing else, so the
browser draws it. Storing a base64 PNG on every permit would keep a picture of
data we already hold and multiply the size of each record for nothing.

**4. "Expired" is computed, never stored.** The stored status is only `active`
or `revoked`. Nothing runs on a schedule to mark permits expired, so a stored
"expired" would never arrive — and the three delete guards, which look for live
permits, would refuse forever because of a permit that ended last year. What a
permit *is* right now (`scheduled`, `active`, `expired`, `revoked`) is derived
from the dates at read time.

**5. A permit holds the visitor's name, where they are going, when, and why —
nothing else.** No identity-document fields, not even empty ones, and no
free-text note. A field that exists is a field somebody eventually fills in with
a cédula number.

**6. Who may act.** An administrator may issue, see and revoke any permit in the
organization. A responsable may do so only for the interiors they are in charge
of. Security staff may do none of it.

**7. Revoking keeps the record.** A permit that once opened a door is part of
the audit trail. Revoking marks it and stops the code working; it never deletes.

**8. A permit may not run longer than a year.** A visit is not a tenancy, and a
mistyped year should not produce a permit that admits someone until 2125.

---

## Rationale

Points 1 and 5 are the three prior decisions applied rather than re-argued.

Point 2 is the one place where the draft was actively dangerous. Once a code
alone is sufficient to enter, that code is a credential, and the usual rule for
credentials applies: unguessable, generated from a real random source, and never
recoverable from anything the holder can see. The unambiguous alphabet is not
cosmetic either — a guard who reads "0" as "O" and is turned away has been
failed by the system, so typed codes are folded onto the characters they are
mistaken for before being checked.

Point 4 was found by reading the existing code rather than the document: the
interior, site and organization delete guards all query `status == "active"`.
Left as drafted, one finished permit would have made its apartment undeletable
for good, and taken its plan slot with it. The guards now also require the
permit's end date to be in the future.

Point 6 excludes security staff deliberately. A guard checks a code that is put
in front of them; a guard who can list a building's permits can see who is
expected where, all day.

---

## Consequences

**Three composite Firestore indexes are now required** — on `status + valid_to`,
`location_id + status + valid_to`, and `interior_id + status + valid_to` — for
the "still live" range query behind the delete guards. They are declared in
`../../firestore.indexes.json` and were deployed on 2026-08-29. This was found
by running the product against the live database, not by tests: the same query
succeeds against the in-memory test double and fails against Firestore with a
`FAILED_PRECONDITION`. **Deploying indexes is now part of shipping a query**, and
`developer-guide.md` says so.

**One new frontend dependency**, `qrcode`. Nothing leaves the device: the code
is drawn on the resident's own phone.

**`valid_from` and `valid_to` are stored as ISO 8601 strings in UTC**, not
Firestore timestamps. In UTC that form sorts lexicographically exactly as it
sorts chronologically, so range queries work on it directly, and the value
carries its own timezone rather than depending on how a reader converts it.
`created_at` and `revoked_at` remain ordinary server timestamps — they record
when something happened here, rather than a moment a user chose.

**Nothing limits how many permits a customer may issue.** The free plan caps
sites and interiors; permits are uncounted, and they are the record that
actually accumulates. No customer exists, so nothing is being abused, but this
belongs with D-005, which asks the same kind of question about free
organizations. Recorded as a known issue.

**US-004's share link and US-005's entry email are open**, and
`../product/requirements.md` now marks them as deferred rather than leaving them
looking built.

**What we give up:** a school that wants "may collect the child only between
14:00 and 17:00" cannot express that yet, and would issue a permit per
afternoon. If pick-up becomes a real segment, the daily window is added to the
permit record without changing anything decided here.
