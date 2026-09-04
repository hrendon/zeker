import { db } from './firebase.js'
import { toIso } from './users.js'
import type { OrgRole } from './users.js'

/**
 * Organizations (tenants), per docs/architecture/data-model.md.
 *
 * Departures from that document, all recorded in it:
 *
 * 1. **No `admin_users` array on the organization.** Membership lives in one
 *    place only: `users/{uid}.orgs[]`. Two copies of the same fact drift apart,
 *    and nothing in the MVP needs to list an organization's members — there is
 *    no invite or member-management user story yet. When there is, it is an
 *    additive change.
 *
 * 2. **No street address and no phone number.** The data-minimization policy
 *    forbids storing a detailed address. For a residential customer the
 *    organization's street address, combined with an interior number and an
 *    authorization, would reconstruct exactly where a named person lives. City
 *    and country are kept; they are enough for language and segmentation, and
 *    nothing in the MVP uses more. The organization's phone number is likewise
 *    not stored: nothing needs it, and for a small customer it is usually the
 *    administrator's personal mobile.
 *
 * 3. **Plan limits live on the organization** (Decision 003), replacing the
 *    hardcoded "max 100 locations".
 */

/**
 * The building's own clock (Decision 016).
 *
 * An IANA timezone name, not an offset — see `lib/time.ts` for why. It is only
 * read when a permit carries a weekly schedule, so an organization that never
 * uses one never depends on this value being right.
 *
 * The default is Colombia's, which is where every customer is expected to be
 * (Decision 010). A default that is wrong for a customer in another country is
 * a real cost, and the alternative — refusing to create an organization until
 * somebody picks a timezone — puts a question in front of every new customer
 * to serve a feature most of them will not use. The field is editable, so a
 * wrong default is a correction rather than a trap.
 */
export const DEFAULT_TIMEZONE = 'America/Bogota'

/** The timezone to reason in for this organization. Never empty. */
export function timezoneOf(stored: Partial<OrgDocument> | undefined): string {
  const stated = typeof stored?.timezone === 'string' ? stored.timezone.trim() : ''
  return stated.length > 0 ? stated : DEFAULT_TIMEZONE
}

export const ORG_TYPES = ['school', 'residence', 'office', 'other'] as const
export type OrgType = (typeof ORG_TYPES)[number]

export const ORG_PLANS = ['free', 'paid_a', 'paid_b'] as const
export type OrgPlan = (typeof ORG_PLANS)[number]

export interface PlanLimits {
  max_locations: number
  /** Total across the whole organization, not per location (Decision 003). */
  max_interiors: number
}

/**
 * Free-plan limits are fixed by Decision 001. The paid tiers' numbers are not
 * decided yet — Decision 001 defers them until after customer validation — so
 * they are deliberately absent rather than invented here.
 */
export const FREE_PLAN_LIMITS: PlanLimits = { max_locations: 1, max_interiors: 10 }

export interface OrgCounts {
  locations: number
  interiors: number
}

export interface OrgDocument {
  id: string
  name: string
  type: OrgType
  description: string
  plan: OrgPlan
  limits: PlanLimits
  counts: OrgCounts
  city: string | null
  country: string | null
  /**
   * IANA timezone (Decision 016). Absent on every organization created before
   * 2026-09-04, and `timezoneOf` reads those as Colombia — which is what they
   * were, since the product has only ever been used there.
   */
  timezone?: string
  created_by: string
  created_at?: unknown
  updated_at?: unknown
  status: 'active' | 'deleted'
}

export function orgsCollection() {
  return db().collection('orgs')
}

export function orgRef(orgId: string) {
  return orgsCollection().doc(orgId)
}

/** Ids are readable on purpose: they show up in logs and support conversations. */
export function newOrgId(): string {
  return `org_${orgsCollection().doc().id}`
}

export interface OrgResponse {
  id: string
  name: string
  type: OrgType
  description: string
  plan: OrgPlan
  limits: PlanLimits
  counts: OrgCounts
  city: string | null
  country: string | null
  /** Always present in a response, even where the stored document has none. */
  timezone: string
  created_by: string
  created_at: string | null
  updated_at: string | null
  /** The caller's own role in this organization. */
  role?: OrgRole
}

export function toOrgResponse(stored: Partial<OrgDocument>, role?: OrgRole): OrgResponse {
  return {
    id: String(stored.id ?? ''),
    name: String(stored.name ?? ''),
    type: (stored.type ?? 'other') as OrgType,
    description: String(stored.description ?? ''),
    plan: (stored.plan ?? 'free') as OrgPlan,
    limits: stored.limits ?? FREE_PLAN_LIMITS,
    counts: stored.counts ?? { locations: 0, interiors: 0 },
    city: stored.city ?? null,
    country: stored.country ?? null,
    timezone: timezoneOf(stored),
    created_by: String(stored.created_by ?? ''),
    created_at: toIso(stored.created_at),
    updated_at: toIso(stored.updated_at),
    ...(role ? { role } : {}),
  }
}
