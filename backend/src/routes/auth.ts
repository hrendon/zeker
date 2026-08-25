import { Router } from 'express'
import { z } from 'zod'
import { auth } from '../lib/firebase.js'
import { requireAuth } from '../middleware/auth.js'
import { invalidRequest } from '../lib/errors.js'
import { logger } from '../lib/logger.js'
import { ensureUserProfile, toUserProfile, userRef } from '../lib/users.js'
import type { UserDocument } from '../lib/users.js'

export const authRouter: Router = Router()

/**
 * Sign-up and sign-in happen in the browser against Firebase Auth, not here.
 * This server never receives a password — only the signed token that proves
 * Firebase accepted one. See docs/decisions/002-client-side-firebase-auth.md.
 *
 * These routes are therefore all post-authentication: every one of them
 * requires a valid Firebase ID token.
 */

const NameSchema = z.string().trim().min(1).max(100)

const SessionBodySchema = z
  .object({
    first_name: NameSchema.optional(),
    last_name: NameSchema.optional(),
  })
  .strict()

/**
 * POST /auth/session
 *
 * The first call the frontend makes after Firebase reports a successful
 * sign-in. Creates the user's profile if this is their first time, and
 * refreshes `last_login` if it is not. Safe to call on every sign-in.
 */
authRouter.post('/session', requireAuth, async (req, res, next) => {
  const parsed = SessionBodySchema.safeParse(req.body ?? {})
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

  const user = req.user!

  try {
    const { profileData, created } = await ensureUserProfile({
      uid: user.uid,
      firstName: parsed.data.first_name,
      lastName: parsed.data.last_name,
      fallbackName: typeof user.token.name === 'string' ? user.token.name : undefined,
    })

    if (created) {
      logger.info({ user_id: user.uid, request_id: req.id }, 'User profile created')
    }

    res.status(created ? 201 : 200).json({
      ...toUserProfile(user.uid, profileData, {
        email: user.email,
        emailVerified: user.token.email_verified === true,
      }),
      request_id: req.id,
    })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /auth/me
 *
 * The current user's profile and the organizations they belong to. This is
 * what the frontend uses to decide which experience to show (admin,
 * responsable or security) and to populate the organization switcher.
 */
authRouter.get('/me', requireAuth, async (req, res, next) => {
  const user = req.user!

  try {
    const snapshot = await userRef(user.uid).get()
    const stored = snapshot.exists ? (snapshot.data() as Partial<UserDocument>) : undefined

    res.json({
      ...toUserProfile(user.uid, stored, {
        email: user.email,
        emailVerified: user.token.email_verified === true,
      }),
      // Tells the frontend to call POST /auth/session before doing anything
      // else — the account exists in Firebase but has no profile here yet.
      profile_exists: snapshot.exists,
      request_id: req.id,
    })
  } catch (error) {
    next(error)
  }
})

/**
 * POST /auth/logout
 *
 * Revokes the user's refresh tokens so the session cannot be resumed, even by
 * someone holding a copy of the tokens. `requireAuth` verifies tokens with
 * checkRevoked=true, so existing ID tokens stop being accepted immediately
 * rather than remaining valid until they expire.
 *
 * The browser must also clear its own Firebase session; this endpoint closes
 * the server side of it.
 */
authRouter.post('/logout', requireAuth, async (req, res, next) => {
  const user = req.user!

  try {
    await auth().revokeRefreshTokens(user.uid)
    logger.info({ user_id: user.uid, request_id: req.id }, 'Session revoked')

    res.json({ revoked: true, request_id: req.id })
  } catch (error) {
    next(error)
  }
})
