import type { NextFunction, Request, Response } from 'express'
import { notFound } from '../lib/errors.js'

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(notFound(`No route matches ${req.method} ${req.path}.`))
}
