import type { NextFunction, Request, Response } from 'express'
import { auth } from '../lib/firebase.js'
import { unauthorized } from '../lib/errors.js'
import { logger } from '../lib/logger.js'

const BEARER = /^Bearer (.+)$/i

/**
 * Verifies the Firebase ID token the frontend obtained from Firebase Auth.
 * The password itself never reaches this server — only the signed token does.
 * See docs/architecture/architecture.md, "User → Backend Authentication".
 */
export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const header = req.get('authorization')
  if (!header) {
    next(unauthorized('Missing Authorization header.'))
    return
  }

  const match = BEARER.exec(header)
  const token = match?.[1]?.trim()
  if (!token) {
    next(unauthorized('Authorization header must be in the form "Bearer <token>".'))
    return
  }

  try {
    // checkRevoked=true so a revoked session stops working immediately rather
    // than staying valid until the token expires.
    const decoded = await auth().verifyIdToken(token, true)
    req.user = { uid: decoded.uid, email: decoded.email, token: decoded }
    next()
  } catch (error) {
    logger.debug({ err: error, request_id: req.id }, 'ID token rejected')
    next(unauthorized('Invalid or expired session. Please sign in again.'))
  }
}
