import { es } from './strings'

/**
 * Turns error codes into Spanish the user can act on.
 *
 * Two separate sources of codes:
 *
 *  - Firebase Auth, which the browser talks to directly (Decision 002). Its
 *    codes look like `auth/invalid-credential`.
 *  - The Zeker API, which returns `{ error, message, request_id }` where
 *    `error` is a stable code and `message` is English text for developers.
 *    The English is never shown to the user — this file is the only place the
 *    two languages meet.
 */

/** Shape the Zeker API uses for every failure. */
export interface ApiErrorBody {
  error: string
  message?: string
  request_id?: string
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly requestId?: string

  constructor(status: number, body: ApiErrorBody) {
    // The English message is kept for logs and bug reports, never for display.
    super(body.message ?? body.error)
    this.name = 'ApiError'
    this.status = status
    this.code = body.error
    this.requestId = body.request_id
  }
}

/** Raised when the request never reached the API at all. */
export class NetworkError extends Error {
  constructor(cause?: unknown) {
    super('The request did not reach the Zeker API')
    this.name = 'NetworkError'
    this.cause = cause
  }
}

const FIREBASE_MESSAGES: Record<string, string> = {
  // Modern Firebase collapses "no such user" and "wrong password" into this
  // one code on purpose, which is exactly the behaviour we want.
  'auth/invalid-credential': es.errors.badCredentials,
  'auth/wrong-password': es.errors.badCredentials,
  'auth/user-not-found': es.errors.badCredentials,
  'auth/invalid-email': es.validation.emailInvalid,
  'auth/missing-password': es.validation.passwordRequired,
  'auth/email-already-in-use': es.errors.emailInUse,
  'auth/weak-password': es.errors.weakPassword,
  'auth/too-many-requests': es.errors.tooManyAttempts,
  'auth/user-disabled': es.errors.accountDisabled,
  'auth/network-request-failed': es.errors.network,
  'auth/requires-recent-login': es.errors.sessionExpired,
  // Password links. Without these two, an expired link falls through to
  // es.errors.unknown ("algo salió mal, intente de nuevo") — which for a dead
  // link is untrue and sends the person into a retry loop against a link that
  // will never work. Found on 2026-09-01 when the Founder was locked out.
  'auth/expired-action-code': es.errors.expiredLink,
  'auth/invalid-action-code': es.errors.invalidLink,
}

const API_MESSAGES: Record<string, string> = {
  unauthorized: es.errors.sessionExpired,
  forbidden: es.errors.notAllowed,
  not_found: es.errors.notFound,
  invalid_request: es.errors.invalidRequest,
  quota_exceeded: es.errors.quotaExceeded,
  // Decision 018. A 403 that is not about the caller's role, so it must not
  // fall through to "no tiene permiso" — that sends an administrator looking
  // for a permission they already have.
  org_not_approved: es.errors.orgNotApproved,
  conflict: es.errors.conflict,
  // Decision 015. Both are 409s, and telling a guard "eso choca con algo que
  // ya existe" at a gate is the same failure Decision 008 fixed for refusals.
  note_too_late: es.gate.noteTooLate,
  note_already_recorded: es.gate.noteAlready,
  // R-02. A 429 like rate_limited, and deliberately not the same sentence:
  // "demasiados intentos" tells an administrator they did something wrong,
  // when what happened is that the day's allowance is used up and tomorrow
  // works.
  invite_limit_reached: es.errors.inviteLimitReached,
  // El tope diario de permisos, por la misma razón: sin esta línea cae en
  // "algo salió mal, intente de nuevo", que manda a la persona a reintentar
  // contra un límite que solo se abre mañana.
  permit_limit_reached: es.errors.permitLimitReached,
  rate_limited: es.errors.tooManyAttempts,
  internal_server_error: es.errors.serverError,
}

/**
 * A blocked API key referrer has no stable error code to match on.
 *
 * Google answers `403 ... Requests from referer <URL> are blocked.` and the
 * Firebase SDK, finding no code it knows, builds one out of that whole
 * sentence: `auth/requests-from-referer-https://…-are-blocked.` — the address
 * is *inside* the code, so an exact-match table can never catch it. Verified
 * against the SDK's own source (`@firebase/auth` 12.18.0) and reproduced in a
 * browser on 2026-09-02.
 */
const REFERRER_BLOCKED_PREFIX = 'auth/requests-from-referer'

function firebaseErrorCode(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null) return undefined
  const code = (error as { code?: unknown }).code
  return typeof code === 'string' ? code : undefined
}

/**
 * The single entry point: give it anything that was thrown, get Spanish back.
 * Never returns an empty string, so a screen can always show something.
 */
export function toSpanish(error: unknown): string {
  if (error instanceof NetworkError) return es.errors.network

  if (error instanceof ApiError) {
    const known = API_MESSAGES[error.code]
    if (known) return known
    // An unrecognised code still means the server refused; say so honestly
    // rather than inventing a reason.
    return error.status >= 500 ? es.errors.serverError : es.errors.unknown
  }

  const code = firebaseErrorCode(error)
  if (code) {
    if (code.startsWith(REFERRER_BLOCKED_PREFIX)) return es.errors.originBlocked

    const known = FIREBASE_MESSAGES[code]
    if (known) return known
    // Anything under auth/ that we have not mapped is still an auth failure.
    return code.startsWith('auth/') ? es.errors.unknown : es.errors.unknown
  }

  return es.errors.unknown
}
