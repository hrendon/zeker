# API Contract — Zeker MVP

REST API endpoints for backend-frontend communication.

**Base URL:** `https://api.zeker.app` (production)  
**Base URL:** `http://localhost:3001` (development)

**Authentication:** Firebase JWT token in `Authorization: Bearer {token}` header

---

## Authentication Endpoints

### POST /auth/signup

Register a new user.

**Request:**
```json
{
  "email": "juan@example.com",
  "password": "secure_password",
  "first_name": "Juan",
  "last_name": "García"
}
```

**Response (201):**
```json
{
  "user_id": "user_xyz789",
  "email": "juan@example.com",
  "first_name": "Juan",
  "created_at": "2026-08-18T10:00:00Z"
}
```

**Errors:**
- `400` — Email already exists
- `400` — Password too weak
- `400` — Missing required fields

---

### POST /auth/signin

Login with email + password.

**Request:**
```json
{
  "email": "juan@example.com",
  "password": "secure_password"
}
```

**Response (200):**
```json
{
  "user_id": "user_xyz789",
  "id_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "refresh_token_xyz...",
  "expires_in": 3600
}
```

**Errors:**
- `401` — Invalid credentials
- `404` — User not found

---

### POST /auth/refresh

Refresh JWT token.

**Request:**
```json
{
  "refresh_token": "refresh_token_xyz..."
}
```

**Response (200):**
```json
{
  "id_token": "eyJhbGciOiJIUzI1NiIs...",
  "expires_in": 3600
}
```

---

### POST /auth/logout

Logout (invalidate refresh token).

**Request:**
```json
{
  "refresh_token": "refresh_token_xyz..."
}
```

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

---

## Organization Endpoints

### POST /orgs

Create a new organization.

**Request:**
```json
{
  "name": "Colegio Bilingüe X",
  "type": "school",
  "description": "Private bilingual school"
}
```

**Response (201):**
```json
{
  "id": "org_abc123",
  "name": "Colegio Bilingüe X",
  "type": "school",
  "created_by": "user_xyz789",
  "created_at": "2026-08-18T10:00:00Z"
}
```

**Errors:**
- `401` — Not authenticated
- `400` — Missing required fields

---

### GET /orgs

List all organizations for authenticated user.

**Response (200):**
```json
{
  "orgs": [
    {
      "id": "org_abc123",
      "name": "Colegio Bilingüe X",
      "type": "school",
      "admin_users": ["user_xyz789", "user_abc456"],
      "created_at": "2026-08-18T10:00:00Z"
    },
    {
      "id": "org_def456",
      "name": "Unidad Residencial Y",
      "type": "residence",
      "admin_users": ["user_xyz789"],
      "created_at": "2026-08-18T11:00:00Z"
    }
  ]
}
```

---

### GET /orgs/{orgId}

Get organization details.

**Response (200):**
```json
{
  "id": "org_abc123",
  "name": "Colegio Bilingüe X",
  "type": "school",
  "description": "Private bilingual school in Bogotá",
  "admin_users": ["user_xyz789", "user_abc456"],
  "created_by": "user_xyz789",
  "created_at": "2026-08-18T10:00:00Z",
  "metadata": {
    "phone": "+571234567890",
    "address": "Calle 1 #2-3",
    "city": "Bogotá"
  }
}
```

**Errors:**
- `403` — User not admin of this org
- `404` — Org not found

---

### PUT /orgs/{orgId}

Update organization details.

**Request:**
```json
{
  "name": "Colegio Bilingüe X (Updated)",
  "metadata": {
    "phone": "+571234567890"
  }
}
```

**Response (200):**
```json
{
  "id": "org_abc123",
  "name": "Colegio Bilingüe X (Updated)",
  "updated_at": "2026-08-18T12:00:00Z"
}
```

---

### DELETE /orgs/{orgId}

Delete organization (soft delete).

**Response (200):**
```json
{
  "message": "Organization deleted"
}
```

**Errors:**
- `403` — User not admin
- `409` — Org has active authorizations (must revoke first)

---

## Location Endpoints

### POST /orgs/{orgId}/locations

Add access point/location.

**Request:**
```json
{
  "name": "Main Entrance",
  "description": "Front door",
  "type": "entrance"
}
```

**Response (201):**
```json
{
  "id": "loc_entrance_1",
  "org_id": "org_abc123",
  "name": "Main Entrance",
  "type": "entrance",
  "created_at": "2026-08-18T10:00:00Z"
}
```

---

### GET /orgs/{orgId}/locations

List all locations for an org.

**Response (200):**
```json
{
  "locations": [
    {
      "id": "loc_entrance_1",
      "name": "Main Entrance",
      "type": "entrance",
      "enabled": true
    },
    {
      "id": "loc_reception_1",
      "name": "Reception",
      "type": "reception",
      "enabled": true
    }
  ]
}
```

---

### PUT /orgs/{orgId}/locations/{locationId}

Update location.

**Request:**
```json
{
  "name": "Updated Entrance Name"
}
```

**Response (200):**
```json
{
  "id": "loc_entrance_1",
  "name": "Updated Entrance Name",
  "updated_at": "2026-08-18T12:00:00Z"
}
```

---

### DELETE /orgs/{orgId}/locations/{locationId}

Delete location.

**Response (200):**
```json
{
  "message": "Location deleted"
}
```

**Errors:**
- `409` — Location has active authorizations

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
- `not_found` — Resource not found
- `conflict` — Business rule violation (e.g., dates invalid)
- `internal_server_error` — Server error

---

## Rate Limiting

- **Auth endpoints:** 5 requests per minute per IP
- **Validation endpoint:** 100 requests per minute per user (burst allowed)
- **Other endpoints:** 60 requests per minute per user

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
