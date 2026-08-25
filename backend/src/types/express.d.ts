import 'express'
import type { DecodedIdToken } from 'firebase-admin/auth'

export interface AuthenticatedUser {
  uid: string
  email: string | undefined
  token: DecodedIdToken
}

declare global {
  namespace Express {
    interface Request {
      /** Set by requireAuth once the Firebase token has been verified. */
      user?: AuthenticatedUser
    }
  }
}
