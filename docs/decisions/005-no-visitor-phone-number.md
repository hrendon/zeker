# Decision 005 — A permit does not collect the visitor's phone number

**Status:** ✅ Accepted
**Date:** 2026-08-26
**Deciders:** Founder (approval), Security Engineer (proposal), Product Owner + Architect (consulted)
**Supersedes:** the "encrypt phone numbers at rest" part of `security/data-minimization.md`
and `product/requirements.md` US-003, for the MVP.

---

## Context

An entry permit names the person being let in. The original design also allowed
an optional phone number for that person, stored encrypted with Cloud KMS.

Two things forced this to be decided before the permit endpoints were built:

1. **The encryption design could not be built as written.** It said the browser
   encrypts the number before sending it. A browser cannot hold the Cloud KMS
   key — giving it one hands the key to every user. Encryption would have to
   move to the server. This was recorded as an open item in `architecture.md`.
2. **Nobody had established what the phone number is for.** In the MVP, the
   resident creates a permit and shares the code with their visitor themselves.
   Nothing in the product sends the visitor anything.

The visitor is not our user. They never signed up, never agreed to anything, and
have no account. Holding their phone number means holding personal data about a
person who has no relationship with us — the hardest kind to justify under
Ley 1581/2016, which requires a purpose and consent.

---

## Alternatives considered

**A. Collect it, encrypted on the server with Cloud KMS.**
Faithful to the original design and enables sending the permit straight to the
visitor later. Costs roughly a day: a KMS encrypt/decrypt path, key permissions,
error handling when KMS is unreachable, and a decrypt path for every read.
It also creates a permanent obligation — a personal-data store to protect,
disclose in the privacy policy, and delete on request.

**B. Do not collect it at all.** ✅ Chosen
The permit carries the visitor's name and nothing else about them. The resident
shares the code however they already talk to that person.

**C. Collect it unencrypted.**
Rejected. Cheapest to build and the worst outcome: personal data about a
non-user sitting in plain text, contradicting the project's own minimization
rules.

---

## Decision

**A permit stores the visitor's name and no other personal data about them.**
No phone number, in any form, encrypted or not.

---

## Rationale

The number had no job in the MVP. Collecting personal data "in case we need it
later" is exactly what the project's data-minimization rule exists to prevent.
Option A would have bought a feature nobody asked for, at the price of a day's
work and a permanent legal responsibility.

---

## Consequences

**The application-level encryption problem disappears for the MVP.** After
Decision 002 removed the user's stored email and phone, and Decision 003 removed
the organization address and phone, the visitor's phone number was the last
field that would have needed Cloud KMS. Nothing in the MVP now does.

- The `zeker-encryption-key` in Cloud KMS stays in place, unused. It costs
  nothing and will be needed if any of these decisions is revisited.
- Firestore's own at-rest encryption (Google-managed keys) still applies to
  everything, as it always did.
- The open item in `architecture.md` §Encryption Strategy is closed by this
  decision rather than solved.

**What we give up:** we cannot notify or message a visitor. Sending someone
their own entry code, an arrival reminder, or a cancellation notice is not
possible without re-opening this decision. If that feature is ever wanted, the
right shape is likely a share link the resident sends, not a number we store.

**Cost if revisited:** roughly one day, and it must be paired with a consent
mechanism for a person who is not our user.

---

## Affected artifacts

- `security/data-minimization.md` — phone number rows removed from Tier 2
- `architecture/architecture.md` — encryption open item closed
- `architecture/api.md` — `phone` / `phone_encrypted` removed from the
  authorization endpoints
- `architecture/data-model.md` — `authorized_person.phone_encrypted` removed
- `product/requirements.md` — US-003 no longer lists an optional phone number
