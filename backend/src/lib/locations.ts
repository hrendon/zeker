import { toIso } from './users.js'
import { orgRef } from './orgs.js'

/**
 * Locations — the physical sites of an organization (a building, a campus, a
 * gated entrance), per docs/architecture/data-model.md.
 *
 * Departures from that document, both recorded in it:
 *
 * 1. **No `metadata.security_personnel`.** It named a staff member as "the
 *    person typically staffing this location". Nothing in the MVP reads it, and
 *    storing a named employee we have no use for is exactly what the
 *    data-minimization policy exists to prevent.
 *
 * 2. **No `metadata.floor` / `metadata.building`.** Nothing uses them. A
 *    location that needs to say which building it is in can say so in its name
 *    or description. Interiors (Decision 003) are the real answer to "which
 *    part of the site", and they arrive with their own number.
 *
 * How many locations an organization may have comes from its plan
 * (`orgs/{orgId}.limits.max_locations`), not from a constant — Decision 003.
 */

export const LOCATION_TYPES = ['entrance', 'reception', 'classroom', 'zone', 'other'] as const
export type LocationType = (typeof LOCATION_TYPES)[number]

export interface LocationDocument {
  id: string
  org_id: string
  name: string
  description: string
  type: LocationType
  /** Lets an admin take a location out of use without losing its history. */
  enabled: boolean
  created_by: string
  created_at?: unknown
  updated_at?: unknown
}

export function locationsCollection(orgId: string) {
  return orgRef(orgId).collection('locations')
}

export function locationRef(orgId: string, locationId: string) {
  return locationsCollection(orgId).doc(locationId)
}

export function newLocationId(orgId: string): string {
  return `loc_${locationsCollection(orgId).doc().id}`
}

export interface LocationResponse {
  id: string
  org_id: string
  name: string
  description: string
  type: LocationType
  enabled: boolean
  created_by: string
  created_at: string | null
  updated_at: string | null
}

export function toLocationResponse(stored: Partial<LocationDocument>): LocationResponse {
  return {
    id: String(stored.id ?? ''),
    org_id: String(stored.org_id ?? ''),
    name: String(stored.name ?? ''),
    description: String(stored.description ?? ''),
    type: (stored.type ?? 'other') as LocationType,
    enabled: stored.enabled !== false,
    created_by: String(stored.created_by ?? ''),
    created_at: toIso(stored.created_at),
    updated_at: toIso(stored.updated_at),
  }
}
