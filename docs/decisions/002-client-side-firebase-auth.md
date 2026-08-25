# Decision 002: Client-Side Firebase Authentication

**Date:** 2026-08-25
**Owning Role:** Software Architect + Security Engineer
**Approved by:** Founder / CEO
**Status:** ✅ DECIDED

---

## Context

Two design documents disagreed on how a user signs in, and only one of them
could be built:

- `docs/architecture/architecture.md` describes the browser authenticating
  against Firebase Auth directly and sending the backend a Firebase ID token,
  which the backend verifies.
- `docs/architecture/api.md` defined `POST /api/auth/signup` and
  `POST /api/auth/login` endpoints on our own backend, receiving the user's raw
  email and password.

The backend skeleton built on 2026-08-21 already implements the first model:
`backend/src/middleware/auth.ts` verifies Firebase ID tokens and rejects revoked
sessions. Continuing without resolving the contradiction would mean building a
second, conflicting authentication path.

**Constraints:**
- Data minimization is a project non-negotiable (`docs/security/data-minimization.md`).
- Firebase Auth is already the approved identity provider (Decision 001).
- The MVP has to reach beta customers quickly.

---

## Alternatives Considered

### Option A — Browser authenticates with Firebase directly ✅ CHOSEN

The frontend uses the Firebase Auth Web SDK to sign up, sign in, reset
passwords, and refresh tokens. It sends the resulting ID token to our backend on
every request. Our backend verifies the token and never sees a password.

- Our systems never receive, process, log, or store a raw password.
- Firebase handles password strength, rate limiting, breach detection, email
  verification, and password reset flows.
- Already half-built; no rework of `requireAuth`.
- Token refresh is handled by the Firebase SDK, not by us.

### Option B — Backend proxies email and password to Firebase

The frontend posts credentials to our backend, which calls the Firebase Identity
Toolkit REST API on the user's behalf and returns tokens.

- One single API surface for the frontend to talk to.
- But our backend becomes a credential-handling system: passwords pass through
  our process memory, our logs risk capturing them, and our rate limiting
  becomes the only brute-force defense.
- We would have to reimplement password reset, email verification, and refresh.
- Estimated ~2 additional days of work.

---

## Decision

**The browser authenticates with Firebase Auth directly (Option A). Our backend
only verifies Firebase ID tokens. No endpoint of ours ever accepts a password.**

### Consequences for the API

`docs/architecture/api.md` is corrected as follows:

| Endpoint | Change |
|----------|--------|
| `POST /api/auth/signup` | **Removed.** Account creation happens in the Firebase SDK. |
| `POST /api/auth/login` | **Removed.** Sign-in happens in the Firebase SDK. |
| `POST /api/auth/refresh` | **Removed.** The Firebase SDK refreshes tokens. |
| `POST /api/auth/session` | **Added.** First call after a successful Firebase sign-in. Creates or updates the `users/{uid}` profile document and returns it. Idempotent. |
| `GET /api/auth/me` | **Kept.** Returns the current user profile and their organization memberships. |
| `POST /api/auth/logout` | **Kept, redefined.** Revokes the user's Firebase refresh tokens server-side so the session cannot be resumed. The browser also clears its local session. |

### Consequences for the frontend

- The frontend depends on the Firebase Auth Web SDK and needs the public
  Firebase web config (API key, auth domain, project ID). These values are
  public by design and are not secrets.
- Every authenticated request carries `Authorization: Bearer <Firebase ID token>`.
- The sign-in screen talks to Firebase, not to our API.

### Consequences for security

- Password handling is entirely outside our trust boundary. This removes an
  entire class of risk rather than mitigating it.
- Server-side session revocation stays possible through
  `revokeRefreshTokens(uid)`, which `requireAuth` already honors by checking the
  token issue time.
- Firebase Auth's own abuse protections apply to sign-in attempts. Our
  `5 requests/minute` auth rate limit now applies to `/api/auth/session` and
  `/api/auth/logout` rather than to sign-in itself.

---

## Reversibility

**High.** Moving to Option B later would change the sign-in screen and add
backend endpoints, but would not change the data model, the authorization
domain, or how requests are authenticated (still a bearer token).

---

## Cost Impact

**Low — saves approximately 2 days** compared to Option B.

---

## Related

- `docs/decisions/001-freemium-gcp-stack.md` — Firebase Auth as identity provider
- `docs/architecture/architecture.md` — authentication flow
- `docs/architecture/api.md` — endpoint contracts
- `docs/security/data-minimization.md` — credential handling
- `backend/src/middleware/auth.ts` — implementation
