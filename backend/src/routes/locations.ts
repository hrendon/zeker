import { Router } from 'express'
import { FieldValue } from 'firebase-admin/firestore'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth.js'
import { requireOrgAdmin, requireOrgMember } from '../middleware/orgAccess.js'
import { conflict, invalidRequest, notFound } from '../lib/errors.js'
import { logger } from '../lib/logger.js'
import { orgRef } from '../lib/orgs.js'
import { createCounted, deleteCounted } from '../lib/quota.js'
import {
  LOCATION_TYPES,
  locationRef,
  locationsCollection,
  newLocationId,
  toLocationResponse,
} from '../lib/locations.js'
import type { LocationDocument } from '../lib/locations.js'
import { hasLivePermit } from '../lib/permits.js'

// mergeParams so :orgId from the parent path is visible here.
export const locationsRouter: Router = Router({ mergeParams: true })

const CreateLocationSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    description: z.string().trim().max(500).optional(),
    type: z.enum(LOCATION_TYPES).optional(),
  })
  .strict()

const UpdateLocationSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    description: z.string().trim().max(500).optional(),
    type: z.enum(LOCATION_TYPES).optional(),
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
 * POST /orgs/{orgId}/locations
 *
 * Adds a location, refusing once the organization's plan limit is reached.
 * The check and the write happen in one transaction, so two requests arriving
 * together cannot both slip past the last free slot.
 */
locationsRouter.post('/', requireAuth, requireOrgAdmin, async (req, res, next) => {
  const parsed = CreateLocationSchema.safeParse(req.body ?? {})
  if (!parsed.success) {
    next(badRequest(parsed.error))
    return
  }

  const orgId = String(req.params.orgId)
  const locationId = newLocationId(orgId)

  const document: Record<string, unknown> = {
    id: locationId,
    org_id: orgId,
    name: parsed.data.name,
    description: parsed.data.description ?? '',
    type: parsed.data.type ?? 'other',
    enabled: true,
    created_by: req.user!.uid,
    created_at: FieldValue.serverTimestamp(),
    updated_at: FieldValue.serverTimestamp(),
  }

  try {
    const { used } = await createCounted({
      orgId,
      resource: 'locations',
      ref: locationRef(orgId, locationId),
      document,
    })

    logger.info(
      { user_id: req.user!.uid, org_id: orgId, location_id: locationId, request_id: req.id },
      'Location created',
    )

    const now = { toDate: () => new Date() }
    res.status(201).json({
      ...toLocationResponse({ ...document, created_at: now, updated_at: now } as Partial<LocationDocument>),
      // The interface shows a usage counter, so it needs the new total.
      usage: { locations: used },
      request_id: req.id,
    })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /orgs/{orgId}/locations
 *
 * Every member of the organization can list its locations — security
 * personnel need them to know where they are validating entries.
 */
locationsRouter.get('/', requireAuth, requireOrgMember, async (req, res, next) => {
  const orgId = String(req.params.orgId)

  try {
    const snapshot = await locationsCollection(orgId).orderBy('name').get()
    const locations = snapshot.docs.map((doc) =>
      toLocationResponse({ id: doc.id, ...(doc.data() as Partial<LocationDocument>) }),
    )

    res.json({
      locations,
      usage: {
        locations: req.org?.counts?.locations ?? locations.length,
        max_locations: req.org?.limits?.max_locations ?? null,
      },
      request_id: req.id,
    })
  } catch (error) {
    next(error)
  }
})

/** GET /orgs/{orgId}/locations/{locationId} */
locationsRouter.get('/:locationId', requireAuth, requireOrgMember, async (req, res, next) => {
  const orgId = String(req.params.orgId)
  const locationId = String(req.params.locationId)

  try {
    const snapshot = await locationRef(orgId, locationId).get()
    if (!snapshot.exists) {
      next(notFound('Location not found.'))
      return
    }

    res.json({
      ...toLocationResponse({ id: snapshot.id, ...(snapshot.data() as Partial<LocationDocument>) }),
      request_id: req.id,
    })
  } catch (error) {
    next(error)
  }
})

/**
 * PUT /orgs/{orgId}/locations/{locationId}
 *
 * `enabled: false` takes a location out of use without deleting it, which
 * keeps its entry history intact.
 */
locationsRouter.put('/:locationId', requireAuth, requireOrgAdmin, async (req, res, next) => {
  const parsed = UpdateLocationSchema.safeParse(req.body ?? {})
  if (!parsed.success) {
    next(badRequest(parsed.error))
    return
  }

  const orgId = String(req.params.orgId)
  const locationId = String(req.params.locationId)

  try {
    const ref = locationRef(orgId, locationId)
    const snapshot = await ref.get()
    if (!snapshot.exists) {
      next(notFound('Location not found.'))
      return
    }

    await ref.update({ ...parsed.data, updated_at: FieldValue.serverTimestamp() })

    logger.info(
      { user_id: req.user!.uid, org_id: orgId, location_id: locationId, request_id: req.id },
      'Location updated',
    )

    const now = { toDate: () => new Date() }
    res.json({
      ...toLocationResponse({
        id: locationId,
        ...(snapshot.data() as Partial<LocationDocument>),
        ...parsed.data,
        updated_at: now,
      }),
      request_id: req.id,
    })
  } catch (error) {
    next(error)
  }
})

/**
 * DELETE /orgs/{orgId}/locations/{locationId}
 *
 * A real delete, unlike organizations: a location holds no audit trail of its
 * own, and the plan allows so few of them that a deleted one must give its
 * slot back immediately.
 *
 * Refused while the location still has interiors, or while any authorization
 * still points at it — deleting it then would leave permits aimed at a place
 * that no longer exists.
 */
locationsRouter.delete('/:locationId', requireAuth, requireOrgAdmin, async (req, res, next) => {
  const orgId = String(req.params.orgId)
  const locationId = String(req.params.locationId)

  try {
    const ref = locationRef(orgId, locationId)
    const snapshot = await ref.get()
    if (!snapshot.exists) {
      next(notFound('Location not found.'))
      return
    }

    const interiors = await orgRef(orgId)
      .collection('interiors')
      .where('location_id', '==', locationId)
      .limit(1)
      .get()

    if (!interiors.empty) {
      next(
        conflict('This location still has interiors. Remove them before deleting the location.'),
      )
      return
    }

    if (await hasLivePermit(orgId, { location_id: locationId })) {
      next(
        conflict(
          'This location still has active authorizations. Revoke them before deleting it.',
        ),
      )
      return
    }

    await deleteCounted({ orgId, resource: 'locations', ref })

    logger.info(
      { user_id: req.user!.uid, org_id: orgId, location_id: locationId, request_id: req.id },
      'Location deleted',
    )

    res.json({ id: locationId, deleted: true, request_id: req.id })
  } catch (error) {
    next(error)
  }
})
