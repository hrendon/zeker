# API Contract — Zeker MVP

REST API endpoints for backend-frontend communication.

**Base URL:** `https://api.zeker.app` (production)  
**Base URL:** `http://localhost:3001` (development)

**Authentication:** Firebase JWT token in `Authorization: Bearer {token}` header

---

## Authentication Endpoints

**Sign-up, sign-in, password reset and token refresh do not exist on this API.**
They happen in the browser, against Firebase Auth directly, using the Firebase
Web SDK. This server never receives a password — only the signed Firebase ID
token that proves Firebase accepted one.

See `docs/decisions/002-client-side-firebase-auth.md`.

The endpoints below all run *after* Firebase has authenticated the user, and
all require `Authorization: Bearer {Firebase ID token}`.

---

### POST /auth/session

The first call the frontend makes after Firebase reports a successful sign-in.
Creates the user's profile on first sign-in, refreshes `last_login` afterwards.
Idempotent — safe to call on every sign-in.

**Request** (both fields optional; send them at sign-up, omit them later):
```json
{
  "first_name": "Juan",
  "last_name": "García"
}
```

If no name is supplied and the profile does not exist yet, the display name from
the Firebase token is used (Google sign-in supplies one). Unknown fields are
rejected rather than stored.

**Response (201 on first sign-in, 200 afterwards):**
```json
{
  "user_id": "user_xyz789",
  "email": "juan@example.com",
  "email_verified": true,
  "first_name": "Juan",
  "last_name": "García",
  "orgs": [],
  "created_at": "2026-08-25T10:00:00.000Z",
  "last_login": "2026-08-25T10:00:00.000Z",
  "request_id": "req_abc123xyz"
}
```

**Errors:**
- `400 invalid_request` — a name is empty, too long, or an unknown field was sent
- `401 unauthorized` — missing, malformed, expired or revoked token

**Note on `email`:** the address is read from the verified Firebase token and is
**not stored in our database**. Firebase Auth is the system of record for it.

---

### GET /auth/me

The current user's profile and the organizations they belong to. The frontend
uses this to choose which experience to show (admin, responsable, security) and
to fill the organization switcher.

**Response (200):**
```json
{
  "user_id": "user_xyz789",
  "email": "juan@example.com",
  "email_verified": true,
  "first_name": "Juan",
  "last_name": "García",
  "orgs": [
    { "org_id": "org_abc123", "role": "admin" },
    { "org_id": "org_def456", "role": "responsable" }
  ],
  "created_at": "2026-08-25T10:00:00.000Z",
  "last_login": "2026-08-25T14:30:00.000Z",
  "profile_exists": true,
  "request_id": "req_abc123xyz"
}
```

`profile_exists: false` means the Firebase account is valid but has no profile
here yet — the frontend should call `POST /auth/session` before continuing.

**Errors:**
- `401 unauthorized` — missing, malformed, expired or revoked token

---

### POST /auth/logout

Revokes the user's Firebase refresh tokens, so the session cannot be resumed
even by someone holding a copy of them. Because tokens are verified with
`checkRevoked=true`, existing ID tokens stop being accepted immediately instead
of staying valid until they expire.

The browser must also clear its own Firebase session. This endpoint closes the
server side of it.

**Request:** no body.

**Response (200):**
```json
{
  "revoked": true,
  "request_id": "req_abc123xyz"
}
```

**Errors:**
- `401 unauthorized` — missing, malformed, expired or revoked token
- `500 internal_server_error` — the session could not be revoked. The caller
  must treat this as *not logged out*, not as success.

---

## Organization Endpoints

An organization is one customer (a school, a residential building, an office).
All of these routes require a Firebase ID token.

**Who can see what.** Membership is stored in one place: the `orgs[]` list on
the user's own profile. A caller who is not a member of an organization gets
**404**, not 403 — telling a stranger that an organization exists is itself a
small leak. A member who simply lacks the required role gets **403**, because
they already know it exists.

**Not in the MVP:** there is no `admin_users` list on the organization and no
way to invite or manage other members. No user story requires it yet, and a
second copy of "who belongs here" would drift out of step with the first. When
member management is built, it is an additive change.

**Not stored:** no street address and no organization phone number. The
data-minimization policy forbids a detailed address, and for a residential
customer the building address plus an interior number plus an authorization
would reveal exactly where a named person lives. `city` and `country` are kept.

---

### POST /orgs

Creates an organization and makes the caller its administrator. The
organization and the caller's membership are written together, so an
organization can never exist that nobody can reach.

**Request:**
```json
{
  "name": "Colegio Bilingüe X",
  "type": "school",
  "description": "Private bilingual school",
  "city": "Bogotá",
  "country": "CO"
}
```

`type` is one of `school`, `residence`, `office`, `other`. `country` is a
two-letter code. `description`, `city` and `country` are optional. Unknown
fields are rejected — in particular `plan`, `limits` and `counts`, which are
how the freemium model is enforced and are never set by the customer.

**Response (201):**
```json
{
  "id": "org_abc123",
  "name": "Colegio Bilingüe X",
  "type": "school",
  "description": "Private bilingual school",
  "plan": "free",
  "limits": { "max_locations": 1, "max_interiors": 10 },
  "counts": { "locations": 0, "interiors": 0 },
  "city": "Bogotá",
  "country": "CO",
  "created_by": "user_xyz789",
  "created_at": "2026-08-25T10:00:00.000Z",
  "updated_at": "2026-08-25T10:00:00.000Z",
  "role": "admin",
  "request_id": "req_abc123xyz"
}
```

`limits` come from the plan (Decision 003). Free is 1 location and 10 interiors
in total across the organization.

**Errors:**
- `400 invalid_request` — missing name, unknown type, or an unknown field
- `401 unauthorized`

---

### GET /orgs

The organizations the caller belongs to — what fills the organization switcher.
There is no way to list organizations you are not a member of.

**Response (200):**
```json
{
  "orgs": [
    {
      "id": "org_abc123",
      "name": "Colegio Bilingüe X",
      "type": "school",
      "plan": "free",
      "limits": { "max_locations": 1, "max_interiors": 10 },
      "counts": { "locations": 1, "interiors": 4 },
      "city": "Bogotá",
      "country": "CO",
      "created_by": "user_xyz789",
      "created_at": "2026-08-25T10:00:00.000Z",
      "updated_at": "2026-08-25T10:00:00.000Z",
      "role": "admin"
    }
  ],
  "request_id": "req_abc123xyz"
}
```

`role` is the caller's own role in that organization. Deleted organizations are
not listed.

---

### GET /orgs/{orgId}

Details of one organization the caller belongs to.

**Response (200):** the same object as one entry of `GET /orgs`, plus
`request_id`.

**Errors:**
- `401 unauthorized`
- `404 not_found` — no such organization, it is deleted, or the caller is not a
  member of it. These are deliberately indistinguishable.

---

### PUT /orgs/{orgId}

Changes the organization's own details. Administrators only.

**Request** (send at least one field):
```json
{
  "name": "Colegio Bilingüe X (2026)",
  "city": "Medellín"
}
```

Accepted fields: `name`, `type`, `description`, `city`, `country`.
`plan`, `limits` and `counts` are rejected — a customer raising their own
limits would defeat the freemium model.

**Response (200):** the updated organization, plus `request_id`.

**Errors:**
- `400 invalid_request` — empty body, or a field that cannot be changed
- `401 unauthorized`
- `403 forbidden` — the caller is a member but not an administrator
- `404 not_found` — no such organization, or the caller is not a member

---

### DELETE /orgs/{orgId}

Marks the organization deleted. Administrators only.

This is a soft delete on purpose: entry records are an audit trail with a
retention period, and erasing them on request would defeat the point of having
one. A deleted organization stops appearing and stops being reachable.

**Response (200):**
```json
{
  "id": "org_abc123",
  "deleted": true,
  "request_id": "req_abc123xyz"
}
```

**Errors:**
- `401 unauthorized`
- `403 forbidden` — the caller is a member but not an administrator
- `404 not_found` — no such organization, already deleted, or not a member
- `409 conflict` — authorizations are still active. They must be revoked first,
  so an organization cannot be deleted out from under a permit that would
  otherwise still open a door.

---

## Location Endpoints

A location is a physical site of the organization — a building, a campus, a
gated entrance. How many an organization may have comes from its plan
(`limits.max_locations`), which is **1** on the free plan (Decision 003).

All routes are nested under an organization and inherit its membership check:
a caller who is not a member gets **404** for every one of them.

**Not stored:** no `security_personnel` field naming a staff member, and no
`floor` / `building`. Nothing in the MVP reads them, and storing a named
employee we have no use for is what the data-minimization policy exists to
prevent. A location that needs to say which building it is in can say so in its
name. Interiors (Decision 003) are the real answer to "which part of the site".

---

### POST /orgs/{orgId}/locations

Adds a location. **Administrators only.**

The plan check and the write happen in one database transaction, so two
requests arriving at the same moment cannot both take the last free slot.

**Request:**
```json
{
  "name": "Entrada Principal",
  "description": "Puerta de la calle",
  "type": "entrance"
}
```

`type` is one of `entrance`, `reception`, `classroom`, `zone`, `other`
(default `other`). `description` and `type` are optional. Unknown fields are
rejected.

**Response (201):**
```json
{
  "id": "loc_abc123",
  "org_id": "org_abc123",
  "name": "Entrada Principal",
  "description": "Puerta de la calle",
  "type": "entrance",
  "enabled": true,
  "created_by": "user_xyz789",
  "created_at": "2026-08-25T10:00:00.000Z",
  "updated_at": "2026-08-25T10:00:00.000Z",
  "usage": { "locations": 1 },
  "request_id": "req_abc123xyz"
}
```

**Errors:**
- `400 invalid_request` — missing name, unknown type, or an unknown field
- `401 unauthorized`
- `403 forbidden` — a member who is not an administrator
- `403 quota_exceeded` — the plan's location limit is already reached. Its own
  code, so the interface can show the plan message in the user's language:

  ```json
  {
    "error": "quota_exceeded",
    "message": "This organization has reached its limit of 1 locations. Upgrade the plan to add more.",
    "details": { "resource": "locations", "limit": 1 },
    "request_id": "req_abc123xyz"
  }
  ```

  The interface shows the Spanish wording, e.g. *"Ya tiene 1 sede. Mejore su
  plan para agregar más."* Nothing is written when this happens.
- `404 not_found` — the caller is not a member of the organization

---

### GET /orgs/{orgId}/locations

Lists the organization's locations, ordered by name. **Any member**, including
security personnel — they need to know where they are validating entries.

**Response (200):**
```json
{
  "locations": [
    {
      "id": "loc_abc123",
      "org_id": "org_abc123",
      "name": "Entrada Principal",
      "description": "Puerta de la calle",
      "type": "entrance",
      "enabled": true,
      "created_by": "user_xyz789",
      "created_at": "2026-08-25T10:00:00.000Z",
      "updated_at": "2026-08-25T10:00:00.000Z"
    }
  ],
  "usage": { "locations": 1, "max_locations": 1 },
  "request_id": "req_abc123xyz"
}
```

`usage` is what the interface's quota indicator reads.

---

### GET /orgs/{orgId}/locations/{locationId}

One location. **Any member.**

**Errors:**
- `401 unauthorized`
- `404 not_found` — no such location, or the caller is not a member

---

### PUT /orgs/{orgId}/locations/{locationId}

Changes a location. **Administrators only.** Send at least one field.

Accepted fields: `name`, `description`, `type`, `enabled`.

`enabled: false` takes a location out of use without deleting it, which keeps
its entry history and does not free a plan slot.

**Response (200):** the updated location, plus `request_id`.

**Errors:**
- `400 invalid_request` — empty body, or a field that cannot be changed
- `401 unauthorized`
- `403 forbidden` — a member who is not an administrator
- `404 not_found` — no such location, or the caller is not a member

---

### DELETE /orgs/{orgId}/locations/{locationId}

Deletes a location and frees its plan slot. **Administrators only.**

Unlike an organization, this is a real delete: a location carries no audit
trail of its own, and the plan allows so few of them that a deleted one has to
give its slot back at once.

**Response (200):**
```json
{
  "id": "loc_abc123",
  "deleted": true,
  "request_id": "req_abc123xyz"
}
```

**Errors:**
- `401 unauthorized`
- `403 forbidden` — a member who is not an administrator
- `404 not_found` — no such location, or the caller is not a member
- `409 conflict` — the location still has interiors, or an authorization still
  points at it. Deleting it then would leave permits aimed at a place that no
  longer exists.

---

## Authorization Endpoints

### POST /orgs/{orgId}/authorizations

Create authorization permit.

**Request:**
```json
{
  "location_id": "loc_entrance_1",
  "authorized_person": {
    "name": "María García López",
    "phone": "+571234567890",
    "relationship": "grandmother"
  },
  "authorization_details": {
    "purpose": "school_pickup",
    "valid_from": "2026-08-19T00:00:00Z",
    "valid_to": "2026-08-20T23:59:59Z",
    "time_from": "14:00",
    "time_to": "17:00"
  }
}
```

**Response (201):**
```json
{
  "id": "auth_p1k2p9m",
  "org_id": "org_abc123",
  "location_id": "loc_entrance_1",
  "authorized_person": {
    "name": "María García López",
    "phone_encrypted": "{encrypted}",
    "relationship": "grandmother"
  },
  "authorization_details": {
    "purpose": "school_pickup",
    "valid_from": "2026-08-19T00:00:00Z",
    "valid_to": "2026-08-20T23:59:59Z",
    "time_from": "14:00",
    "time_to": "17:00"
  },
  "codes": {
    "qr": "data:image/png;base64,iVBORw0KG...",
    "numeric": "P1K2-P9M7",
    "link": "https://zeker.app/v/auth_p1k2p9m"
  },
  "status": "active",
  "created_at": "2026-08-18T10:00:00Z"
}
```

**Errors:**
- `400` — Dates invalid (valid_to before valid_from)
- `403` — User not admin/responsable of org

---

### GET /orgs/{orgId}/authorizations

List authorizations for org.

**Query params:**
- `status` — "active" | "revoked" | "expired" (optional, default: all)
- `location_id` — Filter by location (optional)

**Response (200):**
```json
{
  "authorizations": [
    {
      "id": "auth_p1k2p9m",
      "authorized_person": {
        "name": "María García López"
      },
      "location_id": "loc_entrance_1",
      "valid_from": "2026-08-19T00:00:00Z",
      "valid_to": "2026-08-20T23:59:59Z",
      "status": "active",
      "created_at": "2026-08-18T10:00:00Z"
    }
  ]
}
```

---

### GET /orgs/{orgId}/authorizations/{authId}

Get authorization details.

**Response (200):**
```json
{
  "id": "auth_p1k2p9m",
  "org_id": "org_abc123",
  "authorized_person": {
    "name": "María García López",
    "relationship": "grandmother"
  },
  "codes": {
    "qr": "data:image/png;base64,iVBORw0KG...",
    "numeric": "P1K2-P9M7"
  },
  "status": "active",
  "created_by": "user_xyz789",
  "created_at": "2026-08-18T10:00:00Z"
}
```

---

### PUT /orgs/{orgId}/authorizations/{authId}

Update authorization (extend dates, change times, etc.).

**Request:**
```json
{
  "authorization_details": {
    "valid_to": "2026-08-25T23:59:59Z"
  }
}
```

**Response (200):**
```json
{
  "id": "auth_p1k2p9m",
  "updated_at": "2026-08-18T12:00:00Z"
}
```

---

### DELETE /orgs/{orgId}/authorizations/{authId}

Revoke authorization.

**Response (200):**
```json
{
  "message": "Authorization revoked",
  "revoked_at": "2026-08-18T12:00:00Z"
}
```

---

## Validation Endpoint

### POST /orgs/{orgId}/validate

Scan QR code and validate authorization (security personnel).

**Request:**
```json
{
  "location_id": "loc_entrance_1",
  "code": "P1K2-P9M7"  // or full auth_id
}
```

**Response (200) — Valid:**
```json
{
  "result": "allowed",
  "authorization": {
    "id": "auth_p1k2p9m",
    "authorized_person": {
      "name": "María García López"
    },
    "purpose": "school_pickup",
    "valid_until": "2026-08-20T17:00:00Z"
  },
  "event_id": "event_20260818_001"
}
```

**Response (200) — Invalid:**
```json
{
  "result": "denied",
  "reason": "expired",  // "expired", "revoked", "wrong_location", "outside_hours", "invalid_code"
  "event_id": "event_20260818_002"
}
```

**Errors:**
- `400` — Missing location_id or code
- `404` — Authorization not found

---

## Access Events Endpoint

### GET /orgs/{orgId}/events

List access events (entry/exit log).

**Query params:**
- `auth_id` — Filter by authorization (optional)
- `location_id` — Filter by location (optional)
- `from_date` — Start date (optional, ISO 8601)
- `to_date` — End date (optional)
- `result` — "allowed" | "denied" (optional)
- `limit` — Max results (default: 100, max: 1000)

**Response (200):**
```json
{
  "events": [
    {
      "id": "event_20260818_001",
      "auth_id": "auth_p1k2p9m",
      "location_id": "loc_entrance_1",
      "timestamp": "2026-08-18T15:30:45Z",
      "action": "entry",
      "result": "allowed",
      "authorized_person": "María García López"
    },
    {
      "id": "event_20260818_002",
      "auth_id": "auth_invalid",
      "location_id": "loc_entrance_1",
      "timestamp": "2026-08-18T15:32:00Z",
      "action": "entry",
      "result": "denied",
      "reason": "revoked"
    }
  ],
  "total": 247
}
```

---

## Error Response Format

All errors follow this format:

```json
{
  "error": "error_code",
  "message": "Human-readable error message",
  "request_id": "req_abc123xyz"
}
```

**Common error codes:**
- `invalid_request` — Malformed request
- `unauthorized` — Not authenticated
- `forbidden` — Authenticated but not authorized
- `quota_exceeded` — The organization's plan limit is reached (also HTTP 403).
  Carries `details: { resource, limit }` so the interface can name the limit.
- `not_found` — Resource not found
- `conflict` — Business rule violation (e.g., dates invalid)
- `internal_server_error` — Server error

---

## Rate Limiting

- **Validation endpoint:** 100 requests per minute per user (burst allowed)
- **Everything else, including `/auth/*`:** 60 requests per minute

The stricter "5 per minute per IP" limit was written for password endpoints.
Those no longer exist here — sign-in happens at Firebase, which applies its own
abuse protection (Decision 002). Every `/auth/*` route on this API already
requires a valid Firebase token, so it cannot be used to guess credentials.

A 5-per-minute-per-IP limit would also be actively harmful: several staff
members of one customer typically share a single office IP address, and would
lock each other out at the start of the working day.

Response headers:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1629383400
```

---

## Versioning

Current version: **v1** (not in URL, implicit)

Future versions may be:
- `/v2/...` (if breaking changes)
- `/beta/...` (experimental features)

---

**Owner:** Software Architect
**Last updated:** 2026-08-18
**Related:** `architecture.md`, `data-model.md`
