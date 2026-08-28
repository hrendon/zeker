import { FieldValue } from 'firebase-admin/firestore'
import type { Transaction } from 'firebase-admin/firestore'
import { db } from './firebase.js'

/**
 * The user profile stored in Firestore, per docs/architecture/data-model.md.
 *
 * Two deliberate departures from that document, both narrowing what we keep:
 *
 * 1. No `email_plaintext`, `email_hash` or `phone_encrypted`. Those fields
 *    require encryption with Cloud KMS, which is an open design problem
 *    (see PROJECT_STATE.md, "Encryption plan is not buildable as written").
 *    Firebase Auth is already the system of record for the email address, and
 *    it arrives on every request inside the verified token, so duplicating it
 *    here would store personal data we do not need — against the project's
 *    data-minimization rule. These fields are added only if a requirement
 *    actually needs them.
 *
 * 2. No top-level `role`. One person can administer several organizations
 *    (a project non-negotiable), so a single global role cannot be correct.
 *    The role is per organization, in `orgs[]`.
 */

export const ORG_ROLES = ['admin', 'responsable', 'security'] as const
export type OrgRole = (typeof ORG_ROLES)[number]

export interface OrgMembership {
  org_id: string
  role: OrgRole
}

export interface UserDocument {
  id: string
  first_name: string
  last_name: string
  orgs: OrgMembership[]
  created_at?: FirestoreTimestampLike
  last_login?: FirestoreTimestampLike
  deleted: boolean
}

/** What Firestore gives back for a timestamp field. */
export interface FirestoreTimestampLike {
  toDate(): Date
}

export interface UserProfile {
  user_id: string
  email: string | undefined
  email_verified: boolean
  first_name: string
  last_name: string
  orgs: OrgMembership[]
  created_at: string | null
  last_login: string | null
}

export function usersCollection() {
  return db().collection('users')
}

export function userRef(uid: string) {
  return usersCollection().doc(uid)
}

/**
 * The display names of several accounts at once, keyed by uid.
 *
 * Since Decision 006 an interior's responsable is an account, and the name
 * shown for them comes from that account rather than from text typed onto the
 * interior. One read for a whole list keeps that from costing a query per row.
 */
export async function displayNames(uids: string[]): Promise<Map<string, string>> {
  const names = new Map<string, string>()
  const unique = [...new Set(uids.filter((uid) => uid.length > 0))]
  if (unique.length === 0) return names

  const snapshots = await db().getAll(...unique.map((uid) => userRef(uid)))
  for (const snapshot of snapshots) {
    const stored = snapshot.exists ? (snapshot.data() as Partial<UserDocument>) : undefined
    names.set(snapshot.id, [stored?.first_name ?? '', stored?.last_name ?? ''].join(' ').trim())
  }
  return names
}

/** Firestore timestamps are objects; the API contract sends ISO-8601 strings. */
export function toIso(value: unknown): string | null {
  if (value && typeof (value as FirestoreTimestampLike).toDate === 'function') {
    return (value as FirestoreTimestampLike).toDate().toISOString()
  }
  return null
}

/**
 * Builds the API representation of a user. The email is read from the verified
 * Firebase token rather than from storage — see the note at the top of this file.
 */
export function toUserProfile(
  uid: string,
  stored: Partial<UserDocument> | undefined,
  identity: { email: string | undefined; emailVerified: boolean },
): UserProfile {
  return {
    user_id: uid,
    email: identity.email,
    email_verified: identity.emailVerified,
    first_name: stored?.first_name ?? '',
    last_name: stored?.last_name ?? '',
    orgs: stored?.orgs ?? [],
    created_at: toIso(stored?.created_at),
    last_login: toIso(stored?.last_login),
  }
}

export interface EnsureUserInput {
  uid: string
  firstName?: string
  lastName?: string
  /** Used only when creating a profile that has no name yet. */
  fallbackName?: string
}

export interface EnsureUserResult {
  profileData: Partial<UserDocument>
  created: boolean
}

/**
 * Creates the profile on first sign-in, or refreshes it on later sign-ins.
 * Idempotent: calling it repeatedly is safe and only moves `last_login`.
 *
 * Runs in a transaction so two sign-ins arriving at the same moment cannot
 * both decide they are the first one and overwrite `created_at`.
 */
export async function ensureUserProfile(input: EnsureUserInput): Promise<EnsureUserResult> {
  const ref = userRef(input.uid)

  return db().runTransaction(async (tx: Transaction) => {
    const snapshot = await tx.get(ref)
    const existing = snapshot.exists ? (snapshot.data() as Partial<UserDocument>) : undefined
    const created = !existing

    if (created) {
      const fallback = splitName(input.fallbackName)
      const document: Record<string, unknown> = {
        id: input.uid,
        first_name: input.firstName ?? fallback.firstName,
        last_name: input.lastName ?? fallback.lastName,
        orgs: [],
        deleted: false,
        created_at: FieldValue.serverTimestamp(),
        last_login: FieldValue.serverTimestamp(),
      }
      tx.set(ref, document)
      // serverTimestamp() is a placeholder until Firestore resolves it, so the
      // response reports the time this server observed instead of null.
      return {
        created,
        profileData: {
          ...(document as Partial<UserDocument>),
          created_at: nowTimestamp(),
          last_login: nowTimestamp(),
        },
      }
    }

    const updates: Record<string, unknown> = { last_login: FieldValue.serverTimestamp() }
    if (input.firstName !== undefined) updates.first_name = input.firstName
    if (input.lastName !== undefined) updates.last_name = input.lastName
    tx.update(ref, updates)

    return {
      created,
      profileData: {
        ...existing,
        ...(input.firstName !== undefined ? { first_name: input.firstName } : {}),
        ...(input.lastName !== undefined ? { last_name: input.lastName } : {}),
        last_login: nowTimestamp(),
      },
    }
  })
}

function nowTimestamp(): FirestoreTimestampLike {
  const date = new Date()
  return { toDate: () => date }
}

/**
 * Google sign-in supplies one display name, not two fields. Everything after
 * the first space becomes the surname, which is the common Spanish-name case
 * ("María García López" → "María" / "García López").
 */
function splitName(displayName: string | undefined): { firstName: string; lastName: string } {
  const trimmed = displayName?.trim()
  if (!trimmed) return { firstName: '', lastName: '' }

  const separator = trimmed.indexOf(' ')
  if (separator === -1) return { firstName: trimmed, lastName: '' }

  return {
    firstName: trimmed.slice(0, separator),
    lastName: trimmed.slice(separator + 1).trim(),
  }
}
