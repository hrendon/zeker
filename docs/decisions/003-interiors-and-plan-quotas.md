# Decision 003: Interiors as a First-Class Level, and Plan-Based Quotas

**Date:** 2026-08-25
**Owning Role:** Software Architect + Product Owner
**Approved by:** Founder / CEO
**Status:** ✅ DECIDED

---

## Context

Decision 001 approved a freemium offer built on two units: **1 location** and
**up to 10 interiors** on the free plan, where an interior is a unit inside a
location — an apartment, a warehouse bay, a zone — that has a number and a
person in charge (*responsable*).

The technical design never contained that concept. `data-model.md` had only
`orgs/{orgId}/locations/{locationId}`, and capped it at "max 100 locations per
org (MVP limit)". As written:

- the free-tier limit the Founder approved could not be built at all;
- the product documents and the technical documents stated two different limits
  (1 vs. 100).

This blocked the location endpoints, quota enforcement, and the admin screens.

---

## Alternatives Considered

### Option A — Add interiors as a real level under a location ✅ CHOSEN

Matches the approved offer exactly. Roughly one day of design plus build.

### Option B — Rename existing "locations" to interiors, add a site level above

Less new structure, but every existing document, the QR flow, and the validation
flow would need rewording. The word "location" already appears throughout
`api.md`, `requirements.md`, and the backend. High confusion cost later.

### Option C — Drop interiors from the MVP, sell by locations only

Fastest, but it changes the commercial offer already approved in Decision 001.
A Founder-only decision, not a technical one.

---

## Decision

**Interiors become a real entity underneath a location (Option A), and resource
limits become plan-driven properties of the organization instead of a hardcoded
constant.**

### 1. New collection: `orgs/{orgId}/interiors/{interiorId}`

Interiors are stored as a **flat subcollection of the organization**, each
holding a reference to its location — not nested under
`locations/{locationId}/interiors/`.

**Rationale:** the approved quota is a *global* count across the whole
organization (Founder clarification, 2026-08-18: "the quota applies to total
interiors across all locations, not per location"). A flat collection makes that
count a single query and a single counter. Listing the interiors of one location
stays a simple `where('location_id', '==', ...)` filter. Nesting would buy
nothing and would make the global quota harder to enforce.

```firestore
orgs/{orgId}/interiors/{interiorId}
{
  "id": "int_a1b2c3",
  "org_id": "org_abc123",
  "location_id": "loc_entrance_1",     // required — the location it belongs to
  "number": "302",                     // required — apartment #, bodega #, zone
  "name": "Apartamento 302",           // optional display label
  "responsable_user_id": "user_xyz",   // nullable until the person has an account
  "responsable_name": "María García",  // required — shown to security personnel
  "enabled": true,
  "created_by": "user1",
  "created_at": <timestamp>,
  "updated_at": <timestamp>
}
```

**Constraints:**
- `number` is unique within its `location_id`.
- An interior cannot be deleted while active authorizations reference it.
- Deleting a location requires that it has no interiors.

**Indexes needed:**
- `location_id + number` (uniqueness check, per-location listing)
- `responsable_user_id` (a responsable's own interiors)

### 2. Plan limits move onto the organization document

The `max 100 locations` constant is removed. `orgs/{orgId}` gains:

```firestore
"plan": "free",                  // "free" | "paid_a" | "paid_b"
"limits": {
  "max_locations": 1,
  "max_interiors": 10            // TOTAL across the whole organization
},
"counts": {
  "locations": 0,
  "interiors": 0                 // maintained transactionally
}
```

Free plan values are fixed by Decision 001: `max_locations: 1`,
`max_interiors: 10`. Paid plan values stay **UNKNOWN** — Decision 001 records
that exact pricing and tier limits are decided after customer validation. The
`plan` field exists so those values can be set later without a schema change.

### 3. Quota enforcement

Creating a location or an interior runs inside a **Firestore transaction** that
reads `counts`, compares against `limits`, and either writes the new document
and increments the counter, or fails. This prevents two simultaneous requests
from both passing the check (the bypass the Architect flagged on 2026-08-19).

On refusal the API returns **403 Forbidden** with the error code
`quota_exceeded` and the details needed to name the limit:

```json
{
  "error": "quota_exceeded",
  "message": "This organization has reached its limit of 10 interiors. Upgrade the plan to add more.",
  "details": { "resource": "interiors", "limit": 10 },
  "request_id": "req_..."
}
```

**Correction made during implementation (2026-08-25):** this decision first put
the Spanish sentence from Decision 001 in the API response body. It does not
belong there. The API returns a machine-readable code plus a developer-facing
message; the interface turns `quota_exceeded` into the customer-facing Spanish
wording — *"Ya tiene 10 interiores. Mejore su plan para agregar más."* Putting
translated text in the API would mean the backend owning the product's language,
which breaks the moment a second language is added and leaves the rest of the
API's messages inconsistent with it. `details` carries the resource and the
limit so the interface can build the sentence without hardcoding numbers.

No warning threshold is implemented — the Founder specified hard blocking at the
limit, with no warnings.

### 4. Authorizations target an interior

`orgs/{orgId}/authorizations/{authId}` gains a **required** `interior_id`, in
addition to the existing `location_id`. A permit is issued by the responsable of
a specific interior, for a visitor coming to that interior.

`orgs/{orgId}/access_events/{eventId}` also records `interior_id`, so the audit
trail shows which interior a visitor entered.

**ASSUMPTION (accepted risk):** the MVP has no location-wide authorization —
every permit belongs to exactly one interior. A building-wide permit (e.g. a
maintenance contractor for the whole site) is not a stated requirement today.
If it becomes one, `interior_id` becomes nullable — an additive change.

### 5. Audit logging

Every interior creation is written to the audit trail, per the Security Engineer
position recorded in Decision 001.

---

## Consequences

**Documents to update:**
- `docs/architecture/data-model.md` — new collection, plan limits, removal of the 100-location cap, `interior_id` on authorizations and events
- `docs/architecture/api.md` — interior endpoints, quota error contract
- `docs/product/requirements.md` — new user story for interior management; US-002 and US-003 reference interiors
- `docs/architecture/design.md` — a single global quota bar, not per-location (UX Designer position, Decision 001)

**Work unblocked:** location endpoints, interior endpoints, quota enforcement,
admin screens.

**Not affected:** authentication, the QR/validation mechanism itself, multi-org
isolation.

---

## Reversibility

**Medium.** It changes the shape of the database. Reversing after customer data
exists would require a migration.

---

## Cost Impact

**Low — approximately 1 day** of design plus build.

---

## Implementation notes (2026-08-25)

Built as decided, with three clarifications made while building:

- **No `responsable` address, phone or email.** The decision listed only a name
  and an optional user link, and that is what was built. Contacting a
  responsable goes through their user account.
- **`location_id` is immutable after creation.** The decision did not say.
  Allowing an interior to move between locations would carry its existing
  permits to a different building, which is never what someone means. Creating
  a new interior is the correct way to express that.
- **Uniqueness of `number` is enforced inside the same transaction as the quota
  check**, not as a separate step, so two simultaneous requests cannot both
  claim the same apartment number.

Delivered in `backend/src/lib/interiors.ts`, `backend/src/lib/quota.ts` and
`backend/src/routes/interiors.ts`, with 29 tests.

---

## Related

- `docs/decisions/001-freemium-gcp-stack.md` — the offer this implements
- `docs/architecture/data-model.md` — schema
- `docs/architecture/api.md` — endpoint contracts
