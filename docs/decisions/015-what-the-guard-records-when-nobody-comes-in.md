# Decision 015: What a guard records when nobody comes in

**Date:** 2026-09-02
**Status:** ✅ Approved — to be built after Decision 014's unit
**Deciders:** Founder + Security Engineer / CISO + Product Owner
**Extends:** Decision 008 (checking a permit at a door), Decision 014 (a permit
is used, and it says so)

---

## What prompted it

Decision 014 left a hole on purpose: a one-entry permit scanned by mistake stays
spent. The Founder named the fix in their own words — *"la plataforma debería
tener alguna opción para que se ponga la observación o comentario."*

## The decision

**1. The guard touches a reason. The guard does not write.**

Four fixed options after a check:

* **El visitante no entró**
* **Lo envié a otra entrada**
* **Dijo que vuelve más tarde**
* **Pedí confirmación al residente**

**Free text was considered and rejected.** A guard is rotating staff from a
contracted security firm, not the customer's employee, typing with a person
waiting at the gate. Security Engineer's position, and the reason it holds:
what lands in that field in practice is ID numbers, phone numbers, physical
descriptions, and facts about third parties who consented to nothing. That is
the exact thing this project has now refused three times — no visitor phone
(005), not even empty document fields (007), no second copy of the visitor's
name in the event record (008). **A field that exists is a field somebody fills,
eventually, with what it must not hold.**

The proposed mitigation for free text — detecting an ID number or a phone
before saving — was also rejected, and not only on privacy grounds: at a gate it
fails in both directions, letting real personal data through while refusing a
legitimate note at the worst possible moment.

A fixed list is also the only version that can be counted. *"How many permits
were issued for people who never arrived"* is a question an administrator will
ask, and free text cannot answer it.

**2. "El visitante no entró" gives a one-entry permit back.**

The entry did not happen, so it is not counted. This is what actually solves the
problem at the door: the person can come back.

Three limits, without which it is a way to reuse a credential:

* Only within a short window after the check. Not hours later.
* The original record is **never** erased. A second record is added.
* It carries the name of whoever did it, and the time.

**3. What this cannot do, stated plainly.**

It does not stop a dishonest guard from letting somebody in and then marking
"no entró". Nothing at this layer can. What it does is **leave it written** —
who, when, and against which permit — which is what a security product can
honestly offer. Accepted by the Founder with that limitation named.

## Consequences

* A check gains an optional reason, from a closed list, on the event record. It
  is deleted with the event it belongs to — 90 days for an entry, 30 for a
  refusal — and inherits every retention rule already in place.
* A correction is a new event, not an edit. The history stays append-only.
* The gate screen gains four buttons that must be usable with one hand, in the
  sun, with somebody waiting.
* An administrator can finally see the difference between a permit that was
  never used and one whose visitor never arrived.
