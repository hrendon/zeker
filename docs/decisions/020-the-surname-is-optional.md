# Decision 020: The surname stops being required

**Date:** 2026-09-05
**Status:** ✅ Approved — built
**Deciders:** Founder + Security Engineer / CISO
**Extends:** the data minimization rules (Decisions 005 and 007)

---

## What prompted it

The Founder asked, while looking at what Zeker stores about a resident:
*"¿y si en ese campo no se pone el nombre completo, solo el nombre y ya?"*

It is a data minimization proposal from the person who decides scope, and it is
right in direction — with one correction that has to be said plainly.

## The decision

**A surname is no longer required anywhere:** not when an administrator adds a
person, not when somebody creates their own account, not when a person corrects
their own name. A visitor's name was already one free-text field and always
could be just a first name.

An empty surname is **not written** rather than written as an empty string, and
a person who already has one **can remove it** — otherwise the product only
ever collects more.

## What it buys, and what it does not

**What it buys:** if the list ever leaves our hands, a loose *"302 = María"* is
worth much less to a stranger than *"302 = María García"*. It lowers the damage
of a leak.

**What it does not buy, and this is the correction:**

* **The email sits right beside the name and is required** — it is how the
  person signs in — and emails routinely contain the full name.
* **Inside the building, "302 = María" identifies as well as the full name
  does.** Whoever holds the list already knows which building it is.

So this is a real improvement to one risk and no improvement at all to R-01.
Recording that distinction is the point: a change that feels like privacy but
is not is worse than no change, because it stops the conversation.

## Consequences

* `POST /orgs/{orgId}/members` and `PUT /auth/me` accept a name with no surname.
* Every screen that shows a name already joined and trimmed the two halves, so
  a missing surname renders as just the first name with no work.
* The labels say **"Apellido (opcional)"** — a field that is optional and does
  not say so is a required field with extra steps.
