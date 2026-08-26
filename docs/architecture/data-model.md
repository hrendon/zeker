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
>   drift apart, and nothing in the MVP lists an organization's members — there
>   is no invite or member-management user story yet. Adding one later is an
>   additive change. Access checks read the caller's own profile, which is one
>   document read and cannot be stale relative to itself.
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
  "responsable_name": "María García",  // required — shown to security personnel
  "responsable_user_id": "user_xyz",   // null until that person has an account
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
- `responsable_user_id` must be a member of the organization
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

Access permit (core entity).

```firestore
{
  "id": "auth_p1k2p9m",               // Short unique code for QR
  "org_id": "org_abc123",
  "location_id": "loc_entrance_1",    // Location where this auth applies
  "created_by": "user1",              // userId who created authorization
  "authorized_person": {
    "name": "María García López",     // Required: full name
    // No phone number. Decision 005: the visitor is not our user and never
    // consented; nothing in the MVP sends them anything.
    "relationship": "abuelo",         // "parent" | "guardian" | "grandparent" | "nanny" | "visitor" | "employee" | "provider" | "other"
    "document_type": null,            // NEVER store, reference only if needed
    "document_number_encrypted": null // NEVER store, reference only if needed
  },
  "authorization_details": {
    "purpose": "school_pickup",       // "pickup" | "visitor" | "provider" | "employee" | "other"
    "valid_from": 2026-08-19T00:00:00Z,  // Effective date
    "valid_to": 2026-08-20T23:59:59Z,    // Expiration date/time
    "time_from": "14:00",             // Optional: earliest time per day
    "time_to": "17:00",               // Optional: latest time per day
    "days_of_week": null,             // FUTURE: for recurring ["MON", "TUE", "WED"]
    "max_entries": null,              // FUTURE: limit entries (e.g., 1 per day)
    "notes": "Only Mon-Fri for pickup" // Admin notes
  },
  "codes": {
    "qr": "data:image/png;base64,iVBORw0KG...", // Base64 PNG data
    "numeric": "P1K2-P9M7",           // 8-character code (human-readable fallback)
    "link": "https://zeker.app/v/auth_p1k2p9m"  // Shareable link
  },
  "status": "active",                 // "active" | "revoked" | "expired"
  "revoked_at": null,
  "revoked_by": null,
  "created_at": 2026-08-18T10:00:00Z,
  "updated_at": 2026-08-18T10:00:00Z
}
```

**Constraints:**
- `valid_from` must be < `valid_to`
- `time_from` must be < `time_to` (if both present)
- `created_by` must be admin or responsable of org
- Cannot create auth for past dates (except today + 1 hour grace)

**Indexes needed:**
- `org_id + status` (list active authorizations)
- `org_id + location_id + status` (validate by location)
- `org_id + valid_to` (find expired, cleanup)

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
