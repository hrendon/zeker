import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth.js'
import { requireOrgMember } from '../middleware/orgAccess.js'
import { forbidden, invalidRequest } from '../lib/errors.js'
import { interiorsCollection } from '../lib/interiors.js'
import type { InteriorDocument } from '../lib/interiors.js'
import { locationsCollection } from '../lib/locations.js'
import type { LocationDocument } from '../lib/locations.js'
import { permitsCollection } from '../lib/permits.js'
import type { PermitDocument } from '../lib/permits.js'
import { eventsCollection } from '../lib/events.js'
import type { AccessEventDocument, CheckNote, DenyReason } from '../lib/events.js'

/**
 * The entry history (US-007).
 *
 * What actually happened at the doors, newest first. Mounted at
 * `/orgs/{orgId}/events`, so `requireOrgMember` runs first.
 *
 * **Who may read it, and this is the whole design:**
 *
 * | Role         | Sees                                                    |
 * |--------------|---------------------------------------------------------|
 * | admin        | every check in the organization                          |
 * | responsable  | only checks against the interiors they are in charge of  |
 * | security     | nothing at all                                           |
 *
 * A guard is refused deliberately. Decision 007 kept a guard from listing
 * permits, because somebody who can list them knows who is expected where all
 * day; a readable history of who came in, at what time, to which apartment is
 * the same knowledge after the fact, and rotating contracted staff have no
 * business holding it.
 *
 * **A responsable's isolation is enforced in the query, not after it.** The
 * events of another apartment are never fetched, so there is no filtering step
 * that can be forgotten, reordered, or made conditional by a later change.
 *
 * **Every query here needs a composite index that must be deployed**, not only
 * declared — three separate features in this project have silently shipped
 * without one (R-16). They are in `firestore.indexes.json`, and the developer
 * guide says how to confirm they are live.
 */

export const eventsRouter: Router = Router({ mergeParams: true })

/**
 * The most a responsable's `in` query can hold — the real Firestore cap.
 *
 * Far above any current plan's interior limit, and checked rather than assumed:
 * exceeding it in production would throw at the database, which on a history
 * screen looks like "our system is broken" rather than "you have a lot of
 * apartments".
 */
const MAX_INTERIORS_PER_QUERY = 30

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 200

const QuerySchema = z
  .object({
    /** ISO 8601. Inclusive. */
    from: z.string().datetime().optional(),
    /** ISO 8601. Exclusive, so a whole day is `from` 00:00 to `to` next 00:00. */
    to: z.string().datetime().optional(),
    result: z.enum(['allowed', 'denied']).optional(),
    limit: z.coerce.number().int().min(1).max(MAX_LIMIT).optional(),
    /** The `id` of the last event on the previous page. */
    cursor: z.string().min(1).max(200).optional(),
  })
  .strict()

/** One line of the history, as a screen reads it. */
interface EventResponse {
  id: string
  /** `entry` is a check at a door; `note` is what a guard said afterwards. */
  action: 'entry' | 'note'
  result: 'allowed' | 'denied'
  deny_reason: DenyReason | null
  /** Decision 015. Only on a note. */
  note: CheckNote | null
  /** Decision 015. The check a note is about, so a screen can pair them. */
  about_event_id: string | null
  entry_returned: boolean | null
  /** Resolved from the permit, which is where the name lives. Empty if it is gone. */
  visitor_name: string
  permit_id: string | null
  interior_id: string | null
  /** Resolved from the interior. Empty if the interior was deleted. */
  interior_number: string
  location_id: string
  /** Resolved from the location. Empty if the entrance was deleted. */
  location_name: string
  created_at: string | null
}

/**
 * GET /orgs/{orgId}/events
 *
 * `?from=` and `?to=` bound the range, `?result=` narrows to allowed or denied,
 * `?limit=` and `?cursor=` page through it. Newest first, always: somebody
 * opening this screen is asking what just happened, not what happened first.
 *
 * **`cursor` is the id of the last event of the previous page**, not a
 * timestamp. Two events written in the same millisecond would make a timestamp
 * cursor skip one, and a history that quietly drops a row is worse than one
 * that is slow.
 */
eventsRouter.get('/', requireAuth, requireOrgMember, async (req, res, next) => {
  const parsed = QuerySchema.safeParse(req.query ?? {})
  if (!parsed.success) {
    next(
      invalidRequest(
        'The query is not valid.',
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
  const { from, to, result, cursor } = parsed.data
  const limit = parsed.data.limit ?? DEFAULT_LIMIT

  if (from && to && from >= to) {
    next(invalidRequest('"from" must be before "to".'))
    return
  }

  try {
    if (role !== 'admin' && role !== 'responsable') {
      next(
        forbidden('Only an administrator, or a person in charge of an interior, can read this.'),
      )
      return
    }

    // A responsable's scope is decided before anything is read, and becomes
    // part of the query itself.
    let interiors: string[] | undefined
    if (role === 'responsable') {
      interiors = await interiorsOf(uid, orgId)
      if (interiors.length === 0) {
        // Not an error: somebody may be a member with nothing assigned yet.
        res.json({ events: [], next_cursor: null, request_id: req.id })
        return
      }
      if (interiors.length > MAX_INTERIORS_PER_QUERY) {
        next(
          invalidRequest(
            `A person in charge of more than ${MAX_INTERIORS_PER_QUERY} interiors cannot read the history in one request yet.`,
          ),
        )
        return
      }
    }

    let query = eventsCollection(orgId) as FirebaseFirestore.Query
    if (interiors) query = query.where('interior_id', 'in', interiors)
    if (result) query = query.where('result', '==', result)
    if (from) query = query.where('created_at', '>=', new Date(from))
    if (to) query = query.where('created_at', '<', new Date(to))
    query = query.orderBy('created_at', 'desc')

    if (cursor) {
      const at = await eventsCollection(orgId).doc(cursor).get()
      // A cursor pointing at nothing is a stale screen, not a broken request:
      // the event it named may have passed its retention date between pages.
      if (at.exists) query = query.startAfter(at)
    }

    // One more than asked for, so "is there another page" costs nothing.
    const snapshot = await query.limit(limit + 1).get()
    const rows = snapshot.docs.slice(0, limit)
    const nextCursor = snapshot.docs.length > limit ? (rows[rows.length - 1]?.id ?? null) : null

    const stored = rows.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Partial<AccessEventDocument>),
    }))

    // Names are resolved in three batches for the whole page, never one lookup
    // per row: a history of a busy gate would otherwise cost hundreds of reads
    // to draw one screen.
    const [names, numbers, entrances] = await Promise.all([
      visitorNames(orgId, stored),
      interiorNumbers(orgId),
      locationNames(orgId),
    ])

    res.json({
      events: stored.map((event) => toResponse(event, names, numbers, entrances)),
      next_cursor: nextCursor,
      request_id: req.id,
    })
  } catch (error) {
    next(error)
  }
})

/** The interiors a responsable is in charge of. Empty is a normal answer. */
async function interiorsOf(uid: string, orgId: string): Promise<string[]> {
  const snapshot = await interiorsCollection(orgId)
    .where('responsable_user_id', '==', uid)
    .get()
  return snapshot.docs.map((doc) => doc.id)
}

/**
 * The visitor's name for each permit on this page.
 *
 * The event does not hold it, on purpose: copying a person's name into a
 * second collection is what `data-minimization.md` exists to prevent. It is
 * read from the permit at display time instead, and only for the permits this
 * page actually shows.
 */
async function visitorNames(
  orgId: string,
  events: Array<{ permit_id?: string | null }>,
): Promise<Map<string, string>> {
  const ids = [...new Set(events.map((one) => one.permit_id).filter((id): id is string => !!id))]
  if (ids.length === 0) return new Map()

  const snapshots = await Promise.all(
    ids.map((id) => permitsCollection(orgId).doc(id).get()),
  )
  const names = new Map<string, string>()
  for (const snapshot of snapshots) {
    if (!snapshot.exists) continue
    const permit = snapshot.data() as Partial<PermitDocument>
    names.set(snapshot.id, String(permit.visitor_name ?? ''))
  }
  return names
}

async function interiorNumbers(orgId: string): Promise<Map<string, string>> {
  const snapshot = await interiorsCollection(orgId).get()
  return new Map(
    snapshot.docs.map((doc) => [
      doc.id,
      String((doc.data() as Partial<InteriorDocument>).number ?? ''),
    ]),
  )
}

async function locationNames(orgId: string): Promise<Map<string, string>> {
  const snapshot = await locationsCollection(orgId).get()
  return new Map(
    snapshot.docs.map((doc) => [
      doc.id,
      String((doc.data() as Partial<LocationDocument>).name ?? ''),
    ]),
  )
}

function toResponse(
  event: Partial<AccessEventDocument> & { id: string },
  names: Map<string, string>,
  numbers: Map<string, string>,
  entrances: Map<string, string>,
): EventResponse {
  const permitId = event.permit_id ?? null
  const interiorId = event.interior_id ?? null
  const locationId = String(event.location_id ?? '')

  return {
    id: event.id,
    action: event.action === 'note' ? 'note' : 'entry',
    result: event.result === 'allowed' ? 'allowed' : 'denied',
    deny_reason: event.deny_reason ?? null,
    note: event.note ?? null,
    about_event_id: event.about_event_id ?? null,
    entry_returned: event.entry_returned ?? null,
    // Empty when the permit is gone — a check whose permit was deleted still
    // happened, and hiding the row would be a hole in an audit trail.
    visitor_name: permitId ? (names.get(permitId) ?? '') : '',
    permit_id: permitId,
    interior_id: interiorId,
    interior_number: interiorId ? (numbers.get(interiorId) ?? '') : '',
    location_id: locationId,
    location_name: entrances.get(locationId) ?? '',
    created_at: toIso(event.created_at),
  }
}

/** Firestore hands timestamps back as objects with toDate(); the double stores Dates. */
function toIso(value: unknown): string | null {
  if (value instanceof Date) return value.toISOString()
  const maybe = value as { toDate?: () => Date } | null | undefined
  if (maybe && typeof maybe.toDate === 'function') return maybe.toDate().toISOString()
  return null
}
