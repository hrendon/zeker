import { orgRef } from './orgs.js'

/**
 * Access events — the record of every check made at a door.
 *
 * One document per check, allowed or refused. This is the audit trail the
 * whole product rests on: a permit says who *may* enter, an event says what
 * actually happened when someone stood at the gate. A refusal is as much a
 * part of that trail as an entry, so every check is written, never only the
 * successful ones.
 *
 * Stored in `orgs/{orgId}/access_events`, the collection name
 * `docs/architecture/data-model.md` already reserves.
 *
 * **Immutable.** Nothing in the codebase updates an event after it is written.
 * A log that can be edited is not evidence.
 *
 * Four deliberate departures from that document, each recorded there too:
 *
 * 1. **No `ip_address` and no `device_type`** (Founder decision, 2026-08-30).
 *    Those describe the guard, not the visitor. Kept for 90 days across every
 *    scan of a shift they become a location trail of a customer's own staff —
 *    something we would then have to disclose, defend and protect, in exchange
 *    for an investigation nobody has asked for. `checked_by` and `request_id`
 *    already answer "who did this" and "which request was it".
 *
 * 2. **No `visitor_name`.** The event points at the permit, and the permit
 *    holds the name. Copying it here would put the same person's name in a
 *    second collection, which is exactly what `data-minimization.md` exists to
 *    prevent — and the same reason a responsable's name is not copied onto an
 *    interior (Decision 006). A check that matched no permit has no name to
 *    show, and correctly shows none.
 *
 * 3. **`action` is always `entry`** (Founder decision, 2026-08-30). Exits are
 *    not recorded in the MVP: it doubles the work at the gate and no customer
 *    has asked for it. The field is kept, and typed as a union of one, so
 *    adding `exit` later is a change of one line rather than a migration.
 *
 * 4. **The scanned code is stored only when nothing matched.** When a permit
 *    was found, `permit_id` identifies it and the code is not copied — a live
 *    door code has no business being duplicated into a second collection that
 *    more people can read. When nothing matched there is no permit to point
 *    at, and the characters someone typed are the only evidence of what was
 *    attempted, so they are kept.
 *
 * `expires_at` exists for the Firestore TTL policy, which deletes an event once
 * that moment passes — 90 days after an entry, 30 after a refusal
 * (`../../../docs/security/data-minimization.md`). **Writing this field does not
 * enable that policy** — the policy is configured once, per
 * collection group, in Google Cloud. See the developer guide; this is the same
 * trap as declaring an index without deploying it.
 */

/** Why a check was refused. Ordered as the check itself evaluates them. */
export const DENY_REASONS = [
  'invalid_code',
  'revoked',
  // Decision 014: a one-entry permit that already let somebody in. A guard who
  // is only told "no" cannot explain anything to the person in front of them.
  'already_used',
  'not_started',
  'expired',
  'wrong_location',
] as const
export type DenyReason = (typeof DENY_REASONS)[number]

export type EventResult = 'allowed' | 'denied'

/** Only entries are recorded today — see note 3 above. */
export type EventAction = 'entry'

/**
 * How long a check is kept, per `docs/security/data-minimization.md`.
 *
 * A refusal is kept for a third as long as an entry. An entry is the audit
 * trail a customer may need to consult months later — who came into the
 * building. A refusal is only useful for a security review soon afterwards, and
 * refusals are where the record of people who never entered accumulates: a
 * mistyped code from a passing courier is not something to hold for a quarter.
 */
export const EVENT_RETENTION_DAYS = { allowed: 90, denied: 30 } as const

export interface AccessEventDocument {
  id: string
  org_id: string
  /** The entrance the guard was standing at. Always a real location. */
  location_id: string
  /** Null when the code matched no permit. */
  permit_id: string | null
  /** Copied from the permit, so the history can group by apartment. */
  interior_id: string | null
  action: EventAction
  result: EventResult
  deny_reason: DenyReason | null
  /** Only when nothing matched — see note 4 above. */
  scanned_code: string | null
  /** The guard, or the administrator, who made the check. */
  checked_by: string
  request_id: string
  created_at?: unknown
  /** Read by the Firestore TTL policy. Not part of any API response. */
  expires_at: Date
}

export function eventsCollection(orgId: string) {
  return orgRef(orgId).collection('access_events')
}

export function newEventId(orgId: string): string {
  return `event_${eventsCollection(orgId).doc().id}`
}

/** When an event written at `at` should be deleted. */
export function retentionDate(at: Date, result: EventResult): Date {
  return new Date(at.getTime() + EVENT_RETENTION_DAYS[result] * 24 * 60 * 60 * 1000)
}
