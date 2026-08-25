import { randomUUID } from 'node:crypto'
import type { NextFunction, Request, Response } from 'express'

/**
 * Every request carries an id so a log line, an error body, and an access
 * event can all be tied back to the same call. An incoming X-Request-Id is
 * honoured (Cloud Run and the frontend may set one); otherwise one is created.
 */
export function requestId(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.get('x-request-id')
  req.id = incoming && incoming.length <= 128 ? incoming : `req_${randomUUID()}`
  res.setHeader('X-Request-Id', req.id)
  next()
}
