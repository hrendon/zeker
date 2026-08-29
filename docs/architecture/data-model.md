# Data Model — Zeker MVP

Firestore collection schema and data structures.

## Collections

### `orgs/{orgId}`

Organization (tenant) data.

```firestore
{
  "id": "org_abc123",                 // Auto-generated or user-provided
  "name": "Colegio Bilingüe X",       // String, required
  "type": "school",                   // "school" | "residence" | "office" | "other"
  "description": "Private bilingual school in Bogotá",
  "admin_users": ["user1", "user2"],  // Array of userIds who can manage this org
  "created_by": "user1",              // userId who created the org
  "created_at": 2026-08-18T10:00:00Z, // Timestamp
  "updated_at": 2026-08-18T10:00:00Z,
  "status": "active",                 // "active" | "suspended" | "deleted"
  "metadata": {
    "phone": "+571234567890",         // Org contact (not encrypted, public)
    "address": "Calle 1 #2-3",        // Public
    "city": "Bogotá",
    "country": "CO"
  }
}
```

**Subcollections:**
- `locations/` — access points within this org
- `interiors/` — units inside a location (Decision 003); flat, with a `location_id`
- `authorizations/` — permits issued by this org
- `access_events/` — entry/exit logs

> **What is actually implemented (2026-08-25)** — `backend/src/lib/orgs.ts`.
>
> - **No `admin_users` array, and no `users/` subcollection.** Membership lives
>   in exactly one place: `users/{uid}.orgs[]`. Two copies of "who belongs here"
>   drift apart. Access checks read the caller's own profile, which is one
>   document read and cannot be stale relative to itself.
>
>   Updated 2026-08-28 (Decision 006): an organization's members **are** now
>   listed and managed, by `GET/POST/DELETE /orgs/{orgId}/members`. That did not
>   require a second copy of the fact — the list is a query for the membership
>   objects inside `users/{uid}.orgs[]`, so this remains the only place it
>   lives.
>
> - **No `metadata.address` and no `metadata.phone`.** The data-minimization
>   policy forbids a detailed address. For a `residence` customer, the building
>   address plus an interior number plus an authorization would reconstruct
>   exactly where a named person lives. `city` and `country` are stored as
>   top-level fields — enough for language and segmentation, which is all the
>   MVP uses. The organization phone is not stored because nothing needs it,
>   and for a small customer it is usually the administrator's own mobile.
>
> - **Added (Decision 003):** `plan`, `limits { max_locations, max_interiors }`
>   and `counts { locations, interiors }`. These replace the old "max 100
>   locations" cap and are never settable by the customer.
>
> - `status` is `active` or `deleted`. Deletion is soft, so the audit trail
>   underneath survives its retention period.

---

### `users/{userId}`

User account data (minimal PII).

```firestore
{
  "id": "user_xyz789",                // Firebase UID
  "email_hash": "sha256(email)",      // Encrypted email for audit, never displayed
  "email_plaintext": "{encrypted}",   // Encrypted, only decrypted on backend
  "first_name": "Juan",               // Plain text, public
  "last_name": "García",
  "phone_encrypted": "{encrypted}",   // Encrypted AES-256
  "role": "admin",                    // "admin" | "responsable" | "security"
  "orgs": [
    {
      "org_id": "org_abc123",
      "role": "admin"                 // Role within this org
    },
    {
      "org_id": "org_def456",
      "role": "responsable"
    }
  ],
  "created_at": 2026-08-18T10:00:00Z,
  "last_login": 2026-08-18T14:30:00Z,
  "verified": true,                   // Email verified?
  "deleted": false                    // Soft delete
}
```

**Notes:**
- Email encrypted at rest (AES-256 with GCP KMS key)
- Phone encrypted separately
- User can be admin of multiple orgs
- No storage of: ID document, photo, biometric data, salary, address, etc.

> **What is actually implemented (2026-08-25)** — `backend/src/lib/users.ts`.
> Two fields above are deliberately **not written**, both narrowing what we keep:
>
> - **No `email_plaintext`, `email_hash` or `phone_encrypted`.** These need
>   encryption with Cloud KMS, which is still an open design problem (the
>   architecture describes the browser doing the encrypting, which is not
>   possible — see PROJECT_STATE.md, Known Issues). Firebase Auth is already the
>   system of record for the email, and it arrives inside the verified token on
>   every request, so storing a second copy would keep personal data we do not
>   need. Looking a user up by email uses Firebase's own `getUserByEmail()`.
>   These fields get added only when a requirement actually needs them.
>
> - **No top-level `role`.** One person can administer several organizations —
>   a project non-negotiable — so a single global role cannot be correct. The
>   role is per organization, in `orgs[]`. The top-level field contradicted the
>   `orgs[]` field in the same document.
>
> `verified` is also not stored: the email-verified flag comes from the Firebase
> token and is returned to the frontend as `email_verified`.

---

### `orgs/{orgId}/locations/{locationId}`

Physical access points (entrances, reception areas, specific zones).

```firestore
{
  "id": "loc_entrance_1",             // Unique within org
  "org_id": "org_abc123",
  "name": "Main Entrance",            // String
  "description": "Front door",
  "type": "entrance",                 // "entrance" | "reception" | "classroom" | "zone" | "other"
  "enabled": true,
  "created_at": 2026-08-18T10:00:00Z,
  "metadata": {
    "floor": 1,
    "building": "A",
    "security_personnel": "José"      // Person typically staffing this location
  }
}
```

> **What is actually implemented (2026-08-25)** — `backend/src/lib/locations.ts`.
>
> - **No `metadata.security_personnel`.** It named a staff member as the person
>   typically staffing the location. Nothing in the MVP reads it, and storing a
>   named employee we have no use for is exactly what data minimization is for.
> - **No `metadata.floor` / `metadata.building`.** Unused. A location can say
>   which building it is in through its name; interiors carry the real detail.
> - `enabled: false` takes a location out of use without deleting it, keeping
>   its entry history and its plan slot.

**Constraints:**
- Cannot delete location if active authorizations reference it
- Cannot delete a location that still has interiors
- ~~Each org can have max 100 locations (MVP limit)~~ — replaced by Decision 003.
  The limit comes from the organization's plan (`orgs/{orgId}.limits.max_locations`),
  which is 1 on the free plan. Enforced in a transaction against
  `orgs/{orgId}.counts.locations`.

---

### `orgs/{orgId}/interiors/{interiorId}`

Units inside a location: an apartment, a warehouse bay, a zone (Decision 003).

Stored **flat under the organization**, not nested inside the location, with a
`location_id` field. The plan limit counts interiors across the whole
organization, not per location (Founder clarification, 2026-08-18), so a flat
collection makes that a single counter and a single query. Listing the
interiors of one location stays a plain equality filter.

```firestore
{
  "id": "int_a1b2c3",
  "org_id": "org_abc123",
  "location_id": "loc_entrance_1",     // required
  "number": "302",                     // required; unique within its location
  "name": "Apartamento 302",           // optional label
  "responsable_user_id": "user_xyz",   // required — a member of this org
  "enabled": true,
  "created_by": "user1",
  "created_at": 2026-08-25T10:00:00Z,
  "updated_at": 2026-08-25T10:00:00Z
}
```

**Constraints:**
- `number` unique within its `location_id` — enforced inside the same
  transaction as the quota check, so two simultaneous requests cannot both
  claim apartment 302
- `location_id` cannot be changed after creation: moving an interior to another
  building would carry its permits with it
- `responsable_user_id` is **required** and must be a member of the
  organization (Decision 006). An interior always has a designated person,
  because an interior with nobody designated has nobody to issue its permits.
  It cannot be cleared — handing an interior over is choosing a different
  member, never nobody.
- **No `responsable_name` field.** The name shown comes from that person's
  account, so correcting the spelling of a name corrects it everywhere
  (Decision 006). It is returned by the API, never stored here.
- Cannot delete while an authorization for it is still active
- Total interiors limited by `orgs/{orgId}.limits.max_interiors` (10 on the
  free plan), counted in `orgs/{orgId}.counts.interiors`

**Not stored:** no address, phone or email for the responsable. The
organization already knows where it is, and contacting a responsable goes
through their user account.

**Queries used:**
- `location_id + number` (uniqueness check, per-location listing)
- `location_id` (list one location's interiors)

Both are equality-only, so Firestore's automatic single-field indexes serve
them; no composite index is required.

---

### `orgs/{orgId}/authorizations/{authId}`

Access permit (core entity). **Built 2026-08-29.**

```firestore
{
  "id": "auth_Qh1hK6tqoFcRHSYXhyGn",
  "org_id": "org_abc123",
  "interior_id": "int_a1b2c3",         // required — the apartment being visited
  "location_id": "loc_torre_1",        // copied from the interior at creation
  "visitor_name": "Ana Ruiz Peña",     // the only thing kept about the visitor
  "purpose": "visitor",                // "visitor" | "pickup" | "provider" | "employee" | "other"
  "valid_from": "2026-08-29T22:00:00.000Z",  // ISO 8601 string, UTC
  "valid_to":   "2026-08-30T22:00:00.000Z",  // ISO 8601 string, UTC
  "code": "4J044ZMF",                  // 8 chars, random, unique within the org
  "status": "active",                  // "active" | "revoked" — NOT "expired"
  "created_by": "user1",
  "created_at": 2026-08-29T22:19:41Z,  // server timestamp
  "revoked_at": null,                  // server timestamp once revoked
  "revoked_by": null
}
```

**Constraints:**
- `valid_from` must be before `valid_to`
- `valid_to` must be in the future when the permit is created. `valid_from` may
  be in the past — "valid since this morning" is ordinary
- a permit may not last longer than **365 days**. A visit is not a tenancy, and
  a mistyped year must not admit someone until 2125
- `interior_id` must exist in this organization. `location_id` is copied from
  it, which is safe because an interior's location can never change
- `code` is unique within the organization, checked inside the same transaction
  that writes the permit
- `created_by` must be an admin of the organization, or the responsable of that
  interior. Security staff may not create one

**What is actually implemented — departures from the original design.**
Each is recorded in `../decisions/007-entry-permits.md`.

| Original design | What is built | Why |
|---|---|---|
| `location_id` only | `interior_id`, with `location_id` derived | Decision 003: a permit belongs to one interior |
| `authorized_person.{name, relationship, document_type, document_number_encrypted}` | a flat `visitor_name` | Data minimization. A document field that exists is one somebody eventually fills in |
| `codes.qr` — a base64 PNG | not stored | The QR encodes the code and nothing else, so the browser draws it |
| `codes.link` — a public share URL | not stored | A public page keyed by a code is an unauthenticated entrance, and it says where a named person is going |
| `codes.numeric` derived from the id | `code`, from `crypto.randomInt` | That code alone opens a door. Anything predictable from a visible id is a way in |
| `status: "expired"` | computed, never stored | Nothing runs to set it, so it would never arrive — and the delete guards would then block forever on a permit that ended last year |
| `time_from` / `time_to` daily window | not stored | Needs each building's local time, which we do not keep |
| `days_of_week`, `max_entries`, `notes` | not stored | No requirement demands them today |

**The code.** Eight characters from `0123456789ABCDEFGHJKMNPQRSTVWXYZ` — 32
symbols with no I, L, O or U, the letters a guard misreads in bad light. About
1.1 × 10¹² possibilities. Shown as `4J04-4ZMF`; stored without the separator.
Input is normalized before lookup: separators and spaces dropped, and I, L, O, U
folded onto 1, 1, 0, V.

**Why the dates are strings.** `valid_from` and `valid_to` are ISO 8601 in UTC
rather than Firestore timestamps. In UTC that form sorts lexicographically
exactly as it sorts chronologically, so the range queries below work on it
directly, and the value carries its own timezone rather than depending on how a
reader converts it. `created_at` and `revoked_at` stay server timestamps — they
record when something happened here, not a moment a user chose.

**Indexes needed** — declared in `../../firestore.indexes.json` and deployed
2026-08-29. All three serve the same "is any permit still live?" question, which
is equality filters plus a range on `valid_to`. **The query fails outright
without them**, and the in-memory test double will not catch that:

- `status + valid_to` (can this organization be deleted?)
- `location_id + status + valid_to` (can this site be deleted?)
- `interior_id + status + valid_to` (can this apartment be deleted?)

---

### `orgs/{orgId}/access_events/{eventId}`

Immutable log of entry/exit attempts (audit trail).

```firestore
{
  "id": "event_20260818_001",         // eventId
  "org_id": "org_abc123",
  "auth_id": "auth_p1k2p9m",          // Reference to authorization
  "location_id": "loc_entrance_1",    // Which entry point
  "timestamp": 2026-08-18T15:30:45Z,  // When did it happen
  "action": "entry",                  // "entry" | "exit"
  "result": "allowed",                // "allowed" | "denied"
  "deny_reason": null,                // If denied: "expired" | "revoked" | "wrong_location" | "outside_hours" | "invalid_qr" | "error"
  "security_personnel_id": "user3",   // Who scanned it
  "metadata": {
    "qr_scanned": "P1K2-P9M7",        // Code that was scanned
    "ip_address": "203.0.113.45",
    "device_type": "mobile",
    "request_id": "req_abc123xyz"     // For debugging
  }
}
```

**Constraints:**
- Immutable: no updates after creation
- Retention: auto-delete after 90 days (Firestore TTL policy)
- Queryable by: org_id, timestamp, result

**Indexes needed:**
- `org_id + timestamp` (recent events)
- `org_id + auth_id + timestamp` (auth history)
- `org_id + result` (success/failure counts)

---

### `users/{userId}/notifications/{notificationId}` (Future, Phase 1.5)

Log of notifications sent to user.

```firestore
{
  "id": "notif_user1_20260818_1",
  "user_id": "user1",
  "event_id": "event_20260818_001",   // Related access event
  "type": "entry_notification",       // "entry" | "failed_entry" | "revoke_confirmation" | "alert"
  "channel": "email",                 // "email" | "sms" | "push" (MVP: email only)
  "recipient": "user1@example.com",
  "subject": "María entered the school",
  "body": "...",
  "sent_at": 2026-08-18T15:30:50Z,
  "status": "sent",                   // "sent" | "failed" | "bounced"
  "retry_count": 0
}
```

**Note:** MVP sends basic email only. Full notification system is Phase 1.5.

---

## Data Minimization Rules

### ALWAYS Encrypt

> ❌ **Superseded — nothing on this list is stored any more, so nothing in the
> MVP is application-encrypted.** The user's email and phone went with
> Decision 002, the organization's phone with Decision 003, and the visitor's
> phone with Decision 005. Firestore's own at-rest encryption still covers
> everything. The rule below stands for any future field that does identify a
> person, and the Cloud KMS key is kept, unused, for that case.

- ~~`user.email_plaintext`~~ — not stored (Decision 002)
- ~~`authorized_person.phone_encrypted`~~ — not collected (Decision 005)
- ~~`user.phone_encrypted`~~ — not stored (Decision 002)
- Any field that could identify a minor — **still in force**

### NEVER Store

- ID documents (cédula, pasaporte, DNI) — reference via ID number only in key, never full data
- Photos / images of people
- Biometric data (fingerprints, facial scans, iris)
- Financial information (salary, bank account, payment method)
- Detailed address (ok: city/country, not ok: exact street + number + apartment)
- Racial/ethnic origin
- Religious beliefs
- Political affiliation
- Health information

### OK to Store (Unencrypted)

- Full name (necessary for verification at entry)
- Organization/building (public)
- Location/zone name (public)
- Relationship/role (necessary for context)
- Dates and times (necessary for authorization)
- Entry/exit logs with timestamps (audit trail)

---

## Lifecycle & Cleanup

### Auto-Deletion

- **Access Events:** TTL = 90 days (Firestore TTL policy)
  ```
  Set TTL field: access_events.created_at + 7776000 seconds (90 days)
  ```

- **Revoked Authorizations:** Keep 1 year for audit, then archive
  ```
  Backup to Cloud Storage, then delete from Firestore
  ```

- **Deleted Users:** Cascade delete
  ```
  User marked deleted=true
  Delete their authorizations
  Delete their created events (reference)
  Keep event records but mask user_id
  ```

### Retention Policies

| Data | Retention | Reason |
|------|-----------|--------|
| Access events (success) | 90 days | Audit trail |
| Access events (denied) | 30 days | Security review |
| Revoked authorizations | 1 year | Regulatory/audit |
| User accounts | Indefinite (marked deleted) | Account recovery |
| Notifications | 30 days | Troubleshooting |

---

## Security Rules (Firestore)

> ⚠️ **NOT IN FORCE.** The rules below are a *reference design*, kept for the day
> browsers might need to read Firestore directly. They are not deployed.
>
> **The rules actually in force are in `firestore.rules` at the repository root:
> clients are denied all access to Firestore.** Every read and write goes through
> the Zeker backend, which uses the Firebase Admin SDK and enforces organization
> membership per request. See `docs/decisions/004-backend-only-firestore-access.md`.
>
> This means multi-tenant isolation is enforced **in backend code**, not by these
> rules. Every org-scoped endpoint must check membership, and that check must be
> covered by tests.

```javascript
// REFERENCE DESIGN — NOT DEPLOYED. See firestore.rules for what is live.
match /databases/{database}/documents {
  // Default deny
  match /{document=**} {
    allow read, write: if false;
  }
  
  // Public: Help, docs
  match /public/{document=**} {
    allow read: if true;
  }
  
  // Users can only read themselves
  match /users/{userId} {
    allow read: if request.auth.uid == userId;
    allow write: if request.auth.uid == userId && 
                    request.resource.data.keys().hasOnly([
                      'first_name', 'last_name', 'phone_encrypted'
                    ]);
  }
  
  // Orgs: accessible by admin users of that org
  match /orgs/{orgId} {
    allow read: if isAdminOfOrg(request.auth.uid, orgId);
    allow update, delete: if isAdminOfOrg(request.auth.uid, orgId);
  }
  
  match /orgs/{orgId}/{document=**} {
    allow read: if isAdminOfOrg(request.auth.uid, orgId) ||
                   isResponsableOfOrg(request.auth.uid, orgId) ||
                   isSecurityOfOrg(request.auth.uid, orgId);
    allow create: if isAdminOfOrg(request.auth.uid, orgId);
    allow update, delete: if isAdminOfOrg(request.auth.uid, orgId);
  }
  
  // Authorization validation (security scan) — anyone can call, but must provide auth ID
  function validateAuth(authId, orgId) {
    let auth = get(/databases/$(database)/documents/orgs/$(orgId)/authorizations/$(authId)).data;
    return auth.status == "active" && 
           auth.valid_from <= now && 
           auth.valid_to >= now;
  }
  
  // Helper functions
  function isAdminOfOrg(userId, orgId) {
    return get(/databases/$(database)/documents/orgs/$(orgId)).data.admin_users.hasAny([userId]);
  }
  
  function isResponsableOfOrg(userId, orgId) {
    let userDoc = get(/databases/$(database)/documents/users/$(userId)).data;
    return userDoc.orgs.any(o => o.org_id == orgId && o.role == "responsable");
  }
  
  function isSecurityOfOrg(userId, orgId) {
    let userDoc = get(/databases/$(database)/documents/users/$(userId)).data;
    return userDoc.orgs.any(o => o.org_id == orgId && o.role == "security");
  }
}
```

---

**Owner:** Software Architect + Security Engineer
**Last updated:** 2026-08-18
