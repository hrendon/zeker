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

- Location ID
  - Why: Specify which location this authorization applies to
  - Storage: Plain text (non-sensitive)
  - Retention: Indefinite

- Valid dates/times
  - Why: Check if authorization is currently valid
  - Storage: Plain text (timestamps)
  - Retention: Indefinite

- Authorization status (active/revoked/expired)
  - Why: Determine if authorization is usable
  - Storage: Plain text (enum)
  - Retention: Indefinite

**Audit Trail:**
- Access event timestamp
  - Why: Know when entry occurred
  - Storage: Plain text
  - Retention: 90 days (then auto-delete)

- Entry/exit action type
  - Why: Distinguish entry from exit
  - Storage: Plain text (enum)
  - Retention: 90 days

- Authorization ID (reference)
  - Why: Link event to authorization
  - Storage: Plain text (foreign key)
  - Retention: 90 days

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
- Phone number (authorized person)
  - Why: Emergency contact, optional, only if parent provides it
  - Storage: **ENCRYPTED** (AES-256, GCP KMS)
  - Retention: Until authorization expires + 30 days

- Phone number (user)
  - Why: Support/emergency, optional
  - Storage: **ENCRYPTED** (AES-256, GCP KMS)
  - Retention: While account active + 1 year

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

1. **User Email**
   - Field: `users.email_plaintext`
   - When: At rest in Firestore
   - How: Before INSERT/UPDATE, after SELECT
   - Key rotation: Quarterly (handled by KMS)
   - Decrypt only when: Sending email, identity verification

2. **Phone Numbers**
   - Field: `authorized_person.phone_encrypted`
   - Field: `users.phone_encrypted`
   - When: At rest in Firestore
   - How: AES-256-GCM (authenticated encryption)
   - Access: Only admin of org or user themselves

3. **Optional: Relationship Notes**
   - Field: `authorization_details.notes`
   - When: Contains PII (e.g., "brother of student John")
   - How: AES-256 if contains identifying info
   - Access: Admin only

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
