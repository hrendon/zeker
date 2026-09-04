import { Router } from 'express'
import { FieldValue } from 'firebase-admin/firestore'
import type { Transaction } from 'firebase-admin/firestore'
import { z } from 'zod'
import { db } from '../lib/firebase.js'
import { requireAuth } from '../middleware/auth.js'
import { requireOrgMember } from '../middleware/orgAccess.js'
import { conflict, forbidden, invalidRequest, notFound } from '../lib/errors.js'
import { logger } from '../lib/logger.js'
import { interiorRef, interiorsCollection } from '../lib/interiors.js'
import type { InteriorDocument } from '../lib/interiors.js'
import {
  MAX_PERMIT_DAYS,
  PERMIT_ENTRY_MODES,
  PERMIT_PURPOSES,
  newCode,
  newPermitId,
  permitRef,
  permitsCollection,
  readSchedule,
  stateOf,
  toPermitResponse,
} from '../lib/permits.js'
import type { PermitDocument, PermitState } from '../lib/permits.js'

/**
 * Entry permits (US-003, US-006).
 *
 * Mounted at `/orgs/{orgId}/authorizations`, so every route runs
 * `requireOrgMember` first — since Decision 004 that check is the only thing
 * keeping one customer's permits away from another's.
 *
 * Who may do what, on top of that membership check:
 *
 * | Role         | Issue                     | See                       | Revoke                    |
 * |--------------|---------------------------|---------------------------|---------------------------|
 * | admin        | any interior              | all                       | any                       |
 * | responsable  | interiors they are in charge of                                               |
 * | security     | no                        | no                        | no                        |
 *
 * A resident issues permits for their own apartment and sees nobody else's —
 * that is the whole point of an interior having a designated person
 * (Decision 006). Security staff are deliberately excluded: at a gate they
 * check a code that is put in front of them, and a guard who can list every
 * permit in a building can see who is expected where, all day.
 */

export const permitsRouter: Router = Router({ mergeParams: true })

const CreatePermitSchema = z
  .object({
    interior_id: z.string().trim().min(1),
    visitor_name: z.string().trim().min(1).max(120),
    purpose: z.enum(PERMIT_PURPOSES).optional(),
    /**
     * Decision 014. Absent means `single`: a permit is for a visit unless the
     * person issuing it says otherwise. The screen asks the question outright,
     * so this default only covers a caller that does not.
     */
    entry_mode: z.enum(PERMIT_ENTRY_MODES).optional(),
    /** ISO 8601. Checked for range and order by `readWindow` below. */
    valid_from: z.string().trim().min(1),
    valid_to: z.string().trim().min(1),
    /**
     * Decision 016. Optional, and absent means the permit may be used at any
     * hour of any day. Shape and rules are checked by `readSchedule`, which
     * owns them because the gate reads the same structure back.
     */
    schedule: z.unknown().optional(),
  })
  .strict()

const STATES: readonly PermitState[] = ['scheduled', 'active', 'expired', 'revoked', 'used']

function badRequest(error: z.ZodError): ReturnType<typeof invalidRequest> {
  return invalidRequest(
    'The request body is not valid.',
    error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message })),
  )
}

/**
 * Turns the two dates into a checked window, in UTC.
 *
 * `valid_from` may be in the past — a permit written as "from this morning" is
 * ordinary. `valid_to` may not be: a permit that is already over cannot admit
 * anyone, so accepting one only creates a record nobody can use and a support
 * question about why the code does not work.
 *
 * The length is capped so a mistyped year cannot produce a permit that admits
 * a visitor until 2125. A visit is not a tenancy.
 */
function readWindow(input: { valid_from: string; valid_to: string }, now: Date) {
  const from = new Date(input.valid_from)
  const to = new Date(input.valid_to)

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    throw invalidRequest('The dates must be ISO 8601 date-times, for example 2026-08-30T14:00:00Z.')
  }
  if (from.getTime() >= to.getTime()) {
    throw invalidRequest('The permit must end after it starts.')
  }
  if (to.getTime() <= now.getTime()) {
    throw invalidRequest('The permit must end in the future.')
  }
  if (to.getTime() - from.getTime() > MAX_PERMIT_DAYS * 24 * 60 * 60 * 1000) {
    throw invalidRequest(`A permit cannot last longer than ${MAX_PERMIT_DAYS} days.`)
  }

  return { valid_from: from.toISOString(), valid_to: to.toISOString() }
}

/**
 * The interior this caller may act on, or a refusal.
 *
 * An administrator may act on any interior in the organization; a responsable
 * only on the ones they are in charge of. Everyone else is refused — 403 and
 * not 404, because a member already knows the organization exists.
 */
async function interiorForCaller(
  uid: string,
  role: string | undefined,
  orgId: string,
  interiorId: string,
): Promise<InteriorDocument> {
  const snapshot = await interiorRef(orgId, interiorId).get()
  if (!snapshot.exists) throw notFound('Interior not found.')

  const interior = { id: snapshot.id, ...(snapshot.data() as Partial<InteriorDocument>) }

  if (role === 'admin') return interior as InteriorDocument
  if (role === 'responsable' && interior.responsable_user_id === uid) {
    return interior as InteriorDocument
  }

  throw forbidden('Only an administrator, or the person in charge of this interior, can do this.')
}

/** The interiors a responsable is in charge of. Empty is a normal answer. */
async function interiorsOf(uid: string, orgId: string): Promise<string[]> {
  const snapshot = await interiorsCollection(orgId)
    .where('responsable_user_id', '==', uid)
    .get()
  return snapshot.docs.map((doc) => doc.id)
}

/** Interior numbers for a whole list, in one read rather than one per row. */
async function interiorNumbers(orgId: string): Promise<Map<string, string>> {
  const snapshot = await interiorsCollection(orgId).get()
  const numbers = new Map<string, string>()
  for (const doc of snapshot.docs) {
    numbers.set(doc.id, String((doc.data() as Partial<InteriorDocument>).number ?? ''))
  }
  return numbers
}

/**
 * POST /orgs/{orgId}/authorizations
 *
 * Issues a permit. The code is generated here and checked for uniqueness
 * inside the same transaction that writes the permit: two permits sharing a
 * code would mean one visitor's code opening another visitor's permit, and a
 * check made before the write could be overtaken by a second request.
 */
permitsRouter.post('/', requireAuth, requireOrgMember, async (req, res, next) => {
  const parsed = CreatePermitSchema.safeParse(req.body ?? {})
  if (!parsed.success) {
    next(badRequest(parsed.error))
    return
  }

  const orgId = String(req.params.orgId)
  const uid = req.user!.uid
  const now = new Date()

  try {
    const window = readWindow(parsed.data, now)

    const schedule = readSchedule(parsed.data.schedule)
    if ('error' in schedule) {
      next(invalidRequest(schedule.error, [{ field: 'schedule', message: schedule.error }]))
      return
    }

    const interior = await interiorForCaller(
      uid,
      req.orgMembership?.role,
      orgId,
      parsed.data.interior_id,
    )

    const permitId = newPermitId(orgId)
    const ref = permitRef(orgId, permitId)

    const code = await db().runTransaction(async (tx: Transaction) => {
      // Every read must happen before the first write in a Firestore transaction.
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const candidate = newCode()
        const taken = await tx.get(
          permitsCollection(orgId).where('code', '==', candidate).limit(1),
        )
        if (taken.empty) {
          tx.set(ref, {
            id: permitId,
            org_id: orgId,
            interior_id: interior.id,
            location_id: interior.location_id,
            visitor_name: parsed.data.visitor_name,
            purpose: parsed.data.purpose ?? 'visitor',
            valid_from: window.valid_from,
            valid_to: window.valid_to,
            code: candidate,
            status: 'active',
            entry_mode: parsed.data.entry_mode ?? 'single',
            // Written as `null` rather than left out, so every permit issued
            // from today has the field and a reader never has to guess whether
            // its absence means "no schedule" or "issued before Decision 016".
            schedule: schedule.schedule,
            entry_count: 0,
            entry_returns: 0,
            first_entry_at: null,
            last_entry_at: null,
            created_by: uid,
            created_at: FieldValue.serverTimestamp(),
            revoked_at: null,
            revoked_by: null,
          } satisfies Record<keyof PermitDocument, unknown>)
          return candidate
        }
      }
      // Five collisions in a space of 10¹² means something is wrong with the
      // random source, not with luck. Refusing is safer than reusing a code.
      throw conflict('Could not generate a unique code. Please try again.')
    })

    // Audit trail — Security Engineer position, Decision 001. The code itself
    // is never logged: logs are read by more people than permits are.
    logger.info(
      {
        audit: 'permit.created',
        user_id: uid,
        org_id: orgId,
        interior_id: interior.id,
        permit_id: permitId,
        request_id: req.id,
      },
      'Permit created',
    )

    res.status(201).json({
      ...toPermitResponse(
        {
          id: permitId,
          org_id: orgId,
          interior_id: interior.id,
          location_id: interior.location_id,
          visitor_name: parsed.data.visitor_name,
          purpose: parsed.data.purpose ?? 'visitor',
          valid_from: window.valid_from,
          valid_to: window.valid_to,
          code,
          status: 'active',
          entry_mode: parsed.data.entry_mode ?? 'single',
          schedule: schedule.schedule ?? undefined,
          entry_count: 0,
          created_by: uid,
          created_at: { toDate: () => now },
        },
        interior.number,
        now,
      ),
      request_id: req.id,
    })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /orgs/{orgId}/authorizations
 *
 * An administrator sees the organization's permits; a responsable sees only
 * the permits of the interiors they are in charge of. Optional `?interior_id=`
 * narrows it further, and `?state=` filters by what a permit is right now.
 */
permitsRouter.get('/', requireAuth, requireOrgMember, async (req, res, next) => {
  const orgId = String(req.params.orgId)
  const uid = req.user!.uid
  const role = req.orgMembership?.role
  const now = new Date()

  const interiorId = typeof req.query.interior_id === 'string' ? req.query.interior_id : undefined
  const state = typeof req.query.state === 'string' ? req.query.state : undefined

  if (state !== undefined && !STATES.includes(state as PermitState)) {
    next(invalidRequest(`"state" must be one of: ${STATES.join(', ')}.`))
    return
  }

  try {
    if (role !== 'admin' && role !== 'responsable') {
      next(forbidden('Only an administrator, or a person in charge of an interior, can do this.'))
      return
    }

    // A responsable is limited to their own interiors. Asking for one that is
    // not theirs is refused here rather than quietly returning nothing, so the
    // screen can say why.
    let allowed: string[] | undefined
    if (role === 'responsable') {
      allowed = await interiorsOf(uid, orgId)
      if (interiorId && !allowed.includes(interiorId)) {
        next(forbidden('You are not in charge of that interior.'))
        return
      }
    }

    const base = permitsCollection(orgId)
    const snapshot = await (interiorId ? base.where('interior_id', '==', interiorId) : base).get()

    const numbers = await interiorNumbers(orgId)

    const permits = snapshot.docs
      .map((doc) => ({ id: doc.id, ...(doc.data() as Partial<PermitDocument>) }))
      .filter((permit) => allowed === undefined || allowed.includes(String(permit.interior_id)))
      .map((permit) =>
        toPermitResponse(permit, numbers.get(String(permit.interior_id)) ?? '', now),
      )
      .filter((permit) => state === undefined || permit.state === state)
      // What is usable now comes first; within a group, the most recent first.
      // A resident opening this screen is almost always asking "is the one I
      // just made still good?", not "what happened last March?".
      .sort((a, b) => {
        const rank: Record<PermitState, number> = {
          active: 0,
          scheduled: 1,
          // A spent permit is finished business, like an expired one, but it
          // is the more interesting of the two: somebody actually came in.
          used: 2,
          expired: 3,
          revoked: 4,
        }
        if (rank[a.state] !== rank[b.state]) return rank[a.state] - rank[b.state]
        return b.valid_from.localeCompare(a.valid_from)
      })

    res.json({ authorizations: permits, request_id: req.id })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /orgs/{orgId}/authorizations/{permitId}
 *
 * The screen that shows the QR. Same rule as the list: an administrator, or
 * the person in charge of the interior the permit points at.
 */
permitsRouter.get('/:permitId', requireAuth, requireOrgMember, async (req, res, next) => {
  const orgId = String(req.params.orgId)
  const permitId = String(req.params.permitId)

  try {
    const snapshot = await permitRef(orgId, permitId).get()
    if (!snapshot.exists) {
      next(notFound('Permit not found.'))
      return
    }

    const permit = { id: snapshot.id, ...(snapshot.data() as Partial<PermitDocument>) }
    const interior = await interiorForCaller(
      req.user!.uid,
      req.orgMembership?.role,
      orgId,
      String(permit.interior_id),
    )

    res.json({
      ...toPermitResponse(permit, interior.number),
      request_id: req.id,
    })
  } catch (error) {
    next(error)
  }
})

/**
 * DELETE /orgs/{orgId}/authorizations/{permitId}
 *
 * Revokes a permit. The record is kept and marked, never removed: a permit
 * that once opened a door is part of the audit trail, and deleting it would
 * erase the only evidence that it existed.
 *
 * Revoking an already-revoked permit succeeds without changing anything —
 * pressing the button twice is not an error, and refusing would only make a
 * confirmation-dialog retry look like a fault.
 */
permitsRouter.delete('/:permitId', requireAuth, requireOrgMember, async (req, res, next) => {
  const orgId = String(req.params.orgId)
  const permitId = String(req.params.permitId)
  const now = new Date()

  try {
    const ref = permitRef(orgId, permitId)
    const snapshot = await ref.get()
    if (!snapshot.exists) {
      next(notFound('Permit not found.'))
      return
    }

    const permit = { id: snapshot.id, ...(snapshot.data() as Partial<PermitDocument>) }
    await interiorForCaller(
      req.user!.uid,
      req.orgMembership?.role,
      orgId,
      String(permit.interior_id),
    )

    if (permit.status !== 'revoked') {
      await ref.update({
        status: 'revoked',
        revoked_at: FieldValue.serverTimestamp(),
        revoked_by: req.user!.uid,
      })

      logger.info(
        {
          audit: 'permit.revoked',
          user_id: req.user!.uid,
          org_id: orgId,
          interior_id: permit.interior_id,
          permit_id: permitId,
          request_id: req.id,
        },
        'Permit revoked',
      )
    }

    res.json({
      id: permitId,
      state: stateOf({ ...permit, status: 'revoked' } as PermitDocument, now),
      revoked: true,
      request_id: req.id,
    })
  } catch (error) {
    next(error)
  }
})
