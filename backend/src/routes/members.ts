import { Router } from 'express'
import { FieldValue } from 'firebase-admin/firestore'
import type { Transaction } from 'firebase-admin/firestore'
import { z } from 'zod'
import { auth, db } from '../lib/firebase.js'
import { requireAuth } from '../middleware/auth.js'
import { requireOrgAdmin } from '../middleware/orgAccess.js'
import { conflict, invalidRequest, notFound } from '../lib/errors.js'
import { logger } from '../lib/logger.js'
import { orgRef } from '../lib/orgs.js'
import { ORG_ROLES, userRef, usersCollection } from '../lib/users.js'
import type { OrgRole, UserDocument } from '../lib/users.js'
import {
  ASSIGNABLE_ROLES,
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
    last_name: NameSchema,
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
async function findOrCreateAccount(input: { email: string; displayName: string }): Promise<{
  uid: string
}> {
  try {
    const existing = await auth().getUserByEmail(input.email)
    return { uid: existing.uid }
  } catch (error) {
    if (errorCode(error) !== 'auth/user-not-found') throw error
  }

  try {
    const created = await auth().createUser({
      email: input.email,
      displayName: input.displayName,
      password: unusablePassword(),
    })
    return { uid: created.uid }
  } catch (error) {
    // Two administrators adding the same person at the same instant: the loser
    // reads back the account the winner just created.
    if (errorCode(error) === 'auth/email-already-exists') {
      const existing = await auth().getUserByEmail(input.email)
      return { uid: existing.uid }
    }
    throw error
  }
}

/** The email Firebase holds for these accounts. Never read from our database. */
async function emailsOf(uids: string[]): Promise<Map<string, string | null>> {
  const emails = new Map<string, string | null>()
  if (uids.length === 0) return emails

  const found = await auth().getUsers(uids.map((uid) => ({ uid })))
  for (const user of found.users) emails.set(user.uid, user.email ?? null)
  for (const uid of uids) if (!emails.has(uid)) emails.set(uid, null)
  return emails
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
membersRouter.post('/', requireAuth, requireOrgAdmin, async (req, res, next) => {
  const parsed = AddMemberSchema.safeParse(req.body ?? {})
  if (!parsed.success) {
    next(badRequest(parsed.error))
    return
  }

  const orgId = String(req.params.orgId)
  const { email, first_name: firstName, last_name: lastName, role } = parsed.data

  try {
    const { uid } = await findOrCreateAccount({
      email,
      displayName: `${firstName} ${lastName}`,
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
      const snapshot = await tx.get(ref)
      const current = snapshot.exists ? (snapshot.data() as Partial<UserDocument>) : undefined

      const document: Record<string, unknown> = {
        id: uid,
        deleted: false,
        orgs: withMembership(current, orgId, role),
        updated_at: FieldValue.serverTimestamp(),
      }

      // The name the administrator typed only opens the account. Someone who
      // already has a profile owns how their own name is spelled.
      if (!current?.first_name) document.first_name = firstName
      if (!current?.last_name) document.last_name = lastName
      if (!snapshot.exists) document.created_at = FieldValue.serverTimestamp()

      tx.set(ref, document, { merge: true })
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
      ...toMemberResponse(uid, stored, role, email),
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

    const emails = await emailsOf(rows.map((row) => row.uid))

    const members: MemberResponse[] = rows
      .map((row) => {
        const role = row.stored.orgs!.find((entry) => entry.org_id === orgId)!.role as OrgRole
        return toMemberResponse(row.uid, row.stored, role, emails.get(row.uid) ?? null)
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

    await ref.update({
      orgs: withoutMembership(stored, orgId),
      updated_at: FieldValue.serverTimestamp(),
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
