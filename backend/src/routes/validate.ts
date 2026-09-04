import { Router } from 'express'
import { FieldValue } from 'firebase-admin/firestore'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth.js'
import { requireOrgMember } from '../middleware/orgAccess.js'
import { validateRateLimit } from '../middleware/rateLimit.js'
import {
  conflict,
  forbidden,
  invalidRequest,
  noteAlreadyRecorded,
  noteTooLate,
  notFound,
} from '../lib/errors.js'
import { logger } from '../lib/logger.js'
import { interiorRef } from '../lib/interiors.js'
import type { InteriorDocument } from '../lib/interiors.js'
import { locationRef } from '../lib/locations.js'
import type { LocationDocument } from '../lib/locations.js'
import { db } from '../lib/firebase.js'
import {
  allowsEntryAt,
  entryCountOf,
  normalizeCode,
  permitRef,
  permitsCollection,
  scheduleOf,
  stateOf,
} from '../lib/permits.js'
import type { PermitDocument, PermitSchedule } from '../lib/permits.js'
import { orgRef, timezoneOf } from '../lib/orgs.js'
import type { OrgDocument } from '../lib/orgs.js'
import {
  CHECK_NOTES,
  NOTE_WINDOW_MINUTES,
  eventsCollection,
  newEventId,
  noteRetentionDate,
  retentionDate,
} from '../lib/events.js'
import type { AccessEventDocument, CheckNote, DenyReason } from '../lib/events.js'

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
  /**
   * Decision 016. Null unless the permit was issued with days and hours. The
   * guard needs it to say *when* the visitor may come back, which is the whole
   * difference between a useful refusal and a closed door.
   */
  schedule: PermitSchedule | null
}

/**
 * POST /orgs/{orgId}/validate
 *
 * The order the reasons are evaluated matters, and is not arbitrary:
 *
 *   no such code → revoked → already used → not started → finished →
 *   outside its days and hours → wrong entrance
 *
 * The permit's own state is settled before the entrance is considered, so a
 * revoked permit can never produce "try the other gate" — which would send a
 * guard to redirect somebody who must not be let in anywhere. The schedule
 * (Decision 016) belongs to the permit and so is checked on the same side of
 * that line: a visitor arriving on the wrong day must not be sent to a
 * different entrance, where the answer would be exactly as negative.
 *
 * **The answer and the count are written in one transaction** (Decision 014).
 * A one-entry permit is spent by being used, so deciding first and counting
 * afterwards would let two guards scanning the same code at the same instant
 * both be told yes. The permit is re-read inside the transaction for the same
 * reason: the copy found by the code lookup may already be out of date.
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

      const eventId = newEventId(orgId)

      const { permit, reason, result } = await db().runTransaction(async (tx) => {
        // Re-read inside the transaction. The lookup above found the document
        // by its code; between that read and this write somebody else's check
        // may already have spent it.
        const fresh = found ? await tx.get(found.ref) : undefined

        const permit =
          fresh && fresh.exists
            ? ({ id: fresh.id, ...(fresh.data() as Partial<PermitDocument>) } as PermitDocument)
            : undefined

        let reason: DenyReason | null = null
        if (!permit) {
          reason = 'invalid_code'
        } else {
          const state = stateOf(permit, now)
          if (state === 'revoked') reason = 'revoked'
          else if (state === 'used') reason = 'already_used'
          else if (state === 'scheduled') reason = 'not_started'
          else if (state === 'expired') reason = 'expired'
          else if (!(await withinSchedule(tx, orgId, permit, now))) reason = 'outside_schedule'
          else if (permit.location_id !== parsed.data.location_id) reason = 'wrong_location'
        }

        const result: 'allowed' | 'denied' = reason === null ? 'allowed' : 'denied'

        // The permit remembers the entry itself (Decision 014). Asking the
        // history instead would need an index, cost a query per permit in a
        // list, and lose the answer when the history is deleted at 90 days.
        if (result === 'allowed' && found) {
          tx.update(found.ref, {
            entry_count: FieldValue.increment(1),
            last_entry_at: FieldValue.serverTimestamp(),
            ...(entryCountOf(permit) === 0
              ? { first_entry_at: FieldValue.serverTimestamp() }
              : {}),
          })
        }

        tx.set(eventsCollection(orgId).doc(eventId), {
          id: eventId,
          org_id: orgId,
          location_id: parsed.data.location_id,
          permit_id: permit?.id ?? null,
          interior_id: permit ? String(permit.interior_id) : null,
          action: 'entry',
          result,
          deny_reason: reason,
          // A check is not a note about anything — see the note endpoint below.
          note: null,
          about_event_id: null,
          entry_returned: null,
          // Only when nothing matched. A live code is not copied into a second
          // collection — see the note in lib/events.ts.
          scanned_code: permit ? null : parsed.data.code.slice(0, 64),
          checked_by: uid,
          request_id: req.id,
          created_at: FieldValue.serverTimestamp(),
          expires_at: retentionDate(now, result),
        } satisfies Record<keyof AccessEventDocument, unknown>)

        return { permit, reason, result }
      })

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

const NoteSchema = z
  .object({
    note: z.enum(CHECK_NOTES),
  })
  .strict()

/**
 * POST /orgs/{orgId}/validate/{eventId}/nota — what happened, after the check
 * (Decision 015).
 *
 * Decision 014 left a hole on purpose: a one-entry permit scanned by mistake
 * stays spent, and the person at the gate cannot come back. This is what
 * closes it.
 *
 * **A note is a new record, never an edit.** `events.ts` says nothing in this
 * codebase updates an event once written, and that is not a detail — a log
 * that can be edited is not evidence. So the note is its own document pointing
 * at the check, and both survive.
 *
 * **Only `no_entry` changes anything**, and only when there is something to
 * give back: the check let somebody in, it happened within
 * `NOTE_WINDOW_MINUTES`, and nobody has already noted this check. The other
 * three reasons are recorded and change nothing, which is the point — they are
 * what an administrator reads later, not instructions to the system.
 *
 * **What this deliberately cannot do**, and the Founder accepted it in those
 * words: it does not stop a dishonest guard from letting somebody in and then
 * marking "no entró". Nothing at this layer can. What it does is leave it
 * written — who, when, and against which permit.
 */
validateRouter.post(
  '/:eventId/nota',
  requireAuth,
  requireOrgMember,
  validateRateLimit,
  async (req, res, next) => {
    const parsed = NoteSchema.safeParse(req.body ?? {})
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
    const eventId = String(req.params.eventId)
    const uid = req.user!.uid
    const role = req.orgMembership?.role
    const note: CheckNote = parsed.data.note
    const now = new Date()

    // The same people who may check may say what happened. A responsable is
    // refused here for the same reason they are refused a check.
    if (role !== 'security' && role !== 'admin') {
      next(forbidden('Only security staff, or an administrator, can record what happened.'))
      return
    }

    try {
      const noteId = newEventId(orgId)

      const { entryReturned } = await db().runTransaction(async (tx) => {
        const checkSnapshot = await tx.get(eventsCollection(orgId).doc(eventId))
        if (!checkSnapshot.exists) throw notFound('Check not found.')

        const check = checkSnapshot.data() as Partial<AccessEventDocument>

        // A note is about a check, never about another note.
        if (check.action !== 'entry') throw notFound('Check not found.')

        const checkedAt = toDate(check.created_at)
        const ageMinutes = checkedAt ? (now.getTime() - checkedAt.getTime()) / 60000 : Infinity
        if (ageMinutes > NOTE_WINDOW_MINUTES) {
          throw noteTooLate('That check is too old to record anything against.')
        }

        // One note per check. Without this, "no entró" pressed twice takes the
        // count below what actually happened.
        const existing = await tx.get(
          eventsCollection(orgId).where('about_event_id', '==', eventId).limit(1),
        )
        if (!existing.empty) {
          throw noteAlreadyRecorded('Somebody already recorded what happened at this check.')
        }

        // Only an entry that actually happened can be given back. A refusal let
        // nobody in, so there is nothing to return — the note is still written.
        let entryReturned = false
        if (note === 'no_entry' && check.result === 'allowed' && check.permit_id) {
          const ref = permitRef(orgId, String(check.permit_id))
          const permitSnapshot = await tx.get(ref)
          if (permitSnapshot.exists) {
            const permit = permitSnapshot.data() as Partial<PermitDocument>
            const count = entryCountOf(permit)
            if (count > 0) {
              tx.update(ref, {
                entry_count: count - 1,
                // Kept on the permit so an administrator can tell "nobody ever
                // used this" from "the visitor never arrived" — Decision 015's
                // fourth consequence. The event log holds the detail; this is
                // what the screens can read today, before the entry history
                // exists.
                entry_returns: FieldValue.increment(1),
                // A permit back at zero entries has no last entry to show.
                // Left as null rather than removed: the field is read as
                // "when was somebody last let in", and null is the true
                // answer, where a stale timestamp is a lie.
                ...(count - 1 === 0 ? { last_entry_at: null, first_entry_at: null } : {}),
              })
              entryReturned = true
            }
          }
        }

        tx.set(eventsCollection(orgId).doc(noteId), {
          id: noteId,
          org_id: orgId,
          location_id: String(check.location_id ?? ''),
          permit_id: check.permit_id ?? null,
          interior_id: check.interior_id ?? null,
          action: 'note',
          // A note is not an entry and not a refusal. It carries the result of
          // the check it is about, so the history can be read without joining.
          result: check.result === 'allowed' ? 'allowed' : 'denied',
          deny_reason: null,
          note,
          about_event_id: eventId,
          entry_returned: entryReturned,
          // The code is never copied. Whatever was scanned is already on the
          // check this note points at.
          scanned_code: null,
          checked_by: uid,
          request_id: req.id,
          created_at: FieldValue.serverTimestamp(),
          expires_at: noteRetentionDate(
            check.expires_at,
            retentionDate(now, check.result === 'allowed' ? 'allowed' : 'denied'),
          ),
        } satisfies Record<keyof AccessEventDocument, unknown>)

        return { entryReturned }
      })

      logger.info(
        {
          audit: 'check.noted',
          user_id: uid,
          org_id: orgId,
          about_event_id: eventId,
          event_id: noteId,
          note,
          entry_returned: entryReturned,
          request_id: req.id,
        },
        'Check noted',
      )

      res.status(201).json({
        event_id: noteId,
        note,
        entry_returned: entryReturned,
        request_id: req.id,
      })
    } catch (error) {
      next(error)
    }
  },
)

/** Firestore hands timestamps back as objects with toDate(); the test double stores Dates. */
function toDate(value: unknown): Date | undefined {
  if (value instanceof Date) return value
  const maybe = value as { toDate?: () => Date } | null | undefined
  if (maybe && typeof maybe.toDate === 'function') return maybe.toDate()
  return undefined
}

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
    schedule: scheduleOf(permit),
  }
}

/**
 * Whether the permit's days and hours allow an entry right now (Decision 016).
 *
 * The organization is read **only when the permit carries a schedule**. Most
 * permits do not, and the gate is the one path in this product where a person
 * is standing at a door waiting for the answer — so the building's timezone is
 * not fetched to be ignored.
 *
 * The read happens inside the transaction because everything in a Firestore
 * transaction must, and it is a read of a document that never changes during
 * one. An organization whose timezone is missing or unreadable is treated as
 * Colombia (`timezoneOf`), which is what every organization created before
 * Decision 016 actually was.
 */
async function withinSchedule(
  tx: FirebaseFirestore.Transaction,
  orgId: string,
  permit: PermitDocument,
  at: Date,
): Promise<boolean> {
  if (!scheduleOf(permit)) return true

  const org = await tx.get(orgRef(orgId))
  const timeZone = timezoneOf(org.exists ? (org.data() as Partial<OrgDocument>) : undefined)

  return allowsEntryAt(permit, at, timeZone)
}

/** Empty when the entrance is gone, which a refusal message handles on its own. */
async function locationName(orgId: string, locationId: string): Promise<string> {
  if (!locationId) return ''
  const snapshot = await locationRef(orgId, locationId).get()
  if (!snapshot.exists) return ''
  return String((snapshot.data() as Partial<LocationDocument>).name ?? '')
}
