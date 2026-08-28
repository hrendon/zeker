import { toIso } from './users.js'
import { orgRef } from './orgs.js'

/**
 * Interiors — the units inside a location: an apartment, a warehouse bay, a
 * zone. Each has a number and a person in charge (the *responsable*), which is
 * exactly what the approved offer sells (Decision 003).
 *
 * Stored **flat under the organization**, not nested inside the location, with
 * a `location_id` field. The plan limit counts interiors across the whole
 * organization, not per location (Founder clarification, 2026-08-18), so a flat
 * collection makes that one counter and one query. Listing the interiors of a
 * single location is still a plain equality filter.
 *
 * The `responsable_user_id` link is what lets a resident sign in and issue
 * permits for their own interior (US-003). Since Decision 006 it is required:
 * an interior always has a designated person with a real account, because an
 * interior with nobody designated has nobody to issue its permits. When the
 * resident's email is not known yet, the administrator designates themselves.
 *
 * The responsable's **name is not stored here**. It comes from their account,
 * so there is one source of truth and correcting the spelling of a name
 * corrects it everywhere (Decision 006). `toInteriorResponse` takes the
 * resolved name; `displayNames` in `users.ts` resolves a whole list in one read.
 *
 * Not stored: no address, no phone, no email for the responsable. The
 * organization already knows where it is, and contacting a responsable goes
 * through their user account.
 */

export interface InteriorDocument {
  id: string
  org_id: string
  location_id: string
  /** Apartment number, bodega number, zone code. Unique within its location. */
  number: string
  /** Optional label, e.g. "Apartamento 302". */
  name: string
  /** Required since Decision 006, and a member of this organization. */
  responsable_user_id: string
  enabled: boolean
  created_by: string
  created_at?: unknown
  updated_at?: unknown
}

export function interiorsCollection(orgId: string) {
  return orgRef(orgId).collection('interiors')
}

export function interiorRef(orgId: string, interiorId: string) {
  return interiorsCollection(orgId).doc(interiorId)
}

export function newInteriorId(orgId: string): string {
  return `int_${interiorsCollection(orgId).doc().id}`
}

export interface InteriorResponse {
  id: string
  org_id: string
  location_id: string
  number: string
  name: string
  responsable_user_id: string | null
  /** Resolved from the responsable's account, not stored on the interior. */
  responsable_name: string
  enabled: boolean
  created_by: string
  created_at: string | null
  updated_at: string | null
}

export function toInteriorResponse(
  stored: Partial<InteriorDocument>,
  responsableName = '',
): InteriorResponse {
  return {
    id: String(stored.id ?? ''),
    org_id: String(stored.org_id ?? ''),
    location_id: String(stored.location_id ?? ''),
    number: String(stored.number ?? ''),
    name: String(stored.name ?? ''),
    responsable_user_id: stored.responsable_user_id ?? null,
    responsable_name: responsableName,
    enabled: stored.enabled !== false,
    created_by: String(stored.created_by ?? ''),
    created_at: toIso(stored.created_at),
    updated_at: toIso(stored.updated_at),
  }
}
