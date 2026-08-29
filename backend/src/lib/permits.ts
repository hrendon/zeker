import { randomInt } from 'node:crypto'
import { toIso } from './users.js'
import { orgRef } from './orgs.js'

/**
 * Entry permits — the thing the product exists to issue.
 *
 * A permit says: this named visitor may enter this interior between these two
 * moments. It carries a code, and that code is what opens the door.
 *
 * Stored in `orgs/{orgId}/authorizations`, the collection name the rest of the
 * codebase already guards against (organizations, locations and interiors all
 * refuse to be deleted while a permit is still live).
 *
 * Five deliberate departures from the original design in
 * `docs/architecture/{api,data-model}.md`, which was written before Decisions
 * 003, 005 and 006. Each is recorded there too:
 *
 * 1. **A permit points at an interior, not a location** (Decision 003). The
 *    `location_id` is copied from the interior at creation — safe to
 *    denormalize because an interior's location can never change, by design —
 *    so a guard standing at one entrance can be checked against it in a single
 *    read.
 *
 * 2. **The code is random, never derived from the permit's id.** The original
 *    draft showed `auth_p1k2p9m` becoming `P1K2-P9M7`. That code alone admits
 *    someone through a door, so anything predictable from a visible id is a
 *    way in. See `newCode()`.
 *
 * 3. **The QR image is not stored.** It encodes the code and nothing else, so
 *    the browser draws it from the code. Keeping a base64 PNG on every permit
 *    would store a picture of data we already hold, and multiply the size of
 *    each record for nothing.
 *
 * 4. **"Expired" is computed, never stored.** Stored `status` is only
 *    `active` or `revoked`. Nothing runs on a schedule to mark permits
 *    expired, so a stored "expired" would never arrive — and the three delete
 *    guards, which look for live permits, would refuse forever because of a
 *    permit that ended last year. `stateOf()` derives it from the dates.
 *
 * 5. **No identity-document fields, not even empty ones**, and no free-text
 *    note. A permit holds the visitor's name, where they are going and when.
 *    A field that exists is a field somebody eventually fills in with a
 *    cédula number (`docs/security/data-minimization.md`).
 *
 * `valid_from` and `valid_to` are stored as **ISO 8601 strings in UTC**, not
 * Firestore timestamps. In UTC that form sorts lexicographically exactly as it
 * sorts chronologically, so range queries work on it directly, and the value
 * carries its own timezone rather than depending on how a reader converts it.
 * `created_at` and `revoked_at` are ordinary server timestamps, like every
 * other record's — they record when something happened here, rather than a
 * moment the user chose.
 */

export const PERMIT_PURPOSES = ['visitor', 'pickup', 'provider', 'employee', 'other'] as const
export type PermitPurpose = (typeof PERMIT_PURPOSES)[number]

/** Stored status. Expiry is not one of these — see `stateOf`. */
export type PermitStatus = 'active' | 'revoked'

/** What a permit looks like to a person, worked out at read time. */
export type PermitState = 'scheduled' | 'active' | 'expired' | 'revoked'

/** The longest a single permit may run. A permit is for a visit, not a tenancy. */
export const MAX_PERMIT_DAYS = 365

export interface PermitDocument {
  id: string
  org_id: string
  interior_id: string
  /** Copied from the interior. An interior's location cannot change. */
  location_id: string
  visitor_name: string
  purpose: PermitPurpose
  /** ISO 8601, UTC. */
  valid_from: string
  /** ISO 8601, UTC. Range-queried by the delete guards. */
  valid_to: string
  /** Uppercase, no separator. Unique within the organization. */
  code: string
  status: PermitStatus
  created_by: string
  created_at?: unknown
  revoked_at?: unknown
  revoked_by?: string | null
}

export function permitsCollection(orgId: string) {
  return orgRef(orgId).collection('authorizations')
}

export function permitRef(orgId: string, permitId: string) {
  return permitsCollection(orgId).doc(permitId)
}

export function newPermitId(orgId: string): string {
  return `auth_${permitsCollection(orgId).doc().id}`
}

// ---------------------------------------------------------------------------
// The code
// ---------------------------------------------------------------------------

/**
 * 32 characters, chosen so a guard reading a code aloud in bad light cannot
 * produce a different one: no I, L, O or U (confused with 1, 1, 0 and V).
 */
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

/** Eight characters from that alphabet — about 1.1 × 10¹² possibilities. */
export const CODE_LENGTH = 8

/**
 * A fresh code, from the system's cryptographic random source.
 *
 * `randomInt` is used rather than reducing a random byte modulo 32, which
 * would make some characters likelier than others and quietly shrink the
 * space this code's safety rests on.
 */
export function newCode(): string {
  let code = ''
  for (let i = 0; i < CODE_LENGTH; i += 1) code += ALPHABET[randomInt(ALPHABET.length)]
  return code
}

/** How a code is shown to people: `A1B2-C3D4`. Easier to read back over a phone. */
export function formatCode(code: string): string {
  return `${code.slice(0, 4)}-${code.slice(4)}`
}

/**
 * Turns whatever a guard typed into the stored form.
 *
 * Separators and spaces are dropped, and the four characters the alphabet
 * leaves out are folded onto the ones they are mistaken for — so a guard who
 * types "O" where the code has a zero still gets in, instead of being told the
 * code is invalid while holding a valid one.
 */
export function normalizeCode(input: string): string {
  return input
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, '')
    .replace(/[IL]/g, '1')
    .replace(/O/g, '0')
    .replace(/U/g, 'V')
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

/**
 * What a permit is right now. Revocation wins over everything; after that it
 * is simply where `at` falls relative to the two dates.
 */
export function stateOf(
  stored: Pick<PermitDocument, 'valid_from' | 'valid_to'> & { status?: PermitStatus },
  at: Date = new Date(),
): PermitState {
  if (stored.status === 'revoked') return 'revoked'

  const now = at.toISOString()
  if (now < String(stored.valid_from)) return 'scheduled'
  if (now > String(stored.valid_to)) return 'expired'
  return 'active'
}

/** A permit that could still let somebody in: not revoked, and not yet over. */
export function isLive(stored: Partial<PermitDocument>, at: Date = new Date()): boolean {
  if (stored.status !== 'active') return false
  return at.toISOString() <= String(stored.valid_to)
}

// ---------------------------------------------------------------------------
// Delete guards
// ---------------------------------------------------------------------------

/**
 * Is any permit still live under this organization, location or interior?
 *
 * Used by the three delete routes, so a permit can never be left pointing at
 * something that no longer exists. The range on `valid_to` is what keeps an
 * old, finished permit from blocking a deletion forever — the reason expiry is
 * computed rather than stored. It needs the composite indexes declared in
 * `firestore.indexes.json`.
 */
export async function hasLivePermit(
  orgId: string,
  scope: { location_id?: string; interior_id?: string } = {},
  at: Date = new Date(),
): Promise<boolean> {
  let query = permitsCollection(orgId).where('status', '==', 'active')

  if (scope.interior_id) query = query.where('interior_id', '==', scope.interior_id)
  else if (scope.location_id) query = query.where('location_id', '==', scope.location_id)

  const snapshot = await query.where('valid_to', '>', at.toISOString()).limit(1).get()
  return !snapshot.empty
}

// ---------------------------------------------------------------------------
// Response
// ---------------------------------------------------------------------------

export interface PermitResponse {
  id: string
  org_id: string
  interior_id: string
  /** Resolved from the interior, not stored on the permit. Empty if it is gone. */
  interior_number: string
  location_id: string
  visitor_name: string
  purpose: PermitPurpose
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

export function toPermitResponse(
  stored: Partial<PermitDocument>,
  interiorNumber = '',
  at: Date = new Date(),
): PermitResponse {
  const code = String(stored.code ?? '')

  return {
    id: String(stored.id ?? ''),
    org_id: String(stored.org_id ?? ''),
    interior_id: String(stored.interior_id ?? ''),
    interior_number: interiorNumber,
    location_id: String(stored.location_id ?? ''),
    visitor_name: String(stored.visitor_name ?? ''),
    purpose: (stored.purpose ?? 'visitor') as PermitPurpose,
    valid_from: String(stored.valid_from ?? ''),
    valid_to: String(stored.valid_to ?? ''),
    code: code.length === CODE_LENGTH ? formatCode(code) : code,
    state: stateOf(
      {
        valid_from: String(stored.valid_from ?? ''),
        valid_to: String(stored.valid_to ?? ''),
        status: stored.status,
      },
      at,
    ),
    created_by: String(stored.created_by ?? ''),
    created_at: toIso(stored.created_at),
    revoked_at: toIso(stored.revoked_at),
    revoked_by: stored.revoked_by ?? null,
  }
}
