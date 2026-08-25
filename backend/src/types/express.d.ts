import 'express'
import type { DecodedIdToken } from 'firebase-admin/auth'
import type { OrgMembership } from '../lib/users.js'
import type { OrgDocument } from '../lib/orgs.js'

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
      /** Set by requireOrgMember: the caller's membership of the org in the URL. */
      orgMembership?: OrgMembership
      /** Set by requireOrgMember: the organization the URL refers to. */
      org?: Partial<OrgDocument> & { id: string }
    }
  }
}
