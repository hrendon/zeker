/**
 * Error codes are the contract documented in docs/architecture/api.md.
 * Every failed response carries one of these, never a raw stack trace.
 */
export const ErrorCode = {
  invalid_request: 400,
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
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
