import { Router } from 'express'
import { FieldValue } from 'firebase-admin/firestore'
import type { Transaction } from 'firebase-admin/firestore'
import { z } from 'zod'
import { auth, db } from '../lib/firebase.js'
import { requireAuth } from '../middleware/auth.js'
import { requireApprovedOrg, requireOrgAdmin } from '../middleware/orgAccess.js'
import { conflict, invalidRequest, notFound } from '../lib/errors.js'
import { logger } from '../lib/logger.js'
import { orgRef } from '../lib/orgs.js'
import type { OrgDocument } from '../lib/orgs.js'
import {
  checkMemberAllowance,
  memberAddedUpdate,
  memberRemovedUpdate,
} from '../lib/quota.js'
import { ORG_ROLES, userRef, usersCollection } from '../lib/users.js'
import type { OrgRole, UserDocument } from '../lib/users.js'
import {
  ASSIGNABLE_ROLES,
  hasEverSignedIn,
  toMemberResponse,
  unusablePassword,
  withMembership,
  withoutMembership,
} from '../lib/members.js'
import type { MemberResponse } from '../lib/members.js'

/**
 * The people who belong to one organization (Decision 006).
 *
 * **Administrators only, on every route.** Who lives in a building is exactly
 * the kind of thing one resident must not be able to read about their
 * neighbours, and only an administrator may add or remove anyone.
 */
export const membersRouter: Router = Router({ mergeParams: true })

const NameSchema = z.string().trim().min(1).max(100)

const AddMemberSchema = z
  .object({
    email: z.string().trim().toLowerCase().email().max(254),
    first_name: NameSchema,
    /**
     * Optional since 2026-09-04. The product stores as little about a person as
     * it can, and a surname next to an apartment number is the half of the pair
     * that is worth something to somebody who should not have it. What the
     * administrator needs to tell two residents apart is a name, not a legal
     * identity — and the email beside it already does the identifying.
     */
    last_name: NameSchema.optional(),
    role: z.enum(ASSIGNABLE_ROLES),
  })
  .strict()

function badRequest(error: z.ZodError): ReturnType<typeof invalidRequest> {
  return invalidRequest(
    'The request body is not valid.',
    error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message })),
  )
}

function errorCode(error: unknown): string | undefined {
  return typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code: unknown }).code)
    : undefined
}

/**
 * The Firebase account for this email address, creating one if it does not
 * exist yet.
 *
 * The caller is never told which of the two happened. An administrator typing
 * an email address must not be able to learn whether it already belongs to a
 * Zeker user — the same refusal to be helpful that sign-in and password
 * recovery already make, applied here to an authenticated caller.
 *
 * The password is random and immediately discarded. It exists only because
 * Firebase will not send a password-reset email to an account that has no
 * password, and that email is how the person sets their own.
 */
async function findOrCreateAccount(input: {
  email: string
  displayName: string
  /**
   * Runs after the lookup and **before** an account is created, only when
   * there is nothing to find. It is where the limits of R-02 are applied, so
   * that a refusal never leaves an orphan account behind — and so that adding
   * somebody who already has an account, to change their role, is not refused
   * by a limit that exists to stop new accounts being made.
   */
  beforeCreate?: () => void
}): Promise<{
  uid: string
  hasSignedIn: boolean
}> {
  try {
    const existing = await auth().getUserByEmail(input.email)
    return { uid: existing.uid, hasSignedIn: hasEverSignedIn(existing) }
  } catch (error) {
    if (errorCode(error) !== 'auth/user-not-found') throw error
  }

  input.beforeCreate?.()

  try {
    const created = await auth().createUser({
      email: input.email,
      displayName: input.displayName,
      password: unusablePassword(),
    })
    // Brand new: nobody has signed in with it, by definition.
    return { uid: created.uid, hasSignedIn: false }
  } catch (error) {
    // Two administrators adding the same person at the same instant: the loser
    // reads back the account the winner just created.
    if (errorCode(error) === 'auth/email-already-exists') {
      const existing = await auth().getUserByEmail(input.email)
      return { uid: existing.uid, hasSignedIn: hasEverSignedIn(existing) }
    }
    throw error
  }
}

interface Account {
  email: string | null
  /** `null` when Firebase did not return the account — unknown, not "no". */
  hasSignedIn: boolean | null
}

/**
 * What Firebase holds for these accounts: the address, and whether the person
 * has ever actually signed in. Neither is read from our database — Firebase
 * Auth is the system of record for both (Decision 002), and this costs no
 * extra call: it is the same lookup the email already needed.
 */
async function accountsOf(uids: string[]): Promise<Map<string, Account>> {
  const accounts = new Map<string, Account>()
  if (uids.length === 0) return accounts

  const found = await auth().getUsers(uids.map((uid) => ({ uid })))
  for (const user of found.users) {
    accounts.set(user.uid, { email: user.email ?? null, hasSignedIn: hasEverSignedIn(user) })
  }
  // A member whose Firebase account is missing stays in the list — the
  // membership is real — but nothing is claimed about a person we cannot read.
  for (const uid of uids) {
    if (!accounts.has(uid)) accounts.set(uid, { email: null, hasSignedIn: null })
  }
  return accounts
}

/**
 * POST /orgs/{orgId}/members
 *
 * Adds a person to the organization. **Administrators only.**
 *
 * Creates their Firebase account if they do not have one. The browser then asks
 * Firebase to send them a "set your password" email — this server never handles
 * a password (Decision 002) and sends no email of its own.
 */
// Decision 018 sits between the role check and the work: an unapproved
// building may be set up, and may not cause an account to exist for anybody.
membersRouter.post('/', requireAuth, requireOrgAdmin, requireApprovedOrg, async (req, res, next) => {
  const parsed = AddMemberSchema.safeParse(req.body ?? {})
  if (!parsed.success) {
    next(badRequest(parsed.error))
    return
  }

  const orgId = String(req.params.orgId)
  const { email, first_name: firstName, last_name: lastName, role } = parsed.data
  const now = new Date()

  try {
    // Both limits are checked **before** a Firebase account is created (R-02).
    // The email that makes this worth abusing is sent by the browser after a
    // 201, so refusing anywhere before that stops it — but an account created
    // and then refused still leaves an orphan in Firebase, and the cheapest
    // way to not have orphans is to not create them.
    //
    // It runs only on the path that would create one. An address that already
    // has an account is somebody being given a role, which makes no account
    // and sends no email, and must not be refused by an organization that is
    // full — otherwise the limit traps the administrator instead of the abuser.
    //
    // This read is not authoritative. Two administrators adding people at the
    // same instant can both pass it; the copy inside the transaction below is
    // what actually decides.
    const orgBefore = await orgRef(orgId).get()

    const { uid, hasSignedIn } = await findOrCreateAccount({
      email,
      displayName: `${firstName} ${lastName}`,
      beforeCreate: () =>
        checkMemberAllowance(
          orgBefore.exists ? (orgBefore.data() as Partial<OrgDocument>) : undefined,
          now,
        ),
    })

    if (uid === req.user!.uid) {
      next(
        conflict(
          'You are an administrator of this organization. You cannot change your own role here.',
        ),
      )
      return
    }

    const stored = await db().runTransaction(async (tx: Transaction) => {
      const ref = userRef(uid)
      // Every read before the first write, and the organization is read here
      // rather than reused from above because the count may have moved.
      const snapshot = await tx.get(ref)
      const org = await tx.get(orgRef(orgId))
      const current = snapshot.exists ? (snapshot.data() as Partial<UserDocument>) : undefined

      // Somebody who already belongs here is having their role changed, which
      // adds nobody and sends nothing. It must not consume an allowance, and
      // it must not be refused when the organization is full.
      const alreadyMember = (current?.orgs ?? []).some((entry) => entry.org_id === orgId)

      checkMemberAllowance(
        org.exists ? (org.data() as Partial<OrgDocument>) : undefined,
        now,
        alreadyMember,
      )

      const document: Record<string, unknown> = {
        id: uid,
        deleted: false,
        orgs: withMembership(current, orgId, role),
        updated_at: FieldValue.serverTimestamp(),
      }

      // The name the administrator typed only opens the account. Someone who
      // already has a profile owns how their own name is spelled.
      if (!current?.first_name) document.first_name = firstName
      // A surname that was not given is not written at all, rather than written
      // as an empty string: absent and empty read the same everywhere that
      // displays a name, and only one of them is the truth.
      if (!current?.last_name && lastName) document.last_name = lastName
      if (!snapshot.exists) document.created_at = FieldValue.serverTimestamp()

      tx.set(ref, document, { merge: true })
      if (!alreadyMember) {
        tx.update(
          orgRef(orgId),
          memberAddedUpdate(org.exists ? (org.data() as Partial<OrgDocument>) : undefined, now),
        )
      }
      return { ...current, ...document } as Partial<UserDocument>
    })

    // Audit trail — Security Engineer position, Decision 001. Who granted
    // access to a building, to whom, and in which role.
    logger.info(
      {
        audit: 'member.added',
        user_id: req.user!.uid,
        org_id: orgId,
        member_id: uid,
        role,
        request_id: req.id,
      },
      'Member added to organization',
    )

    res.status(201).json({
      ...toMemberResponse(uid, stored, role, email, hasSignedIn),
      request_id: req.id,
    })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /orgs/{orgId}/members
 *
 * Everyone who belongs to this organization. **Administrators only.**
 *
 * Membership lives inside `users/{uid}.orgs[]` as `{org_id, role}` objects, so
 * this asks for a match on any of the role combinations that can exist. The
 * list is built from `ORG_ROLES`, so adding a role later cannot silently leave
 * people out of this answer.
 */
membersRouter.get('/', requireAuth, requireOrgAdmin, async (req, res, next) => {
  const orgId = String(req.params.orgId)

  try {
    const snapshot = await usersCollection()
      .where(
        'orgs',
        'array-contains-any',
        ORG_ROLES.map((role) => ({ org_id: orgId, role })),
      )
      .get()

    const rows = snapshot.docs
      .map((doc) => ({ uid: doc.id, stored: doc.data() as Partial<UserDocument> }))
      .filter((row) => row.stored.deleted !== true)
      .filter((row) => row.stored.orgs?.some((entry) => entry.org_id === orgId))

    const accounts = await accountsOf(rows.map((row) => row.uid))

    const members: MemberResponse[] = rows
      .map((row) => {
        const role = row.stored.orgs!.find((entry) => entry.org_id === orgId)!.role as OrgRole
        const account = accounts.get(row.uid)
        return toMemberResponse(
          row.uid,
          row.stored,
          role,
          account?.email ?? null,
          account?.hasSignedIn ?? null,
        )
      })
      .sort((a, b) =>
        `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`, 'es'),
      )

    res.json({ members, request_id: req.id })
  } catch (error) {
    next(error)
  }
})

/**
 * DELETE /orgs/{orgId}/members/{userId}
 *
 * Removes a person from the organization. **Administrators only.**
 *
 * Their Firebase account is left alone. One person can belong to several
 * organizations (a project non-negotiable), so deleting the account would take
 * away access they still legitimately have elsewhere. What is removed is this
 * organization's membership, which is what grants access to this building.
 *
 * Refused while they are still in charge of an interior, matching how locations
 * and interiors already refuse to be deleted while something depends on them.
 * Every interior must always have a responsable (Decision 006), so the
 * replacement is chosen first.
 */
membersRouter.delete('/:userId', requireAuth, requireOrgAdmin, async (req, res, next) => {
  const orgId = String(req.params.orgId)
  const userId = String(req.params.userId)

  if (userId === req.user!.uid) {
    next(
      conflict(
        'You cannot remove yourself from this organization. Another administrator must do it.',
      ),
    )
    return
  }

  try {
    const ref = userRef(userId)
    const snapshot = await ref.get()
    const stored = snapshot.exists ? (snapshot.data() as Partial<UserDocument>) : undefined
    const membership = stored?.orgs?.find((entry) => entry.org_id === orgId)

    if (!membership) {
      next(notFound('That person is not a member of this organization.'))
      return
    }

    const inCharge = await orgRef(orgId)
      .collection('interiors')
      .where('responsable_user_id', '==', userId)
      .limit(1)
      .get()

    if (!inCharge.empty) {
      next(
        conflict(
          'This person is still in charge of an interior. Put someone else in charge of it before removing them.',
        ),
      )
      return
    }

    // The membership and the count move together, so a removed person always
    // frees their place — the same rule `deleteCounted` follows for interiors.
    // The day's invitation count is deliberately not given back: removing
    // somebody does not un-send the email their address already received.
    await db().runTransaction(async (tx: Transaction) => {
      tx.update(ref, {
        orgs: withoutMembership(stored, orgId),
        updated_at: FieldValue.serverTimestamp(),
      })
      tx.update(orgRef(orgId), memberRemovedUpdate())
    })

    logger.info(
      {
        audit: 'member.removed',
        user_id: req.user!.uid,
        org_id: orgId,
        member_id: userId,
        role: membership.role,
        request_id: req.id,
      },
      'Member removed from organization',
    )

    res.json({ user_id: userId, removed: true, request_id: req.id })
  } catch (error) {
    next(error)
  }
})
