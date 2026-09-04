import type { NextFunction, Request, Response } from 'express'
import { forbidden, notFound, orgNotApproved } from '../lib/errors.js'
import { userRef } from '../lib/users.js'
import type { OrgMembership, UserDocument } from '../lib/users.js'
import { isApproved, orgRef } from '../lib/orgs.js'
import type { OrgDocument } from '../lib/orgs.js'

/**
 * Keeping one customer's data away from another's is enforced here, in code.
 *
 * Since Decision 004 closed direct database access, there is no second safety
 * net: if a route that touches organization data does not run this middleware,
 * nothing else will stop one customer reading another's records. Every
 * org-scoped route mounts it.
 *
 * A caller who is not a member gets 404, not 403 — telling a stranger that an
 * organization exists is itself a small leak. A member who simply lacks the
 * required role gets 403, because they already know it exists.
 */

async function loadMembership(uid: string, orgId: string): Promise<OrgMembership | undefined> {
  const snapshot = await userRef(uid).get()
  if (!snapshot.exists) return undefined

  const stored = snapshot.data() as Partial<UserDocument> | undefined
  if (stored?.deleted) return undefined

  return stored?.orgs?.find((membership) => membership.org_id === orgId)
}

/** Requires the caller to belong to the organization in the URL, in any role. */
export async function requireOrgMember(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const uid = req.user?.uid
  // Express 5 types a route param as string | string[]; this route declares one.
  const orgId = typeof req.params.orgId === 'string' ? req.params.orgId : undefined

  if (!uid || !orgId) {
    next(notFound('Organization not found.'))
    return
  }

  try {
    const membership = await loadMembership(uid, orgId)
    if (!membership) {
      next(notFound('Organization not found.'))
      return
    }

    const snapshot = await orgRef(orgId).get()
    const org = snapshot.exists ? (snapshot.data() as Partial<OrgDocument>) : undefined
    if (!org || org.status === 'deleted') {
      next(notFound('Organization not found.'))
      return
    }

    req.orgMembership = membership
    req.org = { ...org, id: orgId }
    next()
  } catch (error) {
    next(error)
  }
}

/** Requires the caller to be an admin of the organization in the URL. */
export function requireOrgAdmin(req: Request, res: Response, next: NextFunction): void {
  void requireOrgMember(req, res, (error?: unknown) => {
    if (error) {
      next(error)
      return
    }
    if (req.orgMembership?.role !== 'admin') {
      next(forbidden('Only an administrator of this organization can do this.'))
      return
    }
    next()
  })
}

/**
 * Requires that a person has approved this building (Decision 018).
 *
 * Mounted **only** on the routes that would put a third person's data into the
 * system: adding a member, and issuing a permit. Not on the organization, its
 * entrances or its interiors — a stranger setting up a fictional building on
 * their own is harmless and reversible, and walling that off would stop the
 * thing we want them to do while they wait.
 *
 * Runs after `requireOrgMember`, which has already loaded the organization, so
 * this costs no extra read.
 *
 * **Absent means approved** (`isApproved`), so every organization created
 * before 2026-09-04 passes. The refusal carries its own code: a member being
 * told "no tiene permiso" would go looking for a role they lack, when what is
 * missing is a person's approval of the building.
 */
export function requireApprovedOrg(req: Request, _res: Response, next: NextFunction): void {
  if (!isApproved(req.org)) {
    next(orgNotApproved())
    return
  }
  next()
}
