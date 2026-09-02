import type { OrgRole, UserDocument } from './users.js'

/**
 * Members — the people who belong to one organization.
 *
 * A membership is not a document of its own. It is an entry in
 * `users/{uid}.orgs[]`, which has been the single home of that fact since the
 * first unit (see the note at the top of `orgs.ts`). This module adds the
 * missing half: a way to *create* a membership for someone who is not the
 * person who created the organization.
 *
 * Decision 006. The person in charge of an interior is a real account created
 * by a building administrator, not typed text. Security personnel arrive the
 * same way, with a different role.
 *
 * Not stored, deliberately: the member's email address. Firebase Auth is the
 * system of record for it (Decision 002) and it arrives inside the verified
 * token on every request. It is read back from Firebase when a screen needs to
 * show it, never copied into Firestore.
 */

/**
 * The roles an administrator may hand out. `admin` is absent on purpose:
 * a second administrator for one building has not been requested, and
 * Decision 006 does not grant it.
 */
export const ASSIGNABLE_ROLES = ['responsable', 'security'] as const
export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number]

export interface MemberResponse {
  user_id: string
  first_name: string
  last_name: string
  /** Read from Firebase Auth at request time, never from our database. */
  email: string | null
  role: OrgRole
  /**
   * Whether this person has ever signed in — the difference between an account
   * that exists and a person who actually has access. An administrator creates
   * the account and Firebase emails them; until they open that email and set a
   * password, they cannot get in, and nothing on any screen said so.
   *
   * `null` means we do not know: Firebase did not return the account. Not the
   * same as `false`, and the screen must not claim it is.
   */
  has_signed_in: boolean | null
}

/**
 * Whether a Firebase account has ever been used to sign in.
 *
 * Firebase leaves `lastSignInTime` empty until the first sign-in. An account
 * created by an administrator therefore reads `false` from the moment it is
 * made, which is exactly the state worth showing.
 */
export function hasEverSignedIn(user: unknown): boolean {
  const metadata = (user as { metadata?: { lastSignInTime?: string | null } } | undefined)?.metadata
  return Boolean(metadata?.lastSignInTime)
}

export function toMemberResponse(
  uid: string,
  stored: Partial<UserDocument> | undefined,
  role: OrgRole,
  email: string | null,
  hasSignedIn: boolean | null,
): MemberResponse {
  return {
    user_id: uid,
    first_name: String(stored?.first_name ?? ''),
    last_name: String(stored?.last_name ?? ''),
    email,
    role,
    has_signed_in: hasSignedIn,
  }
}

/** The role this person holds in one organization, or undefined if none. */
export function roleInOrg(stored: Partial<UserDocument> | undefined, orgId: string): OrgRole | undefined {
  return stored?.orgs?.find((membership) => membership.org_id === orgId)?.role
}

/**
 * The membership list with this organization's entry set to `role` — replacing
 * an existing entry rather than adding a second one for the same organization.
 */
export function withMembership(
  current: Partial<UserDocument> | undefined,
  orgId: string,
  role: OrgRole,
): Array<{ org_id: string; role: OrgRole }> {
  const others = (current?.orgs ?? []).filter((membership) => membership.org_id !== orgId)
  return [...others, { org_id: orgId, role }]
}

/** The membership list without this organization. */
export function withoutMembership(
  current: Partial<UserDocument> | undefined,
  orgId: string,
): Array<{ org_id: string; role: OrgRole }> {
  return (current?.orgs ?? []).filter((membership) => membership.org_id !== orgId)
}

/**
 * A password for an account the administrator creates on someone else's
 * behalf. It is never shown to anyone and never stored: the person receives an
 * email from Firebase and sets their own. It exists only because an account
 * with no password cannot be sent a password-reset email.
 */
export function unusablePassword(): string {
  return `Zk-${globalThis.crypto.randomUUID()}-${globalThis.crypto.randomUUID()}`
}
