import { auth } from './firebase'
import { ApiError, NetworkError, type ApiErrorBody } from './errors'

/**
 * The only place the app talks to the Zeker API.
 *
 * Every call carries the Firebase ID token. The token is read fresh from the
 * SDK on each request, so it is always the current one — the SDK refreshes it
 * in the background and we never cache or store it ourselves.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export interface OrgMembership {
  org_id: string
  role: 'admin' | 'responsable' | 'security'
}

export interface UserProfile {
  user_id: string
  email: string
  email_verified: boolean
  first_name: string
  last_name: string
  orgs: OrgMembership[]
  created_at: string
  last_login: string
  /** Absent on POST /auth/session, which always leaves a profile behind. */
  profile_exists?: boolean
  request_id?: string
}

async function idToken(): Promise<string> {
  const user = auth.currentUser
  if (!user) {
    // Callers reach here only if they ran before sign-in finished. Treating it
    // as an expired session sends the user somewhere useful.
    throw new ApiError(401, { error: 'unauthorized', message: 'No signed-in user' })
  }
  return user.getIdToken()
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const token = await idToken()

  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    })
  } catch (cause) {
    throw new NetworkError(cause)
  }

  if (!response.ok) {
    // A failure that is not our documented error shape (a proxy page, a
    // gateway timeout) still has to become an ApiError rather than crash here.
    const body = await response
      .json()
      .catch((): ApiErrorBody => ({ error: 'internal_server_error' }))
    throw new ApiError(response.status, body as ApiErrorBody)
  }

  return response.json() as Promise<T>
}

/**
 * Called once after Firebase reports a successful sign-in. Creates the profile
 * the first time, refreshes `last_login` afterwards. Safe to call repeatedly.
 * Names are only sent at sign-up; later calls omit them.
 */
export function createSession(names?: {
  first_name: string
  last_name: string
}): Promise<UserProfile> {
  return request<UserProfile>('/auth/session', {
    method: 'POST',
    body: names ?? {},
  })
}

/** Who am I, and which organizations do I belong to. */
export function getMe(): Promise<UserProfile> {
  return request<UserProfile>('/auth/me')
}

/**
 * Ends the session on the server, so a stolen refresh token cannot resume it.
 * If this fails the user is NOT logged out — the caller must say so rather
 * than pretending it worked.
 */
export function logout(): Promise<{ revoked: boolean }> {
  return request<{ revoked: boolean }>('/auth/logout', { method: 'POST' })
}
