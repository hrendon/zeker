import { auth } from './firebase'
import { ApiError, NetworkError, type ApiErrorBody } from './errors'

/**
 * The only place the app talks to the Zeker API.
 *
 * Every call carries the Firebase ID token, read fresh from the SDK each time,
 * so it is always the current one. We never cache or store a token ourselves.
 *
 * Grouped by resource (`locationsApi.create(...)`) rather than a flat list of
 * functions, so this stays readable as the endpoint count grows.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

// ---------------------------------------------------------------------------
// Shapes, mirroring backend/src/lib/{orgs,locations,interiors,users}.ts
// ---------------------------------------------------------------------------

export type OrgRole = 'admin' | 'responsable' | 'security'
export type OrgType = 'school' | 'residence' | 'office' | 'other'
export type OrgPlan = 'free' | 'paid_a' | 'paid_b'
export type LocationType = 'entrance' | 'reception' | 'classroom' | 'zone' | 'other'

export interface OrgMembership {
  org_id: string
  role: OrgRole
}

export interface PlanLimits {
  max_locations: number
  /** Counted across the whole organization, not per location (Decision 003). */
  max_interiors: number
}

export interface Org {
  id: string
  name: string
  type: OrgType
  description: string
  plan: OrgPlan
  limits: PlanLimits
  counts: { locations: number; interiors: number }
  city: string | null
  country: string | null
  created_by: string
  created_at: string
  updated_at: string
  /** Present on the list and create responses: the role the caller holds here. */
  role?: OrgRole
}

export interface Location {
  id: string
  org_id: string
  name: string
  description: string
  type: LocationType
  /** false = retired: kept, with its history, and still using a plan slot. */
  enabled: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export interface Interior {
  id: string
  org_id: string
  location_id: string
  number: string
  name: string
  /** Required since Decision 006: always a member of this organization. */
  responsable_user_id: string | null
  /** Read-only. Comes from the responsable's account, not stored on the interior. */
  responsable_name: string
  enabled: boolean
  created_by: string
  created_at: string
  updated_at: string
}

/** Why a visitor is coming. The only thing a permit says about them beyond a name. */
export type PermitPurpose = 'visitor' | 'pickup' | 'provider' | 'employee' | 'other'

/**
 * What a permit is right now. Worked out by the server from the dates — it is
 * not stored, so nothing has to run on a schedule to keep it true.
 */
export type PermitState = 'scheduled' | 'active' | 'expired' | 'revoked'

/** An entry permit for one visitor, at one interior, between two moments. */
export interface Permit {
  id: string
  org_id: string
  interior_id: string
  /** Read-only. Comes from the interior, not stored on the permit. */
  interior_number: string
  location_id: string
  visitor_name: string
  purpose: PermitPurpose
  /** ISO 8601, UTC. */
  valid_from: string
  valid_to: string
  /** Shown as `A1B2-C3D4`. The QR encodes the same characters without the dash. */
  code: string
  state: PermitState
  created_by: string
  created_at: string | null
  revoked_at: string | null
  revoked_by: string | null
}

/** A person who belongs to one organization (Decision 006). */
export interface Member {
  user_id: string
  first_name: string
  last_name: string
  /** Held by Firebase, not by our database. Null when Firebase has none. */
  email: string | null
  role: OrgRole
  /**
   * Whether this person has ever signed in. An account an administrator
   * created is not access: until the person opens the email and sets a
   * password, they are locked out, and until now no screen said so.
   *
   * `null` means unknown — Firebase did not return the account. The screen
   * must not turn that into "has not entered".
   */
  has_signed_in: boolean | null
}

/** The roles an administrator may hand out. `admin` is not one of them. */
export type AssignableRole = 'responsable' | 'security'

export interface UserProfile {
  user_id: string
  email: string
  email_verified: boolean
  first_name: string
  last_name: string
  /** Ids and roles only, no names. Use orgsApi.list() for anything user-facing. */
  orgs: OrgMembership[]
  created_at: string
  last_login: string
  profile_exists?: boolean
}

// ---------------------------------------------------------------------------
// Transport
// ---------------------------------------------------------------------------

async function idToken(): Promise<string> {
  const user = auth.currentUser
  if (!user) {
    // Only reachable if a caller ran before sign-in finished. Treating it as an
    // expired session sends the person somewhere useful.
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
    // A failure that is not our documented error shape (a proxy page, a gateway
    // timeout) still has to become an ApiError rather than crash here.
    const body = await response
      .json()
      .catch((): ApiErrorBody => ({ error: 'internal_server_error' }))
    throw new ApiError(response.status, body as ApiErrorBody)
  }

  return response.json() as Promise<T>
}

/**
 * Drops every key whose value is undefined or an empty string.
 *
 * The API schemas are strict: an unknown field, or an optional string sent
 * empty, fails the whole request. Optional means omit the key entirely, not
 * send it with nothing in it.
 */
function omitBlank<T extends Record<string, unknown>>(input: T): Partial<T> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue
    if (typeof value === 'string' && value.trim() === '') continue
    out[key] = typeof value === 'string' ? value.trim() : value
  }
  return out as Partial<T>
}

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

export const authApi = {
  /**
   * Called once after Firebase reports a successful sign-in. Creates the
   * profile the first time, refreshes last_login afterwards. Names are only
   * sent at sign-up; later calls omit them.
   */
  createSession: (names?: { first_name: string; last_name: string }) =>
    request<UserProfile>('/auth/session', { method: 'POST', body: names ?? {} }),

  me: () => request<UserProfile>('/auth/me'),

  /**
   * Ends the session on the server, so a stolen refresh token cannot resume it.
   * If this fails the person is NOT logged out and must be told so.
   */
  logout: () => request<{ revoked: boolean }>('/auth/logout', { method: 'POST' }),
}

export const orgsApi = {
  /** The organizations the caller belongs to, with names, plan and usage. */
  list: () => request<{ orgs: Org[] }>('/orgs'),

  create: (input: {
    name: string
    type: OrgType
    description?: string
    city?: string
    country?: string
  }) => request<Org>('/orgs', { method: 'POST', body: omitBlank(input) }),

  get: (orgId: string) => request<Org>(`/orgs/${orgId}`),

  update: (
    orgId: string,
    input: Partial<{
      name: string
      type: OrgType
      description: string
      city: string
      country: string
    }>,
  ) => request<Org>(`/orgs/${orgId}`, { method: 'PUT', body: omitBlank(input) }),

  remove: (orgId: string) =>
    request<{ id: string; deleted: true }>(`/orgs/${orgId}`, { method: 'DELETE' }),
}

export const locationsApi = {
  list: (orgId: string) =>
    request<{ locations: Location[]; usage: { locations: number; max_locations: number } }>(
      `/orgs/${orgId}/locations`,
    ),

  create: (orgId: string, input: { name: string; description?: string; type?: LocationType }) =>
    request<Location & { usage: { locations: number } }>(`/orgs/${orgId}/locations`, {
      method: 'POST',
      body: omitBlank(input),
    }),

  update: (
    orgId: string,
    locationId: string,
    input: Partial<{
      name: string
      description: string
      type: LocationType
      enabled: boolean
    }>,
  ) =>
    request<Location>(`/orgs/${orgId}/locations/${locationId}`, {
      method: 'PUT',
      // enabled:false must survive omitBlank — it is how a location is retired.
      body: omitBlank(input),
    }),

  remove: (orgId: string, locationId: string) =>
    request<{ id: string; deleted: true }>(`/orgs/${orgId}/locations/${locationId}`, {
      method: 'DELETE',
    }),
}

export const membersApi = {
  /** Everyone in this organization. Administrators only. */
  list: (orgId: string) => request<{ members: Member[] }>(`/orgs/${orgId}/members`),

  /**
   * Adds a person, creating their Firebase account if they have none.
   *
   * The API sends no email. The caller asks Firebase to send the person a
   * "set your password" email afterwards — see `sendPasswordSetupEmail`.
   *
   * The answer is the same whether or not the account already existed, so
   * nothing here reveals which email addresses belong to Zeker users.
   */
  add: (
    orgId: string,
    input: { email: string; first_name: string; last_name: string; role: AssignableRole },
  ) => request<Member>(`/orgs/${orgId}/members`, { method: 'POST', body: omitBlank(input) }),

  /** Removes the membership. The person's account itself is left alone. */
  remove: (orgId: string, userId: string) =>
    request<{ user_id: string; removed: true }>(`/orgs/${orgId}/members/${userId}`, {
      method: 'DELETE',
    }),
}

export const interiorsApi = {
  list: (orgId: string, locationId?: string) =>
    request<{ interiors: Interior[]; usage: { interiors: number; max_interiors: number } }>(
      `/orgs/${orgId}/interiors${
        locationId ? `?location_id=${encodeURIComponent(locationId)}` : ''
      }`,
    ),

  create: (
    orgId: string,
    input: {
      location_id: string
      number: string
      name?: string
      /** Required: an interior always has a designated person (Decision 006). */
      responsable_user_id: string
    },
  ) =>
    request<Interior & { usage: { interiors: number } }>(`/orgs/${orgId}/interiors`, {
      method: 'POST',
      body: omitBlank(input),
    }),

  update: (
    orgId: string,
    interiorId: string,
    input: Partial<{
      number: string
      name: string
      /** Handing an interior over. It can be changed but never cleared. */
      responsable_user_id: string
      enabled: boolean
    }>,
  ) =>
    request<Interior>(`/orgs/${orgId}/interiors/${interiorId}`, {
      method: 'PUT',
      body: omitBlank(input),
    }),

  remove: (orgId: string, interiorId: string) =>
    request<{ id: string; deleted: true }>(`/orgs/${orgId}/interiors/${interiorId}`, {
      method: 'DELETE',
    }),
}

/**
 * Entry permits.
 *
 * An administrator sees the whole organization's permits; a person in charge
 * of an interior sees only their own. Security staff reach none of this — at a
 * gate they check a code that is handed to them.
 */
export const permitsApi = {
  list: (orgId: string, filters: { interior_id?: string; state?: PermitState } = {}) => {
    const query = new URLSearchParams()
    if (filters.interior_id) query.set('interior_id', filters.interior_id)
    if (filters.state) query.set('state', filters.state)
    const suffix = query.size > 0 ? `?${query.toString()}` : ''
    return request<{ authorizations: Permit[] }>(`/orgs/${orgId}/authorizations${suffix}`)
  },

  create: (
    orgId: string,
    input: {
      interior_id: string
      visitor_name: string
      purpose?: PermitPurpose
      /** ISO 8601. `toIsoInstant` in lib/permits.ts builds these. */
      valid_from: string
      valid_to: string
    },
  ) =>
    request<Permit>(`/orgs/${orgId}/authorizations`, { method: 'POST', body: omitBlank(input) }),

  get: (orgId: string, permitId: string) =>
    request<Permit>(`/orgs/${orgId}/authorizations/${permitId}`),

  /** Cancels it. The record is kept and marked — it is part of the audit trail. */
  revoke: (orgId: string, permitId: string) =>
    request<{ id: string; state: PermitState; revoked: true }>(
      `/orgs/${orgId}/authorizations/${permitId}`,
      { method: 'DELETE' },
    ),
}

// ---------------------------------------------------------------------------
// Checking a permit at a door
// ---------------------------------------------------------------------------

/** Why a check was refused. Mirrors `backend/src/lib/events.ts`. */
export type DenyReason =
  | 'invalid_code'
  | 'revoked'
  | 'not_started'
  | 'expired'
  | 'wrong_location'

/** What the guard is told about the visitor. Never includes the code itself. */
export interface CheckedPermit {
  id: string
  visitor_name: string
  interior_id: string
  interior_number: string
  purpose: PermitPurpose
  valid_from: string
  valid_to: string
}

/**
 * The answer to one check.
 *
 * A refusal arrives as a successful response, not as an error: "this person
 * may not enter" is a correct answer to the question the guard asked. Anything
 * that throws is a fault of ours, and the screen says so differently.
 */
export type CheckResult =
  | { result: 'allowed'; permit: CheckedPermit; event_id: string }
  | {
      result: 'denied'
      reason: DenyReason
      /** Absent when the code matched nothing — then nothing is known. */
      permit?: CheckedPermit
      /** Only for a wrong entrance: the name of the right one. */
      expected_location?: string
      event_id: string
    }

/**
 * The gate.
 *
 * Security staff and administrators only. It answers one code at a time and
 * never lists anything — a guard who could list a building's permits would
 * know who is expected where, all day.
 */
export const checksApi = {
  check: (orgId: string, input: { location_id: string; code: string }) =>
    request<CheckResult>(`/orgs/${orgId}/validate`, { method: 'POST', body: omitBlank(input) }),
}
