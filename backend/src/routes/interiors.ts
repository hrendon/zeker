import { Router } from 'express'
import { FieldValue } from 'firebase-admin/firestore'
import type { Transaction } from 'firebase-admin/firestore'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth.js'
import { requireOrgAdmin, requireOrgMember } from '../middleware/orgAccess.js'
import { conflict, invalidRequest, notFound } from '../lib/errors.js'
import { logger } from '../lib/logger.js'
import { orgRef } from '../lib/orgs.js'
import { createCounted, deleteCounted } from '../lib/quota.js'
import { locationRef } from '../lib/locations.js'
import { displayNames, userRef } from '../lib/users.js'
import type { UserDocument } from '../lib/users.js'
import {
  interiorRef,
  interiorsCollection,
  newInteriorId,
  toInteriorResponse,
} from '../lib/interiors.js'
import type { InteriorDocument } from '../lib/interiors.js'

export const interiorsRouter: Router = Router({ mergeParams: true })

const CreateInteriorSchema = z
  .object({
    location_id: z.string().trim().min(1),
    number: z.string().trim().min(1).max(40),
    name: z.string().trim().max(120).optional(),
    // Required since Decision 006: every interior always has a designated
    // person, and that person is an account, not typed text.
    responsable_user_id: z.string().trim().min(1),
  })
  .strict()

const UpdateInteriorSchema = z
  .object({
    number: z.string().trim().min(1).max(40).optional(),
    name: z.string().trim().max(120).optional(),
    // Handing an interior over is choosing a different person, never nobody
    // (Decision 006), so this cannot be cleared.
    responsable_user_id: z.string().trim().min(1).optional(),
    enabled: z.boolean().optional(),
  })
  .strict()
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
 * The responsable must already belong to this organization. Returns the name
 * held on their account, which is the only name an interior shows
 * (Decision 006).
 */
async function assertMemberOfOrg(uid: string, orgId: string): Promise<string> {
  const snapshot = await userRef(uid).get()
  const stored = snapshot.exists ? (snapshot.data() as Partial<UserDocument>) : undefined
  const isMember = stored?.orgs?.some((membership) => membership.org_id === orgId)

  if (!isMember) {
    throw invalidRequest(
      'That person is not a member of this organization, so they cannot be put in charge of an interior.',
    )
  }

  return [stored?.first_name ?? '', stored?.last_name ?? ''].join(' ').trim()
}

/**
 * POST /orgs/{orgId}/interiors
 *
 * Adds an interior. **Administrators only.**
 *
 * The plan limit, the uniqueness of the number within its location, and the
 * write all happen inside one transaction. Checking first and writing after
 * would let two requests both take the last free slot, or both claim
 * apartment 302.
 */
interiorsRouter.post('/', requireAuth, requireOrgAdmin, async (req, res, next) => {
  const parsed = CreateInteriorSchema.safeParse(req.body ?? {})
  if (!parsed.success) {
    next(badRequest(parsed.error))
    return
  }

  const orgId = String(req.params.orgId)
  const { location_id: locationId, number } = parsed.data
  const interiorId = newInteriorId(orgId)

  try {
    const responsableName = await assertMemberOfOrg(parsed.data.responsable_user_id, orgId)

    const document: Record<string, unknown> = {
      id: interiorId,
      org_id: orgId,
      location_id: locationId,
      number,
      name: parsed.data.name ?? '',
      responsable_user_id: parsed.data.responsable_user_id,
      enabled: true,
      created_by: req.user!.uid,
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
    }

    const { used } = await createCounted({
      orgId,
      resource: 'interiors',
      ref: interiorRef(orgId, interiorId),
      document,
      precheck: async (tx: Transaction) => {
        const location = await tx.get(locationRef(orgId, locationId))
        if (!location.exists) {
          throw invalidRequest('That location does not exist in this organization.')
        }

        const duplicate = await tx.get(
          interiorsCollection(orgId)
            .where('location_id', '==', locationId)
            .where('number', '==', number)
            .limit(1),
        )
        if (!duplicate.empty) {
          throw conflict(`This location already has an interior numbered "${number}".`)
        }
      },
    })

    // Audit trail for interior creation — Security Engineer position, Decision 001.
    logger.info(
      {
        audit: 'interior.created',
        user_id: req.user!.uid,
        org_id: orgId,
        location_id: locationId,
        interior_id: interiorId,
        request_id: req.id,
      },
      'Interior created',
    )

    const now = { toDate: () => new Date() }
    res.status(201).json({
      ...toInteriorResponse(
        { ...document, created_at: now, updated_at: now } as Partial<InteriorDocument>,
        responsableName,
      ),
      usage: { interiors: used },
      request_id: req.id,
    })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /orgs/{orgId}/interiors
 *
 * Every member can list them — security personnel need to know which interior
 * a visitor is going to. Optional `?location_id=` narrows the list.
 */
interiorsRouter.get('/', requireAuth, requireOrgMember, async (req, res, next) => {
  const orgId = String(req.params.orgId)
  const locationId = typeof req.query.location_id === 'string' ? req.query.location_id : undefined

  try {
    const base = interiorsCollection(orgId)
    const query = locationId ? base.where('location_id', '==', locationId) : base
    const snapshot = await query.get()

    const stored = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Partial<InteriorDocument>),
    }))
    // One read for the whole list rather than one per row.
    const names = await displayNames(
      stored.map((interior) => interior.responsable_user_id ?? '').filter((uid) => uid.length > 0),
    )

    const interiors = stored
      .map((interior) =>
        toInteriorResponse(interior, names.get(interior.responsable_user_id ?? '') ?? ''),
      )
      .sort((a, b) => a.number.localeCompare(b.number, 'es', { numeric: true }))

    res.json({
      interiors,
      usage: {
        // The counter covers the whole organization, so a filtered list still
        // reports the real total against the plan.
        interiors: req.org?.counts?.interiors ?? interiors.length,
        max_interiors: req.org?.limits?.max_interiors ?? null,
      },
      request_id: req.id,
    })
  } catch (error) {
    next(error)
  }
})

/** GET /orgs/{orgId}/interiors/{interiorId} */
interiorsRouter.get('/:interiorId', requireAuth, requireOrgMember, async (req, res, next) => {
  const orgId = String(req.params.orgId)
  const interiorId = String(req.params.interiorId)

  try {
    const snapshot = await interiorRef(orgId, interiorId).get()
    if (!snapshot.exists) {
      next(notFound('Interior not found.'))
      return
    }

    const stored = { id: snapshot.id, ...(snapshot.data() as Partial<InteriorDocument>) }
    const names = await displayNames([stored.responsable_user_id ?? ''])

    res.json({
      ...toInteriorResponse(stored, names.get(stored.responsable_user_id ?? '') ?? ''),
      request_id: req.id,
    })
  } catch (error) {
    next(error)
  }
})

/**
 * PUT /orgs/{orgId}/interiors/{interiorId}
 *
 * Changes an interior. **Administrators only.** The location it belongs to is
 * not changeable: moving apartment 302 to another building is really a
 * different interior, and silently moving it would carry its permits along.
 */
interiorsRouter.put('/:interiorId', requireAuth, requireOrgAdmin, async (req, res, next) => {
  const parsed = UpdateInteriorSchema.safeParse(req.body ?? {})
  if (!parsed.success) {
    next(badRequest(parsed.error))
    return
  }

  const orgId = String(req.params.orgId)
  const interiorId = String(req.params.interiorId)

  try {
    const ref = interiorRef(orgId, interiorId)
    const snapshot = await ref.get()
    if (!snapshot.exists) {
      next(notFound('Interior not found.'))
      return
    }

    const current = snapshot.data() as Partial<InteriorDocument>

    const responsableId = parsed.data.responsable_user_id ?? current.responsable_user_id ?? ''
    const responsableName = parsed.data.responsable_user_id
      ? await assertMemberOfOrg(parsed.data.responsable_user_id, orgId)
      : ((await displayNames([responsableId])).get(responsableId) ?? '')

    if (parsed.data.number !== undefined && parsed.data.number !== current.number) {
      const duplicate = await interiorsCollection(orgId)
        .where('location_id', '==', String(current.location_id))
        .where('number', '==', parsed.data.number)
        .limit(1)
        .get()

      if (!duplicate.empty) {
        next(conflict(`This location already has an interior numbered "${parsed.data.number}".`))
        return
      }
    }

    await ref.update({ ...parsed.data, updated_at: FieldValue.serverTimestamp() })

    logger.info(
      {
        audit: 'interior.updated',
        user_id: req.user!.uid,
        org_id: orgId,
        interior_id: interiorId,
        request_id: req.id,
      },
      'Interior updated',
    )

    const now = { toDate: () => new Date() }
    res.json({
      ...toInteriorResponse(
        { id: interiorId, ...current, ...parsed.data, updated_at: now },
        responsableName,
      ),
      request_id: req.id,
    })
  } catch (error) {
    next(error)
  }
})

/**
 * DELETE /orgs/{orgId}/interiors/{interiorId}
 *
 * Removes an interior and frees its slot against the plan. **Administrators
 * only.** Refused while any authorization for it is still active, so a permit
 * can never point at an interior that no longer exists.
 */
interiorsRouter.delete('/:interiorId', requireAuth, requireOrgAdmin, async (req, res, next) => {
  const orgId = String(req.params.orgId)
  const interiorId = String(req.params.interiorId)

  try {
    const ref = interiorRef(orgId, interiorId)
    const snapshot = await ref.get()
    if (!snapshot.exists) {
      next(notFound('Interior not found.'))
      return
    }

    const authorizations = await orgRef(orgId)
      .collection('authorizations')
      .where('interior_id', '==', interiorId)
      .where('status', '==', 'active')
      .limit(1)
      .get()

    if (!authorizations.empty) {
      next(
        conflict(
          'This interior still has active authorizations. Revoke them before deleting it.',
        ),
      )
      return
    }

    await deleteCounted({ orgId, resource: 'interiors', ref })

    logger.info(
      {
        audit: 'interior.deleted',
        user_id: req.user!.uid,
        org_id: orgId,
        interior_id: interiorId,
        request_id: req.id,
      },
      'Interior deleted',
    )

    res.json({ id: interiorId, deleted: true, request_id: req.id })
  } catch (error) {
    next(error)
  }
})
