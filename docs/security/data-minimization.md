# Data Minimization Strategy — Zeker

Security policy on what personal data we collect, store, and why.

**Philosophy:** Only collect and retain the absolute minimum data needed to authorize access and maintain audit trail.

---

## Personal Data Inventory

### Tier 1: Core (Necessary for Operation)

**Authorization Verification:**
- Authorized person name (full)
  - Why: Security guard needs to verify identity at entry
  - Storage: Plain text, required
  - Retention: Until authorization expires + 1 year (audit)

- Interior ID (and the location ID copied from it)
  - Why: Which apartment the visitor is coming to, and therefore which
    entrance the permit is checked against (Decision 003)
  - Storage: Plain text (non-sensitive on its own)
  - Retention: Indefinite

- Entry code (8 random characters)
  - Why: It is what admits the visitor at the door
  - Storage: Plain text. It is a short-lived credential, not a secret to be
    hashed: the guard's device must be able to look a permit up by it
  - Note: **never written to logs.** The audit trail records the permit's id,
    never its code — logs are read by more people than permits are
  - Retention: With the permit

- Valid dates/times
  - Why: Check if authorization is currently valid
  - Storage: Plain text (timestamps)
  - Retention: Indefinite

- Authorization status (active/revoked)
  - Why: Determine if authorization is usable
  - Storage: Plain text (enum). "Expired" is **not** stored — it is computed
    from the end date, so nothing has to run to keep it true (Decision 007)
  - Retention: Indefinite

**Audit Trail** (one record per check at a door, Decision 008):
- Access event timestamp
  - Why: Know when entry occurred
  - Storage: Plain text
  - Retention: 90 days if allowed, 30 if refused (then auto-delete)

- Action type
  - Why: Distinguish entry from exit
  - Storage: Plain text (enum). Only `entry` is written — exits are not
    recorded in the MVP (Decision 008)
  - Retention: With the event

- Result, and the reason for a refusal
  - Why: The answer the guard was given, which is the point of the record
  - Storage: Plain text (enum)
  - Retention: With the event

- Permit ID and interior ID (references)
  - Why: Link the check to the permit, and to where the visitor was going
  - Storage: Plain text (foreign keys). **The visitor's name is deliberately
    not copied here** — the permit holds it, and a second copy in a second
    collection is what this policy exists to prevent (Decision 008)
  - Retention: With the event

- The code someone submitted, **only when it matched no permit**
  - Why: With no permit to point at, it is the only evidence of what was
    attempted. When a permit *was* found, its id is the reference and the code
    is not copied — a live door code has no business in a second collection
  - Storage: Plain text
  - Retention: 30 days (it is always on a refusal)

- Who made the check
  - Why: Accountability — a guard's decisions at a gate are auditable
  - Storage: Plain text (user id)
  - Retention: With the event

> **Not stored on a check: the guard's internet address, and what kind of device
> they used.** Both were in the original data model. They describe the guard,
> not the visitor, and across every scan of a shift they become a location trail
> of a customer's own staff — something we would then have to disclose, defend
> and protect, for an investigation nobody has asked for. Founder decision,
> 2026-08-30 (Decision 008).

**User Account:**
- Email address
  - Why: Authentication, login, notifications
  - Storage: **ENCRYPTED** (AES-256, GCP KMS)
  - Retention: While account active, then mask

- Hashed password
  - Why: Authentication
  - Storage: Firebase Auth (out of scope, managed by Google)
  - Retention: While account active

- First name + Last name (user profile)
  - Why: Display in dashboard, contact info
  - Storage: Plain text
  - Retention: While account active

---

### Tier 2: Secondary (Contact & Context)

**Optional Contact Information:**

> ❌ **Superseded — no phone number is stored anywhere in the MVP.**
> - The user's phone was dropped when sign-in moved to Firebase (Decision 002).
> - The organization's phone was dropped as unnecessary (Decision 003).
> - The visitor's phone on a permit was dropped deliberately (Decision 005): the
>   visitor is not our user, never consented, and nothing in the product sends
>   them anything.
>
> The original plan is kept below, struck through, because it explains why the
> Cloud KMS key exists and what it would be for if any of these is revisited.

- ~~Phone number (authorized person)~~ — not collected (Decision 005)
  - ~~Why: Emergency contact, optional, only if parent provides it~~
  - ~~Storage: **ENCRYPTED** (AES-256, GCP KMS)~~
  - ~~Retention: Until authorization expires + 30 days~~

- ~~Phone number (user)~~ — not collected (Decision 002)
  - ~~Why: Support/emergency, optional~~
  - ~~Storage: **ENCRYPTED** (AES-256, GCP KMS)~~
  - ~~Retention: While account active + 1 year~~

**Relationship/Role Metadata:**
- Relationship (e.g., "grandmother", "nanny", "parent")
  - Why: Context for security personnel
  - Storage: Plain text (enum)
  - Retention: Until authorization expires + 1 year

- Purpose of access (e.g., "school_pickup", "visitor", "provider")
  - Why: Context and categorization
  - Storage: Plain text (enum)
  - Retention: Until authorization expires + 1 year

---

### Tier 3: NEVER STORE

**Free text written by a guard about a person** (added 2026-09-02, Decision 015):
- ❌ A notes or comment field on a check at the gate
- ❌ A notes field on a permit (already refused in Decision 007)

Not because free text is personal data in itself, but because of **what
reliably ends up in it**. A guard is rotating staff from a contracted security
firm, not the customer's employee, typing with a person waiting at the door.
What lands there is cédula numbers, phone numbers, physical and ethnic
descriptions, and facts about third parties who consented to nothing — every
one of them already on this list below.

The Founder asked for exactly this feature on 2026-09-02 and, given the reason,
chose a closed list of four reasons a guard touches instead. **Detecting an ID
number before saving was also considered and rejected**: at a gate it fails in
both directions, letting real personal data through while refusing a legitimate
note at the worst possible moment. A field that cannot hold the data is the only
control that holds.

**Identity Documents:**
- ❌ Cédula number (Colombian ID)
- ❌ Passport number
- ❌ Driver's license
- ❌ Any government ID full details

**Biometric Data:**
- ❌ Fingerprints
- ❌ Facial scans
- ❌ Iris scans
- ❌ Behavioral biometrics

**Visual Records:**
- ❌ Photos of people
- ❌ Video/footage (handled by separate security cameras, not Zeker)
- ❌ Screenshots containing PII

**Financial Information:**
- ❌ Bank account numbers
- ❌ Credit card information
- ❌ Salary / compensation
- ❌ Payment method

**Sensitive Personal Information:**
- ❌ Medical/health information
- ❌ Racial or ethnic origin
- ❌ Religious or political beliefs
- ❌ Sexual orientation
- ❌ Union membership
- ❌ Criminal history

**Detailed Location Information:**
- ❌ Residential address (street + number + apartment)
  - OK: City + country (for localization)
  - NOT OK: Exact home address

- ❌ GPS/location coordinates of personal residences

**Information About Minors (Special Handling):**
- ❌ Child's full name in authorization (unless necessary for identity)
  - OK: "Student" or ID reference ("Maria, recipient of #AUTH123")
  - NOT OK: "María José García López" in permanent record

- ❌ Child's age or date of birth
  - OK: In parent's local notes (never sent to server)
  - NOT OK: In database

- ❌ Child's school name/class
  - OK: Location as "School Pickup Point"
  - NOT OK: "Colegio Bilingüe X, Class 3B"

- ❌ Photos of children
- ❌ Health/dietary information about children

---

## Encryption Requirements

### Fields to Encrypt (AES-256, GCP KMS)

> ❌ **Superseded — nothing is application-encrypted in the MVP, because no
> field that would need it is stored any more.** Decisions 002, 003 and 005
> removed every one of them. Firestore still encrypts everything at rest with
> Google-managed keys; that is unchanged and always applied. The
> `zeker-encryption-key` in Cloud KMS stays in place, unused, so that revisiting
> any of those decisions does not start from zero.
>
> The original plan is kept below because it defines what to build if that
> happens.

1. ~~**User Email**~~ — not stored (Decision 002; Firebase Auth is the record)
   - ~~Field: `users.email_plaintext`~~
   - ~~When: At rest in Firestore~~
   - ~~How: Before INSERT/UPDATE, after SELECT~~
   - ~~Key rotation: Quarterly (handled by KMS)~~
   - ~~Decrypt only when: Sending email, identity verification~~

2. ~~**Phone Numbers**~~ — not collected (Decisions 002, 005)
   - ~~Field: `authorized_person.phone_encrypted`~~
   - ~~Field: `users.phone_encrypted`~~
   - ~~When: At rest in Firestore~~
   - ~~How: AES-256-GCM (authenticated encryption)~~
   - ~~Access: Only admin of org or user themselves~~

3. ~~**Optional: Relationship Notes**~~ — **the field does not exist**
   (Decision 007). A free-text note on a permit is where an identity-document
   number eventually gets typed. A permit carries the visitor's name, where
   they are going, when, and a purpose chosen from a list. Nothing else.

### Encryption in Transit

- All API communication: **TLS 1.3** (automatic via HTTPS)
- Firebase Auth: Handles token encryption
- No unencrypted HTTP traffic ever

### Key Management

```
GCP Cloud KMS
├── zeker-master-key (rotated annually)
└── encryption context: org_id
    
Firestore native encryption:
├── Google-managed keys (default)
└── Customer-managed keys (future)

Secret Manager:
├── Firebase Private Key
├── Service Account Key
└── Database credentials
```

---

## Data Retention & Deletion

### Automatic Deletion (TTL)

```
Access Events (success):
  - TTL: 90 days after creation
  - Why: Audit trail, not operational
  
Denied/Failed Events:
  - TTL: 30 days after creation
  - Why: Security review only, shorter than success
  
Revoked Authorizations:
  - TTL: 1 year after revocation
  - Why: Regulatory audit, then archive to Cloud Storage
  - After 1 year: Move to archive bucket, delete from Firestore
```

### User-Initiated Deletion (Right to Forget)

```
User requests: DELETE /api/users/{userId}

Cascade:
1. Mark user as deleted (soft delete)
2. Delete all authorizations created by this user
3. Delete all personal info (email, phone)
4. Mask user_id in access_events (replace with "redacted")
5. Keep event records for audit (timestamps only)
6. Email confirmation to user
```

**Caveat:** Cannot truly delete if child safety requires retention (escalate to legal).

---

## Compliance Frameworks

### Colombia (Ley 1581/2016 — Habeas Data)

**Principles:**
- Lawfulness: Collect only with explicit consent
- Purpose: Use data only for stated purpose
- Necessity: Collect only necessary data
- Quality: Keep data accurate and up-to-date
- Transparency: Inform user how data is used
- Access: User can request access/correction/deletion
- Security: Protect data from unauthorized access

**Implementation in Zeker:**
- ✅ Privacy policy (in Spanish, clear language)
- ✅ Explicit consent checkbox at signup (terms + privacy)
- ✅ Data minimization (don't collect extra)
- ✅ Encryption (protect at rest)
- ✅ Access controls (users can download their data)
- ✅ Deletion mechanism (GDPR-like: right to be forgotten)
- ✅ Audit log (who accessed what data, when)

### GDPR (if expanding to EU)

**Principles:** Similar to LSPDP, stricter on minors.

**Changes needed for EU:**
- Explicit parental consent for any data on minors under 16
- Data Processing Agreement (DPA) with cloud providers
- EU representative contact info
- Breach notification within 72 hours

**For now (Colombia only):**
- LSPDP compliance sufficient
- Note: Prepare architecture to support DPA/GDPR later

### Special Handling for Minors

**Colombia Law:**
- Data about minors: Parent/guardian consent required
- Parental rights: Parent can request, modify, delete child's data
- Age cutoff: Usually 14 for independent consent, below that needs parent

**Zeker Implementation:**
- Cannot create authorization for child directly (parent creates it)
- Minimize child identification (use "Student" instead of full name where possible)
- Parent gets all notifications (child data access is parent's right)
- Consent flow: "By creating this authorization, you confirm you have parental authority"

---

## Threat Model & Mitigations

### Threat 1: Insider Access (Employee Steals Data)

**Scenario:** Zeker employee downloads Firestore database with personal data.

**Mitigations:**
- ✅ Encryption at rest (data unreadable without KMS key)
- ✅ Role-based access controls (engineers don't have prod DB read)
- ✅ Audit logging (who accessed what, when)
- ✅ Secrets in Secret Manager, not in code
- ✅ 2FA on GCP console access
- ⚠️ GCP audit logs reviewed quarterly (catch unauthorized access)

---

### Threat 2: Hacker Accesses Database via SQL/NoSQL Injection

**Scenario:** Attacker injects query to dump user table.

**Mitigations:**
- ✅ Firestore (not SQL): No SQL injection possible
- ✅ ORM/query builder: Firebase SDK prevents malformed queries
- ✅ Input validation: All user input validated before query
- ✅ Rate limiting: Brute force attempts blocked
- ✅ IDS: Cloud Logging monitors unusual query patterns

---

### Threat 3: Unauthorized Access to Another Org's Data

**Scenario:** User admin of Org A tries to read Org B data.

**Mitigations:**
- ✅ Firestore security rules: Enforce org isolation
- ✅ Backend middleware: Check org membership before query
- ✅ JWT token: Includes allowed orgs, validated server-side
- ⚠️ Test: Unit tests verify org isolation

---

### Threat 4: MITM Attack (Network Sniffing)

**Scenario:** Attacker on same WiFi intercepts API calls, steals auth token.

**Mitigations:**
- ✅ TLS 1.3: Encrypts all traffic end-to-end
- ✅ HSTS: Enforce HTTPS, no fallback to HTTP
- ✅ Token expiry: JWT expires in 15 minutes
- ✅ Refresh tokens: In HTTPOnly cookies (not accessible to JS)

---

### Threat 5: Parent Data Leak (Accidentally Stores Document Photo)

**Scenario:** Parent uploads photo of passport "for records," system crashes.

**Mitigations:**
- ✅ No file upload in MVP (no way to upload documents)
- ✅ UI: Never asks for ID, photos, documents
- ✅ API validation: Reject any binary data
- ⚠️ Education: Privacy policy + in-app guidance

---

## Encryption Implementation (Code Pattern)

### Backend (Node.js)

```javascript
// Encrypt on write
async function createAuthorization(authData) {
  const encrypted = {
    ...authData,
    authorized_person: {
      ...authData.authorized_person,
      phone_encrypted: authData.authorized_person.phone 
        ? await encryptSensitive(authData.authorized_person.phone)
        : null
    }
  };
  
  await db.collection('orgs').doc(orgId)
    .collection('authorizations').doc(authData.id).set(encrypted);
}

// Decrypt on read
async function getAuthorization(authId) {
  const doc = await db.collection('orgs').doc(orgId)
    .collection('authorizations').doc(authId).get();
  
  const data = doc.data();
  return {
    ...data,
    authorized_person: {
      ...data.authorized_person,
      phone: data.authorized_person.phone_encrypted
        ? await decryptSensitive(data.authorized_person.phone_encrypted)
        : null
    }
  };
}

// Sensitive field encryption (using GCP KMS)
async function encryptSensitive(plaintext) {
  const key = kmsClient.getKey('zeker-master-key');
  return await key.encrypt(plaintext);
}

async function decryptSensitive(ciphertext) {
  const key = kmsClient.getKey('zeker-master-key');
  return await key.decrypt(ciphertext);
}
```

### Frontend (React)

```javascript
// Sensitive fields NOT encrypted on frontend
// (too risky, keys could leak in JS)
// Send over TLS only

const handlePhoneInput = (phone) => {
  // Validate format only
  if (!isValidPhone(phone)) {
    setError("Invalid phone format");
    return;
  }
  // Will be encrypted by backend
  setFormData({ ...formData, phone });
};

// On submit: send via HTTPS to backend
fetch('/api/authorizations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', ...authHeaders },
  body: JSON.stringify(formData)  // HTTPS handles encryption
});
```

---

## Monitoring & Audit

### What Gets Logged

```
✅ User login attempt (success/fail)
✅ Create/update/delete operations (who, when, resource ID)
✅ Data access (query logs)
❌ Actual data values (never log plaintext PII)
❌ API request bodies (could contain passwords)
```

### Audit Log Queries

```javascript
// "Who accessed org X?"
db.collection('audit_logs').where('org_id', '==', orgId).get();

// "Who deleted authorization Y?"
db.collection('audit_logs')
  .where('resource_id', '==', authId)
  .where('action', '==', 'delete').get();

// "Were there any failed login attempts for user Z?"
db.collection('audit_logs')
  .where('user_id', '==', userId)
  .where('action', '==', 'login_failed').get();
```

---

## Privacy Policy (Public Text, in Spanish)

**Location:** Will be at `/privacy` on the website, in Spanish.

**Sections:**
1. What data we collect
2. Why we collect it
3. How we protect it
4. How long we keep it
5. Your rights (access, correction, deletion)
6. Contact for privacy questions
7. Compliance with Ley 1581/2016 + GDPR (future)

**Draft:** To be written by Security Engineer + Legal (Phase 1.5)

---

**Owner:** Security Engineer / CISO
**Last updated:** 2026-08-18
**Related:** `threat-model.md`, `architecture.md` (encryption strategy)
