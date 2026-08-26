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
}

const API_MESSAGES: Record<string, string> = {
  unauthorized: es.errors.sessionExpired,
  forbidden: es.errors.notAllowed,
  not_found: es.errors.notFound,
  invalid_request: es.errors.invalidRequest,
  quota_exceeded: es.errors.quotaExceeded,
  conflict: es.errors.conflict,
  rate_limited: es.errors.tooManyAttempts,
  internal_server_error: es.errors.serverError,
}

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
    const known = FIREBASE_MESSAGES[code]
    if (known) return known
    // Anything under auth/ that we have not mapped is still an auth failure.
    return code.startsWith('auth/') ? es.errors.unknown : es.errors.unknown
  }

  return es.errors.unknown
}
