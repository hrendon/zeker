/**
 * Error codes are the contract documented in docs/architecture/api.md.
 * Every failed response carries one of these, never a raw stack trace.
 */
export const ErrorCode = {
  invalid_request: 400,
  unauthorized: 401,
  forbidden: 403,
  // A separate 403 code so the interface can show the plan-limit message in
  // the user's language instead of a generic "not allowed" (Decision 003).
  quota_exceeded: 403,
  // Decision 018. The organization exists and the caller belongs to it; what
  // is missing is that a person has approved the building. Its own code so the
  // screen can explain that instead of showing "no tiene permiso", which would
  // be false and would send an administrator looking for a role they lack.
  org_not_approved: 403,
  not_found: 404,
  conflict: 409,
  // Two separate 409 codes, for the same reason quota_exceeded is a separate
  // 403: a guard at a gate who is told only "that clashes with something"
  // cannot explain anything to the person in front of them (Decision 008's
  // rule, applied to Decision 015's refusals).
  note_too_late: 409,
  note_already_recorded: 409,
  // A separate 429 from the general rate limit, and it is not about speed:
  // it is the number of accounts one organization may cause to exist in a
  // day. Adding a person makes Google send them an email with our name on it
  // (R-02), so an uncapped organization is a spam relay wearing our identity.
  // Its own code so the screen can say what actually happened.
  invite_limit_reached: 429,
  rate_limited: 429,
  internal_server_error: 500,
} as const

export type ErrorCodeName = keyof typeof ErrorCode

export interface ErrorBody {
  error: ErrorCodeName
  message: string
  request_id: string
  details?: unknown
}

export class AppError extends Error {
  readonly code: ErrorCodeName
  readonly status: number
  readonly details: unknown

  constructor(code: ErrorCodeName, message: string, details?: unknown) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.status = ErrorCode[code]
    this.details = details
  }
}

export const invalidRequest = (message: string, details?: unknown): AppError =>
  new AppError('invalid_request', message, details)

export const unauthorized = (message = 'Authentication is required.'): AppError =>
  new AppError('unauthorized', message)

export const forbidden = (message = 'You do not have access to this resource.'): AppError =>
  new AppError('forbidden', message)

export const notFound = (message = 'Resource not found.'): AppError =>
  new AppError('not_found', message)

export const conflict = (message: string): AppError => new AppError('conflict', message)

/** Decision 015. The ten-minute window has passed. */
export const noteTooLate = (message: string): AppError => new AppError('note_too_late', message)

/** Decision 015. One note per check, so a count can never go below the truth. */
export const noteAlreadyRecorded = (message: string): AppError =>
  new AppError('note_already_recorded', message)

/** Decision 018. Nobody has approved this building yet. */
export const orgNotApproved = (): AppError =>
  new AppError(
    'org_not_approved',
    'This organization is waiting to be approved. You can set up its entrances and interiors meanwhile.',
  )

/** R-02. This organization has invited as many people today as it may. */
export const inviteLimitReached = (limit: number): AppError =>
  new AppError(
    'invite_limit_reached',
    `This organization can add ${limit} people per day. Try again tomorrow.`,
    { limit },
  )
