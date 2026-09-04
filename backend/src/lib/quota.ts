import { FieldValue } from 'firebase-admin/firestore'
import type { DocumentReference, Transaction } from 'firebase-admin/firestore'
import { db } from './firebase.js'
import { AppError, inviteLimitReached, notFound } from './errors.js'
import { FREE_PLAN_LIMITS, orgRef } from './orgs.js'
import type { OrgDocument } from './orgs.js'

/**
 * Plan limits, enforced (Decision 003).
 *
 * The check and the write happen inside one Firestore transaction. Checking
 * first and writing afterwards would let two requests arriving at the same
 * moment both read "9 interiors used", both decide there is room, and both
 * write — leaving 11. The transaction makes that impossible: if the counter
 * moves underneath, Firestore retries the whole thing.
 *
 * The counter lives on the organization (`counts`) rather than being computed
 * by counting documents, because counting every interior on every create would
 * cost a read per interior and still race.
 */

export type CountedResource = 'locations' | 'interiors'

const LIMIT_FIELD: Record<CountedResource, keyof typeof FREE_PLAN_LIMITS> = {
  locations: 'max_locations',
  interiors: 'max_interiors',
}

/** 403, with its own code so the interface can show the right Spanish wording. */
export function quotaExceeded(resource: CountedResource, limit: number): AppError {
  return new AppError(
    'quota_exceeded',
    `This organization has reached its limit of ${limit} ${resource}. Upgrade the plan to add more.`,
    { resource, limit },
  )
}

export interface CreateCountedInput {
  orgId: string
  resource: CountedResource
  ref: DocumentReference
  document: Record<string, unknown>
  /** Extra checks that need to run inside the same transaction, e.g. uniqueness. */
  precheck?: (tx: Transaction) => Promise<void>
}

/**
 * Creates a document and increments the organization's counter, refusing if
 * the plan's limit is already reached. Returns the number now used.
 */
export async function createCounted(input: CreateCountedInput): Promise<{ used: number }> {
  const org = orgRef(input.orgId)

  return db().runTransaction(async (tx: Transaction) => {
    // Every read must happen before the first write in a Firestore transaction.
    const snapshot = await tx.get(org)
    if (!snapshot.exists) throw notFound('Organization not found.')

    const stored = snapshot.data() as Partial<OrgDocument>
    if (stored.status === 'deleted') throw notFound('Organization not found.')

    if (input.precheck) await input.precheck(tx)

    const limits = stored.limits ?? FREE_PLAN_LIMITS
    const limit = limits[LIMIT_FIELD[input.resource]]
    const used = stored.counts?.[input.resource] ?? 0

    if (used >= limit) throw quotaExceeded(input.resource, limit)

    tx.set(input.ref, input.document)
    tx.update(org, {
      [`counts.${input.resource}`]: FieldValue.increment(1),
      updated_at: FieldValue.serverTimestamp(),
    })

    return { used: used + 1 }
  })
}

/**
 * Deletes a document and decrements the organization's counter together, so a
 * deleted resource always frees its slot.
 */
export async function deleteCounted(input: {
  orgId: string
  resource: CountedResource
  ref: DocumentReference
}): Promise<void> {
  const org = orgRef(input.orgId)

  await db().runTransaction(async (tx: Transaction) => {
    const snapshot = await tx.get(input.ref)
    // Already gone: leave the counter alone rather than driving it negative.
    if (!snapshot.exists) return

    tx.delete(input.ref)
    tx.update(org, {
      [`counts.${input.resource}`]: FieldValue.increment(-1),
      updated_at: FieldValue.serverTimestamp(),
    })
  })
}

// ---------------------------------------------------------------------------
// People (R-02)
// ---------------------------------------------------------------------------

/**
 * Adding a person is not like adding an interior, so it does not go through
 * `createCounted`.
 *
 * An interior is a document inside the organization. A person is a Firebase
 * account plus a membership merged into `users/{uid}`, which lives outside the
 * organization because one person can belong to several. So the counting is
 * here and the writing stays in the members route, inside the same
 * transaction.
 *
 * **Two limits, and they are not the same thing.**
 *
 * `max_members` is the plan: how many people may belong at once. It goes down
 * when somebody is removed, and it is what an administrator would recognise as
 * a limit.
 *
 * `max_invites_per_day` is the abuse control. Adding a person makes Google send
 * that address an email carrying our project's name, so an uncapped
 * organization is a mailer (R-02). This one **never** goes down within a day,
 * which is the entire point: a limit that only counts current members is
 * defeated by adding twenty people and removing them, and the twenty emails
 * have already left.
 */

/** 403. The organization is full. A plan limit, phrased like one. */
export function memberQuotaExceeded(limit: number): AppError {
  return new AppError(
    'quota_exceeded',
    `This organization has reached its limit of ${limit} people. Upgrade the plan to add more.`,
    { resource: 'members', limit },
  )
}

/** `YYYY-MM-DD` in UTC — see `OrgDocument.invites_day` for why UTC. */
export function inviteDay(at: Date = new Date()): string {
  return at.toISOString().slice(0, 10)
}

export interface MemberAllowance {
  /** People who may still be added before the plan limit is reached. */
  membersLeft: number
  /** People who may still be added today. */
  invitesLeft: number
}

/**
 * Checks both limits against an organization as it stands, and throws the
 * refusal that applies. Returns what is left, for a caller that wants to say so.
 *
 * **Read this before creating the Firebase account, and again inside the
 * transaction.** The first call is what stops an account from being created at
 * all; the second is what makes the count correct when two requests arrive
 * together. Only the second one is authoritative.
 *
 * `alreadyMember` skips both limits: changing somebody's role, or re-adding a
 * person who is already in the organization, adds nobody and sends no email.
 */
export function checkMemberAllowance(
  stored: Partial<OrgDocument> | undefined,
  at: Date = new Date(),
  alreadyMember = false,
): MemberAllowance {
  const limits = stored?.limits ?? FREE_PLAN_LIMITS
  const maxMembers = limits.max_members ?? FREE_PLAN_LIMITS.max_members
  const maxInvites = limits.max_invites_per_day ?? FREE_PLAN_LIMITS.max_invites_per_day

  const members = stored?.counts?.members ?? 0
  // A counter from another day is not a smaller number, it is no number.
  const invitesToday = stored?.invites_day === inviteDay(at) ? (stored?.invites_today ?? 0) : 0

  const allowance = {
    membersLeft: Math.max(0, maxMembers - members),
    invitesLeft: Math.max(0, maxInvites - invitesToday),
  }

  if (alreadyMember) return allowance

  if (allowance.membersLeft <= 0) throw memberQuotaExceeded(maxMembers)
  if (allowance.invitesLeft <= 0) throw inviteLimitReached(maxInvites)

  return allowance
}

/**
 * What to write on the organization when a person is added: one more member,
 * and one more invitation today.
 *
 * Returns a plain object rather than writing, because the members route already
 * owns the transaction that writes the membership itself.
 */
export function memberAddedUpdate(
  stored: Partial<OrgDocument> | undefined,
  at: Date = new Date(),
): Record<string, unknown> {
  const today = inviteDay(at)
  const sameDay = stored?.invites_day === today

  return {
    'counts.members': FieldValue.increment(1),
    invites_day: today,
    // A counter from a previous day is replaced, not incremented — otherwise
    // yesterday's total would carry into today and shrink the allowance.
    invites_today: sameDay ? FieldValue.increment(1) : 1,
    updated_at: FieldValue.serverTimestamp(),
  }
}

/**
 * What to write when a person is removed: one fewer member.
 *
 * **The invitation counter is deliberately untouched.** Removing somebody does
 * not un-send the email their address already received, and giving the day's
 * allowance back for it is exactly the churn this control exists to stop.
 */
export function memberRemovedUpdate(): Record<string, unknown> {
  return {
    'counts.members': FieldValue.increment(-1),
    updated_at: FieldValue.serverTimestamp(),
  }
}
