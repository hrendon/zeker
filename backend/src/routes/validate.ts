import { Router } from 'express'
import { FieldValue } from 'firebase-admin/firestore'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth.js'
import { requireOrgMember } from '../middleware/orgAccess.js'
import { validateRateLimit } from '../middleware/rateLimit.js'
import { conflict, forbidden, invalidRequest, notFound } from '../lib/errors.js'
import { logger } from '../lib/logger.js'
import { interiorRef } from '../lib/interiors.js'
import type { InteriorDocument } from '../lib/interiors.js'
import { locationRef } from '../lib/locations.js'
import type { LocationDocument } from '../lib/locations.js'
import { normalizeCode, permitsCollection, stateOf } from '../lib/permits.js'
import type { PermitDocument } from '../lib/permits.js'
import { eventsCollection, newEventId, retentionDate } from '../lib/events.js'
import type { AccessEventDocument, DenyReason } from '../lib/events.js'

/**
 * Checking a permit at a door (US-005).
 *
 * Mounted at `/orgs/{orgId}/validate`, so `requireOrgMember` runs first —
 * since Decision 004 that check is the only thing keeping one customer's
 * permits away from another's.
 *
 * **Who may check.** Security staff, and administrators. A guard at a gate is
 * the obvious case; an administrator is allowed because in a small building
 * the person who runs it is often the person at the door, and because someone
 * has to be able to test a gate without a second account. A responsable is
 * refused: a resident checking codes at the entrance is not what the product
 * describes, and letting them do it would let any resident test whether a code
 * they overheard is real.
 *
 * Note what this endpoint does **not** let a guard do. It answers one code at
 * a time, put in front of them, and never lists anything. A guard who could
 * list a building's permits would know who is expected where, all day
 * (`permits.ts`), and this endpoint keeps that true: a wrong code returns a
 * reason, never a permit.
 *
 * **A refusal is a 200, not an error.** "This person may not enter" is a
 * successful answer to the question the guard asked. Reserving 4xx for
 * genuinely broken requests means the guard's screen can trust that anything
 * other than 200 is a fault of ours, not a visitor being turned away.
 */

export const validateRouter: Router = Router({ mergeParams: true })

/**
 * `code` is capped well above the eight characters a real one has: a guard may
 * paste something with spaces and dashes, and the cap only exists so nothing
 * absurd is stored on a failed check.
 */
const CheckSchema = z
  .object({
    location_id: z.string().trim().min(1),
    code: z.string().trim().min(1).max(64),
  })
  .strict()

/** What the guard is told about the visitor. Never the code itself. */
interface PermitSummary {
  id: string
  visitor_name: string
  interior_id: string
  interior_number: string
  purpose: string
  valid_from: string
  valid_to: string
}

/**
 * POST /orgs/{orgId}/validate
 *
 * The order the reasons are evaluated matters, and is not arbitrary:
 *
 *   no such code → revoked → not started → finished → wrong entrance
 *
 * The permit's own state is settled before the entrance is considered, so a
 * revoked permit can never produce "try the other gate" — which would send a
 * guard to redirect somebody who must not be let in anywhere.
 */
validateRouter.post(
  '/',
  requireAuth,
  requireOrgMember,
  validateRateLimit,
  async (req, res, next) => {
    const parsed = CheckSchema.safeParse(req.body ?? {})
    if (!parsed.success) {
      next(
        invalidRequest(
          'The request body is not valid.',
          parsed.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        ),
      )
      return
    }

    const orgId = String(req.params.orgId)
    const uid = req.user!.uid
    const role = req.orgMembership?.role
    const now = new Date()

    if (role !== 'security' && role !== 'admin') {
      next(forbidden('Only security staff, or an administrator, can check a permit.'))
      return
    }

    try {
      // The entrance must be real and in use before anything is recorded: an
      // event has to say where it happened, and a retired entrance is one an
      // administrator has deliberately taken out of service.
      const locationSnapshot = await locationRef(orgId, parsed.data.location_id).get()
      if (!locationSnapshot.exists) {
        next(notFound('Location not found.'))
        return
      }
      const location = locationSnapshot.data() as Partial<LocationDocument>
      if (location.enabled === false) {
        next(conflict('That entrance is out of use.'))
        return
      }

      const code = normalizeCode(parsed.data.code)

      // Stored codes are already in normalized form — the alphabet leaves out
      // the four characters `normalizeCode` folds away — so this is a plain
      // equality match, not a scan.
      const found =
        code.length === 0
          ? undefined
          : (
              await permitsCollection(orgId).where('code', '==', code).limit(1).get()
            ).docs[0]

      const permit = found
        ? ({ id: found.id, ...(found.data() as Partial<PermitDocument>) } as PermitDocument)
        : undefined

      let reason: DenyReason | null = null
      if (!permit) {
        reason = 'invalid_code'
      } else {
        const state = stateOf(permit, now)
        if (state === 'revoked') reason = 'revoked'
        else if (state === 'scheduled') reason = 'not_started'
        else if (state === 'expired') reason = 'expired'
        else if (permit.location_id !== parsed.data.location_id) reason = 'wrong_location'
      }

      const result = reason === null ? 'allowed' : 'denied'

      const eventId = newEventId(orgId)
      await eventsCollection(orgId)
        .doc(eventId)
        .set({
          id: eventId,
          org_id: orgId,
          location_id: parsed.data.location_id,
          permit_id: permit?.id ?? null,
          interior_id: permit ? String(permit.interior_id) : null,
          action: 'entry',
          result,
          deny_reason: reason,
          // Only when nothing matched. A live code is not copied into a second
          // collection — see the note in lib/events.ts.
          scanned_code: permit ? null : parsed.data.code.slice(0, 64),
          checked_by: uid,
          request_id: req.id,
          created_at: FieldValue.serverTimestamp(),
          expires_at: retentionDate(now, result),
        } satisfies Record<keyof AccessEventDocument, unknown>)

      // Audit trail. The code is never logged, for the same reason it is never
      // logged when a permit is created: logs are read by more people than
      // permits are.
      logger.info(
        {
          audit: 'permit.checked',
          user_id: uid,
          org_id: orgId,
          location_id: parsed.data.location_id,
          permit_id: permit?.id ?? null,
          event_id: eventId,
          result,
          deny_reason: reason,
          request_id: req.id,
        },
        'Permit checked',
      )

      // Everything below is presentation, and only runs once the record is
      // safely written: an event must not be lost because a name lookup failed.
      const summary = permit ? await summarize(orgId, permit) : undefined

      if (reason === null) {
        res.json({ result: 'allowed', permit: summary, event_id: eventId, request_id: req.id })
        return
      }

      res.json({
        result: 'denied',
        reason,
        // A guard turning someone away can say who and which apartment, which
        // is the difference between a useful refusal and a shrug. Nothing here
        // is shown for a code that matched nothing, because nothing is known.
        permit: summary,
        // Only for a wrong entrance, and only the entrance's name: it lets the
        // guard send the visitor to the right gate instead of away.
        expected_location:
          reason === 'wrong_location' && permit
            ? await locationName(orgId, String(permit.location_id))
            : undefined,
        event_id: eventId,
        request_id: req.id,
      })
    } catch (error) {
      next(error)
    }
  },
)

/** The apartment number and visitor details the guard's screen shows. */
async function summarize(orgId: string, permit: PermitDocument): Promise<PermitSummary> {
  const snapshot = await interiorRef(orgId, String(permit.interior_id)).get()
  const interior = snapshot.exists ? (snapshot.data() as Partial<InteriorDocument>) : undefined

  return {
    id: String(permit.id ?? ''),
    visitor_name: String(permit.visitor_name ?? ''),
    interior_id: String(permit.interior_id ?? ''),
    interior_number: String(interior?.number ?? ''),
    purpose: String(permit.purpose ?? 'visitor'),
    valid_from: String(permit.valid_from ?? ''),
    valid_to: String(permit.valid_to ?? ''),
  }
}

/** Empty when the entrance is gone, which a refusal message handles on its own. */
async function locationName(orgId: string, locationId: string): Promise<string> {
  if (!locationId) return ''
  const snapshot = await locationRef(orgId, locationId).get()
  if (!snapshot.exists) return ''
  return String((snapshot.data() as Partial<LocationDocument>).name ?? '')
}
