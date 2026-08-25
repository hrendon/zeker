import type { NextFunction, Request, Response } from 'express'
import { AppError, type ErrorBody } from '../lib/errors.js'
import { logger } from '../lib/logger.js'
import { isProduction } from '../config/env.js'

/**
 * The single place a response body for a failure is produced. The shape is
 * fixed by docs/architecture/api.md: { error, message, request_id }.
 *
 * An unexpected error is logged in full but reported to the caller as a
 * generic 500 — internal details are never sent to a browser.
 */
export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (res.headersSent) {
    next(error)
    return
  }

  if (error instanceof AppError) {
    const body: ErrorBody = {
      error: error.code,
      message: error.message,
      request_id: String(req.id),
    }
    if (error.details !== undefined) body.details = error.details

    logger.warn(
      { request_id: String(req.id), code: error.code, status: error.status },
      'Request failed',
    )
    res.status(error.status).json(body)
    return
  }

  logger.error({ err: error, request_id: req.id }, 'Unhandled error')

  const body: ErrorBody = {
    error: 'internal_server_error',
    message: 'Something went wrong on our side. Please try again.',
    request_id: String(req.id),
  }
  if (!isProduction && error instanceof Error) {
    body.details = { name: error.name, message: error.message }
  }

  res.status(500).json(body)
}
