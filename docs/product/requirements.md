# Requirements — Zeker MVP

User stories and acceptance criteria for MVP implementation.

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
- [x] Admin can list all locations for their org
- [x] Admin can edit location (name, description)
- [x] Admin can delete location (only if no active authorizations reference it)
- [x] Location has ID for QR encoding

---

## US-003: Responsable Creates Authorization

**As:** Parent / resident
**I want to:** Create an access permit for another person (e.g., person who will pick up my child)
**So that:** They can enter the location during the authorized dates/times

### Acceptance Criteria

- [x] User can create authorization with:
  - Authorized person: name
  - Authorized person: phone number (optional)
  - Location: select from org's locations
  - Valid from: date + time
  - Valid to: date + time
  - Purpose: text (e.g., "pickup", "visitor")
- [x] Authorization assigned unique ID
- [x] QR code generated locally (client-side)
- [x] Numeric code generated (fallback if QR doesn't scan)
- [x] Codes stored in authorization record

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
- [x] User can share code link (ephemeral, expires if auth expires)

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
- [x] Parent notified via email (basic: "{name} entered on {date} {time}")

---

## US-006: Responsable Revokes Authorization

**As:** Parent
**I want to:** Cancel an authorization immediately
**So that:** That person can no longer enter

### Acceptance Criteria

- [x] Revoke button on authorization detail
- [x] Revoke requires confirmation
- [x] Authorization status changed to "revoked"
- [x] QR/code no longer valid immediately
- [x] Email notification to parent confirming revoke

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
- [x] Encrypt phone numbers at rest
- [x] Encrypt email addresses at rest (Firestore encryption)
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
**Last updated:** 2026-08-18
