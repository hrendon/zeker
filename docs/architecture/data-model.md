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
  "entry_mode": "single",              // "single" | "multiple" — Decision 014
  "entry_count": 0,                    // written by the gate, in the same transaction
  "entry_returns": 0,                  // entries a guard gave back — Decision 015
  "first_entry_at": null,              // server timestamp on the first entry
  "last_entry_at": null,               // server timestamp on every entry
  "created_by": "user1",
  "created_at": 2026-08-29T22:19:41Z,  // server timestamp
  "revoked_at": null,                  // server timestamp once revoked
  "revoked_by": null
}
```

**Constraints:**
- **A permit stored without `entry_mode` is read as `multiple`.** Everything
  issued before 2026-09-02 is in that state: it was created under a rule that
  offered no alternative, and converting it would revoke access nobody agreed
  to revoke
- **`entry_count` is written inside the transaction that answers the guard**, never
  after it. A one-entry permit is spent by being used, so an answer decided
  first and counted afterwards lets two guards scanning at the same instant
  both be told yes
- **`entry_returns` counts our own corrections, not facts about the visitor.**
  It goes up when a guard records "el visitante no entró" within ten minutes of
  a check that let somebody in (Decision 015), and `entry_count` goes down by
  one in the same transaction. It exists so an administrator can tell a permit
  **nobody ever used** from one whose **visitor was turned around at the door** —
  a difference the event log holds in full, and which this counter makes
  readable before the entry history is built
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
| `days_of_week` | not stored | No requirement demands it today |
| `max_entries` — a number | `entry_mode`, two values | **Decision 014, 2026-09-02.** The Founder asked to see whether a permit had been used, and underneath that was a rule nobody had decided: a permit worked an unlimited number of times because that is what the code happened to do. A free number was not needed — the real cases are "one visit" and "in and out until it expires" — and a number invites a screen that asks "how many?", which nobody at a gate can answer |
| `notes` — free text | **deliberately never stored** | **Decision 015, 2026-09-02.** Considered outright, at the Founder's request, and rejected on the Security Engineer's position: a guard is rotating staff from a contracted firm typing with a person waiting at the gate, and what lands in that field is ID numbers, phone numbers and descriptions of people. A closed list of reasons on the *event* carries the same information and can also be counted |

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

> ✅ **BUILT** on 2026-08-30 (Decision 008). Written by
> `POST /orgs/{orgId}/validate`. Nothing reads them yet.

Immutable log of entry attempts — the audit trail the whole product rests on.
One document per check, allowed or refused.

```firestore
{
  "id": "event_43A7mW3TICIFxENnZUts",
  "org_id": "org_abc123",
  "location_id": "loc_entrance_1",     // the entrance the guard was at
  "permit_id": "auth_p1k2p9m",         // null when the code matched nothing
  "interior_id": "int_302",            // copied from the permit; null likewise
  "action": "entry",                   // "entry" | "note" — see below
  "result": "allowed",                 // "allowed" | "denied"
  "deny_reason": null,                 // "invalid_code" | "revoked" | "already_used"
                                       //   | "not_started" | "expired"
                                       //   | "wrong_location"
  "note": null,                        // Decision 015 — null on a check itself
  "about_event_id": null,              // the check a note is about; null on a check
  "entry_returned": null,              // whether a note gave an entry back
  "scanned_code": null,                // only when nothing matched
  "checked_by": "user3",               // the guard or administrator
  "request_id": "req_abc123xyz",
  "created_at": 2026-08-30T19:56:41Z,
  "expires_at": 2026-11-28T19:56:41Z   // read by the Firestore TTL policy:
                                       //   created_at + 90 days if allowed,
                                       //   + 30 days if denied
}
```

**Constraints:**
- Immutable: nothing in the codebase updates an event after it is written. A log
  that can be edited is not evidence.
- Retention: 90 days for an entry, 30 for a refusal, by a Firestore TTL policy
  on `expires_at` (`../security/data-minimization.md`).

#### What is actually implemented, and what is not

Four deliberate departures from the shape this document originally specified.
Each is recorded in `../decisions/008-checking-a-permit-at-a-door.md`.

1. **No `metadata.ip_address` and no `metadata.device_type`** (Founder decision,
   2026-08-30). They describe the guard, not the visitor. Kept for 90 days across
   every scan of a shift they become a location trail of a customer's own staff.
   `checked_by` and `request_id` already answer "who did this" and "which request
   was it".

2. **No `visitor_name`.** The event points at the permit, and the permit holds
   the name. Copying it here would put the same person's name in a second
   collection — the same reason a responsable's name is not copied onto an
   interior (Decision 006). A check that matched no permit correctly shows none.

3. **`action` is `entry` or `note`; `exit` is still not recorded** (Founder
   decision, 2026-08-30). Exits double the work at the gate and no customer has
   asked for one. `note` was added by Decision 015 on 2026-09-03: what a guard
   said happened after a check.

   **A note is a second record pointing at the first, never an edit** — which is
   the only way to add a correction to a log whose whole value is that it cannot
   be edited. It carries `note` (one of `no_entry`, `sent_to_other_entrance`,
   `returning_later`, `asked_resident` — a closed list, so nobody ever types a
   document number into it), `about_event_id`, and `entry_returned`. It inherits
   the check's own `expires_at` exactly, so the two are never half a history:
   an entry that outlived the record saying nobody came in would be worse than
   no record at all.

4. **`metadata.qr_scanned` became `scanned_code`, and is stored only when
   nothing matched.** When a permit was found, `permit_id` identifies it and the
   code is not copied — a live door code has no business being duplicated into a
   second collection. When nothing matched, the characters submitted are the only
   evidence of what was attempted.

**Indexes needed:** none new. Decision 015 looks a note up by
`about_event_id` alone — a single-field equality match, which Firestore indexes
on its own. The entry-history
screen will need `permit_id + created_at` and `location_id + created_at`; they
are deliberately not declared until a query exists that uses them.

⚠️ **The TTL policy is not enabled yet.** Every record carries `expires_at`, but
writing the field is not the same as switching the policy on in Google Cloud —
the same trap as declaring an index without deploying it. Until it is enabled,
nothing deletes an old check. See `developer-guide.md` and `PROJECT_STATE.md`.

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

- **Access Events:** TTL = 90 days for an entry, 30 for a refusal.
  Each event carries its own `expires_at`, written at creation, because a
  Firestore TTL policy names one timestamp field and deletes the document when
  that moment passes — it cannot add an offset itself, which is also what lets
  one policy serve two different retention periods.
  ```
  gcloud firestore fields ttls update expires_at     --collection-group=access_events --enable-ttl
  ```
  ⚠️ **Not enabled yet** (2026-08-30). The field is written; the policy is not
  switched on, so nothing deletes an old check.

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
