# Requirements — Zeker MVP

User stories and acceptance criteria for MVP implementation.

> **Reading the checkboxes.** A ticked box means "this is a required criterion",
> not "this is built". Build progress lives in `PROJECT_STATE.md`. US-011 uses
> unticked boxes because it was written after this convention was noticed; the
> rest are being left as they are rather than re-marked, to avoid implying a
> change of meaning that did not happen.

## US-001: Admin Creates Organization

**As:** School director / building administrator
**I want to:** Create a new organization in the system
**So that:** I have a dedicated space to manage access for my organization

### Acceptance Criteria

- [x] User can fill in: Organization name, organization type (school/residence/office/other)
- [x] Organization is created and assigned a unique tenant ID
- [x] User is automatically admin of the new org
- [x] User can see the org in their org list
- [x] Email confirmation sent (basic notification)

---

## US-002: Admin Adds Access Points/Locations

**As:** School director
**I want to:** Define locations where access will be controlled (entrance, reception, classroom, etc.)
**So that:** I can assign authorizations to specific places

### Acceptance Criteria

- [x] Admin can add location: name, description
- [x] Number of locations is limited by the organization's plan (1 on the free
      plan, per Decision 003) — creating beyond it is blocked
- [x] Interiors inside a location are managed separately — see US-011
- [x] Admin can list all locations for their org
- [x] Admin can edit location (name, description)
- [x] Admin can delete location (only if no active authorizations reference it)
- [x] Location has ID for QR encoding

---

## US-011: Admin Manages Interiors

**As:** Building administrator / school director
**I want to:** Register the units inside a location — apartments, warehouse
bays, zones — each with its number and the person in charge
**So that:** Each resident or responsable can issue entry permits for their own
unit, and security knows who a visitor is coming to see

Added by Decision 003. The free-tier offer approved in Decision 001 is sold in
these units, so the product could not deliver what it sells without them.

### Acceptance Criteria

- [ ] Admin can add an interior: location, number, name (optional), person in charge
- [ ] The number must be unique inside its location; the same number may repeat
      in a different location
- [ ] An interior can be linked to a user account, so that person can issue
      permits for it. That person must already belong to the organization
- [ ] Admin can list interiors, filter them by location, and see the number used
      against the plan limit
- [ ] Admin can rename an interior and change who is in charge
- [ ] Admin can delete an interior, which frees a slot against the plan
- [ ] Deleting is refused while a permit for that interior is still active
- [ ] An interior cannot be moved to a different location
- [ ] Creating beyond the plan limit is blocked with a clear Spanish message,
      counting **all** interiors in the organization, not per location
- [ ] Every create, change and delete is written to the audit trail

**Status (2026-08-25):** implemented on the server, no interface yet.

---

## US-003: Responsable Creates Authorization

**As:** Parent / resident
**I want to:** Create an access permit for another person (e.g., person who will pick up my child)
**So that:** They can enter the location during the authorized dates/times

### Acceptance Criteria

- [x] User can create authorization with:
  - Authorized person: name
  - Interior: which unit the visitor is coming to (Decision 003). The location
    is derived from it and is not chosen separately
  - Valid from: date + time
  - Valid to: date + time
  - Purpose: chosen from a list, not free text
- [x] Authorization assigned unique ID
- [x] QR code generated locally (client-side)
- [x] Numeric code generated (fallback if QR doesn't scan)
- [x] The numeric code is stored; **the QR image is not** — it encodes the code,
      so the browser draws it (Decision 007)

> ⚠️ **A daily time window** (`time_from` / `time_to` — valid every day but only
> between 14:00 and 17:00) is **not built**. Founder's decision, 2026-08-29: it
> needs each building's local time, which is not stored. A permit runs from one
> moment to another moment.

---

## US-004: Responsable Generates & Shares Code

**As:** Parent
**I want to:** Get a QR code or numeric code that the authorized person can scan at entry
**So that:** They can prove they're authorized

### Acceptance Criteria

- [x] QR code displayed prominently (large, scannable from phone)
- [x] Numeric code displayed below (format: XXXX-XXXX, 8 chars)
- [x] User can copy code to clipboard
- [x] User can download QR as image (PNG)
- [ ] ⚠️ **Share code link — not built.** Founder's decision, 2026-08-29: a
      public page keyed by a permit code is a new unauthenticated entrance to
      the product, and it tells anyone holding the link where a named person is
      going. The resident sends the QR image or the eight characters through
      whatever they already use (Decision 007)

---

## US-005: Security Validates & Registers Entry

**As:** Security guard
**I want to:** Scan a QR code and instantly see if the person can enter
**So that:** I register entry/exit quickly with no confusion

### Acceptance Criteria

- [x] Security UI: full-screen input for QR scan
- [x] Scan reads QR code (via device camera or manual input)
- [x] System validates authorization in real-time:
  - Authorization exists?
  - Not revoked?
  - Dates in range?
  - Location matches?
  - Current time in allowed window?
- [x] Response within 2 seconds
- [x] Clear success (green): name, location, allowed time
- [x] Clear failure (red): reason (expired, wrong location, revoked, etc.)
- [x] Event logged (entry)
- [ ] ⚠️ **Email on entry — not built.** The product can send no email of its
      own; Firebase Auth sends only password emails. This needs a paid
      notification service, a new supplier, and a privacy decision about telling
      an outside company who visited whom. Deferred on 2026-08-29 until real
      customers say whether they want it (Decision 007). The resident sees the
      entry in the app instead

---

## US-006: Responsable Revokes Authorization

**As:** Parent
**I want to:** Cancel an authorization immediately
**So that:** That person can no longer enter

### Acceptance Criteria

- [x] Revoke button on authorization detail ("Anular el permiso")
- [x] Revoke requires confirmation
- [x] Authorization status changed to "revoked"; the record is kept, never
      deleted — it is part of the audit trail
- [x] QR/code no longer valid immediately, and the screen stops showing them
- [ ] ⚠️ **Email confirming the revoke — not built**, for the same reason as
      US-005 above

---

## US-007: Responsable Views Entry History

**As:** Parent
**I want to:** See who entered, when, and what the status was
**So that:** I have a record and can detect unauthorized entries

### Acceptance Criteria

- [x] History page shows all entry/exit events for user's authorizations
- [x] Each event shows: name, date, time, location, status (allowed/denied)
- [x] Filter by date range
- [x] Filter by authorization (dropdown)
- [x] Sortable by date (newest first)

---

## US-008: Admin Views Organization Reports

**As:** School director
**I want to:** See summary metrics for the org
**So that:** I understand access patterns

### Acceptance Criteria

- [x] Dashboard shows:
  - Total authorizations (active, revoked, expired)
  - Entries today/this week/this month
  - Top entry points (locations)
  - Failed/denied entries (count)
- [x] Simple line chart: entries over last 7 days
- [x] List of locations with entry count each

---

## US-009: Multi-Org Admin Pattern

**As:** Manager of multiple buildings/schools
**I want to:** Switch between orgs I manage
**So that:** I can see data and make changes in each org

### Acceptance Criteria

- [x] User can be admin of multiple orgs
- [x] Org selector/dropdown in dashboard (top-left or menu)
- [x] Switching org shows only that org's data
- [x] User can only create locations/see events for their orgs
- [x] No data leakage between orgs

---

## US-010: PWA Offline Support (Read-Only)

**As:** Security guard
**I want to:** Scan a QR code even if internet is temporarily offline
**So that:** Operations don't stop

### Acceptance Criteria

- [x] App can be installed as PWA (Add to Home Screen)
- [x] Offline mode: cached authorizations can be validated
- [x] Offline mode marked clearly (badge, warning)
- [x] Online sync: when connection returns, logs sync to backend
- [x] Offline cache expires after 24 hours (security)

---

## Cross-Cutting Requirements

### Authentication & Authorization

- [x] Sign up: email + password (Firebase Auth)
- [x] Sign in: email + password
- [x] Sign in: Google OAuth (optional, Phase 1.5)
- [x] Password reset: email link
- [x] Admin role: can manage org, locations, view all events
- [x] Responsable role: can create auth, see own history
- [x] Security role: read-only, can only scan/validate
- [x] No user can access data from another org

### Data & Privacy

- [x] Never store ID documents
- [x] Never store photos
- [x] No phone number is stored — not for a user, not for an organization, not
      for a visitor on a permit (Decisions 002, 003, 005)
- [x] No email address is stored in our database — Firebase Auth holds it and
      sends it verified with every request (Decision 002)
- [x] Logs retention: 90 days (auto-delete)
- [x] User deletion: cascade delete all their authorizations + events

### Performance

- [x] Entry validation: <2 seconds
- [x] Page load: <3 seconds
- [x] QR scan: <500ms processing
- [x] No calls to auth service per validation (cached)

### Infrastructure

- [x] Backend: Node.js + Express on GCP Cloud Run
- [x] Frontend: Next.js + React + PWA on Vercel
- [x] Database: Firestore (GCP)
- [x] Auth: Firebase Auth
- [x] Encryption: GCP KMS for sensitive fields
- [x] Stay within GCP free tier (< 50k reads/day, < 20k writes/day)

---

**Owner:** Product Owner
**Last updated:** 2026-08-25
