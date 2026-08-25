# Decision 004: Backend-Only Firestore Access (Deny All Client Access)

**Date:** 2026-08-25
**Owning Role:** Security Engineer
**Approved by:** Founder / CEO
**Status:** ✅ DECIDED

---

## Context

The Firestore security rules applied during infrastructure setup
(`scripts/setup-firestore-rules.sh`, 2026-08-19) were deliberately permissive:

```javascript
match /{document=**} {
  allow read, write: if request.auth != null;
}
```

Any signed-in user could read and write **every document in every
organization**. This was accepted at the time as temporary, with granular
role-based rules planned for Week 2.

The problem: multi-tenant isolation is a project non-negotiable
(`CLAUDE.md`), and it did not actually hold. Any authenticated user with the
public Firebase web config — which is public by design — could query another
organization's authorizations, personal data, and access logs directly from a
browser, completely bypassing the backend.

Two further problems with the rules as they stood:

- The rules file was written by a script, applied, and then **deleted**
  (`rm -f "$RULES_FILE"`). The live rules existed nowhere in the repository, so
  no one could review, diff, or roll them back.
- `firebase.json` referenced `firestore.rules`, a file that did not exist.

---

## Alternatives Considered

### Option A — Deny all direct client access now ✅ CHOSEN

One rule: clients cannot touch Firestore at all. Only the backend reaches the
database, through the Firebase Admin SDK, which bypasses security rules by
design.

- Every operation in the product **already** goes through the backend. Nothing
  in the application depends on direct client access.
- The strongest isolation guarantee available: there is no client-side path to
  the data, so there is no client-side path to another tenant's data.
- Roughly 30 minutes of work, no effect on how the product behaves.

### Option B — Write granular per-role rules in Week 2, as originally planned

- More faithful to the original plan, and would allow direct client reads later.
- But several days of work, requiring `get()` lookups per rule evaluation (which
  cost reads and add latency), and the exposure stays open the entire time.

---

## Decision

**All direct client access to Firestore is denied. The backend, using the
Firebase Admin SDK, is the only path to the data.**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Clients never reach Firestore directly. Every read and write goes
    // through the Zeker backend, which uses the Admin SDK and enforces
    // organization membership per request. See docs/decisions/004.
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### Supporting changes

1. **The rules live in the repository** as `firestore.rules`, tracked in git and
   deployed with `firebase deploy --only firestore:rules`. The script that wrote
   and then deleted a temporary rules file is corrected: rules are reviewable,
   diffable, and revertable like any other code.
2. `firebase.json` already points at `firestore.rules`; that reference becomes
   valid rather than dangling.

### Where isolation is now enforced

Multi-tenant isolation moves entirely into the backend, which must therefore
enforce it on **every** request:

- `requireAuth` establishes *who* the caller is (verified Firebase ID token).
- An organization-membership check establishes *what organization* they may act
  in, before any Firestore query that touches org-scoped data.
- This check is not optional per route. It is the only thing standing between
  tenants now.

**This is a hard requirement on all org-scoped endpoints and must be covered by
tests** — specifically a test proving user A cannot reach user B's organization
data.

---

## Consequences

- The frontend cannot use the Firestore Web SDK for data. It talks only to the
  Zeker API. (It still uses the Firebase Auth Web SDK — see Decision 002.)
- Offline PWA support (US-010) reads from a cache the frontend populates through
  the API, not from Firestore offline persistence.
- Real-time listeners are not available to the client. Not required by the MVP.
- The granular per-role rules drafted in `data-model.md` are **not deleted** —
  they are retained as a reference design should direct client access ever be
  needed. They are marked as not in force.

---

## Reversibility

**High.** Granular rules can be added later without a data migration.

---

## Cost Impact

**None — approximately 30 minutes.**

---

## Related

- `docs/security/data-minimization.md` — data handling policy
- `docs/architecture/data-model.md` — reference design for granular rules
- `docs/decisions/002-client-side-firebase-auth.md` — the client keeps Firebase Auth, loses Firestore
- `firestore.rules` — the rules in force
