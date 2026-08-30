import { Router } from 'express'
import { FieldValue } from 'firebase-admin/firestore'
import { z } from 'zod'
import { db } from '../lib/firebase.js'
import { requireAuth } from '../middleware/auth.js'
import { requireOrgAdmin, requireOrgMember } from '../middleware/orgAccess.js'
import { conflict, invalidRequest } from '../lib/errors.js'
import { logger } from '../lib/logger.js'
import { userRef } from '../lib/users.js'
import type { OrgMembership, UserDocument } from '../lib/users.js'
import {
  FREE_PLAN_LIMITS,
  ORG_TYPES,
  newOrgId,
  orgRef,
  toOrgResponse,
} from '../lib/orgs.js'
import type { OrgDocument } from '../lib/orgs.js'
import { locationsRouter } from './locations.js'
import { interiorsRouter } from './interiors.js'
import { membersRouter } from './members.js'
import { permitsRouter } from './permits.js'
import { validateRouter } from './validate.js'
import { hasLivePermit } from '../lib/permits.js'

export const orgsRouter: Router = Router()

// Everything nested under an organization mounts here, so it inherits the
// membership checks that keep one customer out of another's data.
orgsRouter.use('/:orgId/locations', locationsRouter)
orgsRouter.use('/:orgId/interiors', interiorsRouter)
orgsRouter.use('/:orgId/members', membersRouter)
orgsRouter.use('/:orgId/authorizations', permitsRouter)
orgsRouter.use('/:orgId/validate', validateRouter)

const CreateOrgSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    type: z.enum(ORG_TYPES),
    description: z.string().trim().max(500).optional(),
    // City and country only. A street address is never stored — see lib/orgs.ts.
    city: z.string().trim().max(80).optional(),
    country: z.string().trim().length(2).toUpperCase().optional(),
  })
  .strict()

const UpdateOrgSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    type: z.enum(ORG_TYPES).optional(),
    description: z.string().trim().max(500).optional(),
    city: z.string().trim().max(80).optional(),
    country: z.string().trim().length(2).toUpperCase().optional(),
  })
  .strict()
  // The plan, its limits and the counters are not customer-editable: they are
  // what the freemium model is enforced with.
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Send at least one field to change.',
  })

function badRequest(error: z.ZodError): ReturnType<typeof invalidRequest> {
  return invalidRequest(
    'The request body is not valid.',
    error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message })),
  )
}

/**
 * POST /orgs
 *
 * Creates an organization and makes the caller its administrator. The
 * organization document and the caller's membership are written together, so
 * an organization can never exist with nobody able to reach it.
 */
orgsRouter.post('/', requireAuth, async (req, res, next) => {
  const parsed = CreateOrgSchema.safeParse(req.body ?? {})
  if (!parsed.success) {
    next(badRequest(parsed.error))
    return
  }

  const uid = req.user!.uid
  const orgId = newOrgId()
  const membership: OrgMembership = { org_id: orgId, role: 'admin' }

  const document: Record<string, unknown> = {
    id: orgId,
    name: parsed.data.name,
    type: parsed.data.type,
    description: parsed.data.description ?? '',
    plan: 'free',
    limits: FREE_PLAN_LIMITS,
    counts: { locations: 0, interiors: 0 },
    city: parsed.data.city ?? null,
    country: parsed.data.country ?? null,
    created_by: uid,
    created_at: FieldValue.serverTimestamp(),
    updated_at: FieldValue.serverTimestamp(),
    status: 'active',
  }

  try {
    const batch = db().batch()
    batch.set(orgRef(orgId), document)
    // arrayUnion on a merge write also creates the profile if the user somehow
    // never called POST /auth/session, so creating an organization cannot fail
    // for a signed-in person.
    batch.set(
      userRef(uid),
      { id: uid, deleted: false, orgs: FieldValue.arrayUnion(membership) },
      { merge: true },
    )
    await batch.commit()

    logger.info({ user_id: uid, org_id: orgId, request_id: req.id }, 'Organization created')

    const now = { toDate: () => new Date() }
    res.status(201).json({
      ...toOrgResponse({ ...document, created_at: now, updated_at: now } as Partial<OrgDocument>, 'admin'),
      request_id: req.id,
    })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /orgs
 *
 * The organizations the caller belongs to. This is what fills the organization
 * switcher, and it is the only list of organizations any endpoint will return —
 * there is no way to see an organization you are not a member of.
 */
orgsRouter.get('/', requireAuth, async (req, res, next) => {
  const uid = req.user!.uid

  try {
    const snapshot = await userRef(uid).get()
    const stored = snapshot.exists ? (snapshot.data() as Partial<UserDocument>) : undefined
    const memberships = stored?.orgs ?? []

    if (memberships.length === 0) {
      res.json({ orgs: [], request_id: req.id })
      return
    }

    const roleByOrgId = new Map(memberships.map((m) => [m.org_id, m.role]))
    const docs = await db().getAll(...memberships.map((m) => orgRef(m.org_id)))

    const orgs = docs
      .filter((doc) => doc.exists)
      .map((doc) => ({ id: doc.id, ...(doc.data() as Partial<OrgDocument>) }))
      // A membership can outlive the organization it points at (deleted, or
      // never fully written). Those are skipped rather than returned broken.
      .filter((org) => org.status !== 'deleted')
      .map((org) => toOrgResponse(org, roleByOrgId.get(String(org.id))))

    res.json({ orgs, request_id: req.id })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /orgs/{orgId}
 *
 * Details of one organization. requireOrgMember has already proved the caller
 * belongs to it and loaded it.
 */
orgsRouter.get('/:orgId', requireAuth, requireOrgMember, (req, res) => {
  res.json({
    ...toOrgResponse(req.org!, req.orgMembership!.role),
    request_id: req.id,
  })
})

/**
 * PUT /orgs/{orgId}
 *
 * Changes the organization's own details. The plan, its limits and the usage
 * counters are not editable here — those are how the freemium model is
 * enforced, and a customer changing their own limits would defeat it.
 */
orgsRouter.put('/:orgId', requireAuth, requireOrgAdmin, async (req, res, next) => {
  const parsed = UpdateOrgSchema.safeParse(req.body ?? {})
  if (!parsed.success) {
    next(badRequest(parsed.error))
    return
  }

  const orgId = String(req.params.orgId)

  try {
    const updates: Record<string, unknown> = { ...parsed.data, updated_at: FieldValue.serverTimestamp() }
    await orgRef(orgId).update(updates)

    logger.info({ user_id: req.user!.uid, org_id: orgId, request_id: req.id }, 'Organization updated')

    const now = { toDate: () => new Date() }
    res.json({
      ...toOrgResponse({ ...req.org!, ...parsed.data, updated_at: now }, req.orgMembership!.role),
      request_id: req.id,
    })
  } catch (error) {
    next(error)
  }
})

/**
 * DELETE /orgs/{orgId}
 *
 * Marks the organization deleted rather than erasing it: access events are an
 * audit trail with a retention period, and destroying them on request would
 * defeat the point of having one.
 *
 * Refused while any permit is still live, so nobody can delete an
 * organization out from under a permit that would otherwise still open a door.
 * "Live" means not revoked *and* not yet finished — a permit that ended last
 * year must not block a deletion forever (`lib/permits.ts`).
 */
orgsRouter.delete('/:orgId', requireAuth, requireOrgAdmin, async (req, res, next) => {
  const orgId = String(req.params.orgId)

  try {
    if (await hasLivePermit(orgId)) {
      next(
        conflict(
          'This organization still has active authorizations. Revoke them before deleting it.',
        ),
      )
      return
    }

    await orgRef(orgId).update({
      status: 'deleted',
      deleted_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
    })

    logger.info({ user_id: req.user!.uid, org_id: orgId, request_id: req.id }, 'Organization deleted')

    res.json({ id: orgId, deleted: true, request_id: req.id })
  } catch (error) {
    next(error)
  }
})
