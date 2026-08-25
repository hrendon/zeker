import { FieldValue } from 'firebase-admin/firestore'
import type { DocumentReference, Transaction } from 'firebase-admin/firestore'
import { db } from './firebase.js'
import { AppError, notFound } from './errors.js'
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
