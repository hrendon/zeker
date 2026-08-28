# Decision 006 — A responsable is an account, created by the building administrator

**Status:** ✅ Accepted
**Date:** 2026-08-28
**Deciders:** Founder (decision), Product Owner + Architect + Security Engineer (consulted)
**Resolves:** D-007 in `PROJECT_STATE.md`
**Extends:** Decision 003 (an interior has a responsable who issues permits for it)

---

## Context

Decision 003 established that the person in charge of an interior — the
*responsable* — issues entry permits for it. That is the part of the product
that removes work from the building's office: a resident invites their own
visitor without asking anyone.

The interior document has always had a `responsable_user_id` field for this, and
the API already refuses to link an account that does not belong to the
organization. But the step before that did not exist: **there was no way for a
person to become a member of an organization at all.** The only way to create an
organization membership was to create the organization, which makes the creator
its administrator. So in practice an interior's responsable was
`responsable_name` — text typed by an administrator, with no account behind it
and no way to sign in.

Entry permits are the next unit of work and cannot be built correctly on top of
that. This was raised as D-007 on 2026-08-27 and answered on 2026-08-28.

It was a scope question first: letting people join an organization is the
beginning of member management, which `architecture/api.md` placed outside the
MVP.

---

## Alternatives considered

**A. The administrator creates the person's account.** ✅ Chosen
The administrator adds a person by email address and name and gives them a role.
The system creates a Firebase account if that email has none, adds the
organization membership, and the person receives an email to set their own
password.

**B. A join code per interior.**
The administrator generates a code for one apartment and passes it to the
resident by whatever channel they already use. The resident signs up and enters
the code. Cheaper by roughly half a day and stores nothing about the resident
until they act — but it makes the building's roster depend on residents
completing a step, and it gives the administrator no way to add security staff,
who need accounts within days for the same reason.

**C. Skip residents; the administrator issues every permit.**
Fastest path to a working door scan, and permits would still function — an
administrator may issue a permit for any interior. Rejected because it postpones
the thing that makes the product worth paying for, and the resident experience
would still have to be built before launch.

---

## Decision

**1. A responsable is a real account, and only a building administrator creates
one.** An interior's responsable is a member of the organization with an
account, not typed text.

**2. Every interior always has a designated responsable.** An interior cannot
exist without one. Founder's reasoning: an interior with nobody designated has
nobody to issue its permits.

**3. When the resident's email is not known yet, the administrator designates
themselves.** The rule in (2) always holds, a large building can be set up in
one sitting, and handing an interior over later is one change on one screen.

**4. One screen adds people, with a role.** The administrator adds a person and
says what they are — responsable of an interior, or security staff at the gate.
Security personnel need accounts for the same reason and by the same route.

**5. The responsable's name comes from their account.** The free-text
`responsable_name` field is removed from the interior. The administrator picks a
person instead of typing a name, and the name shown is the account's name.

---

## Rationale

The email problem that made this look expensive does not exist. The original
D-007 card said option A "needs a way to send email, which the product does not
have yet". That was wrong: Firebase Auth sends password emails itself, and the
product has been using it since the password-recovery screen was built. There is
no email service to buy, build or operate.

**Nothing new is stored about a resident.** The email address goes to Firebase
Auth, which is already the system of record for every user's email (Decision
002). Our database keeps the account link and the person's name — the same two
things it already keeps for an administrator. The project's data-minimization
rule is unaffected.

Single source of truth for the name (5) follows from the account existing: two
names for one person drift apart, and the person themselves is the right owner
of how their name is spelled.

---

## Consequences

**A breaking change to the interior endpoints.** `responsable_name` is removed
from create and update; `responsable_user_id` becomes required on create and
may no longer be set to null. Existing interiors created with a typed name and
no account are test data only — there are no customers. `api.md` and
`data-model.md` are updated to match.

**Member management enters the MVP**, narrowly: add a person, list the people in
an organization, remove a person. Removal is included deliberately — a product
about physical access with no way to withdraw someone's access is a security
gap, not a missing convenience. Removing a person is refused while they are the
responsable of an interior, matching how locations and interiors already refuse
to delete something still in use.

**Adding a person is uniform whether or not the account already exists.** The
API answers the same way and the browser sends the same "set your password"
email either way. An administrator therefore cannot use this screen to discover
whether an email address belongs to an existing Zeker user. This is the same
refusal to be helpful that sign-in and password recovery already make
(`architecture/design.md`), applied to an authenticated caller.

**An administrator can create Firebase accounts.** That is a new power and it is
metered by nothing today. The free plan's 10-interior limit bounds how many
responsables a free organization needs, but not how many people it may add. This
is recorded as a known issue rather than solved now.

**Roles an administrator may grant are `responsable` and `security` only.**
Granting `admin` is not part of this decision; a second administrator for one
building has not been requested.

**What we give up:** a resident cannot join a building on their own initiative,
and cannot be added by anyone but an administrator. If self-service joining is
ever wanted, option B can be added on top of this without changing anything
built here.
