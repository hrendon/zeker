import { beforeEach, describe, expect, it, vi } from 'vitest'
import request from 'supertest'
import { FakeFirestore, FieldValue } from '../test/fakeFirestore.js'

const verifyIdToken = vi.fn()
const store = new FakeFirestore()

vi.mock('../lib/firebase.js', () => ({
  db: () => store,
  auth: () => ({ verifyIdToken, revokeRefreshTokens: vi.fn() }),
  getFirebaseApp: () => ({}),
}))

vi.mock('firebase-admin/firestore', () => ({ FieldValue }))

const { createApp } = await import('../app.js')
const { CODE_LENGTH, formatCode, isLive, newCode, normalizeCode, stateOf } = await import(
  '../lib/permits.js'
)
const app = createApp()

const ADMIN = 'user_admin'
const RESIDENT = 'user_resident'
/** In charge of a different apartment in the same building. */
const NEIGHBOUR = 'user_neighbour'
const GUARD = 'user_guard'
/** An administrator of a different organization entirely. */
const OUTSIDER = 'user_outsider'

const ORG = 'org_alpha'
const OTHER_ORG = 'org_beta'
const LOC = 'loc_torre_a'
const INT_302 = 'int_302'
const INT_401 = 'int_401'

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

/** A moment relative to now, so a permit's window is always realistic. */
const at = (offsetMs: number) => new Date(Date.now() + offsetMs).toISOString()

const PAST = '2020-01-01T00:00:00.000Z'
/** Far enough ahead that a seeded permit is live, and stays live. */
const FUTURE = '2099-01-01T00:00:00.000Z'

function signedInAs(uid: string) {
  verifyIdToken.mockResolvedValueOnce({ uid, email: `${uid}@example.com`, email_verified: true })
}

function seedOrg(orgId: string) {
  store.seed(`orgs/${orgId}`, {
    id: orgId,
    name: 'Conjunto Los Cedros',
    type: 'residence',
    plan: 'free',
    limits: { max_locations: 1, max_interiors: 10 },
    counts: { locations: 1, interiors: 2 },
    status: 'active',
  })
}

function seedMember(uid: string, orgId: string, role: string, name = 'María García') {
  const existing = (store.docs.get(`users/${uid}`)?.orgs as unknown[]) ?? []
  const [firstName, ...rest] = name.split(' ')
  store.seed(`users/${uid}`, {
    id: uid,
    deleted: false,
    first_name: firstName,
    last_name: rest.join(' '),
    orgs: [...existing, { org_id: orgId, role }],
  })
}

function seedInterior(orgId: string, interiorId: string, number: string, responsable: string) {
  store.seed(`orgs/${orgId}/interiors/${interiorId}`, {
    id: interiorId,
    org_id: orgId,
    location_id: LOC,
    number,
    name: '',
    responsable_user_id: responsable,
    enabled: true,
    created_by: ADMIN,
  })
}

function seedPermit(orgId: string, permitId: string, extra: Record<string, unknown> = {}) {
  store.seed(`orgs/${orgId}/authorizations/${permitId}`, {
    id: permitId,
    org_id: orgId,
    interior_id: INT_302,
    location_id: LOC,
    visitor_name: 'Ana Ruiz',
    purpose: 'visitor',
    valid_from: '2026-01-01T00:00:00.000Z',
    valid_to: FUTURE,
    code: 'A1B2C3D4',
    status: 'active',
    created_by: RESIDENT,
    revoked_at: null,
    revoked_by: null,
    ...extra,
  })
}

const NEW_PERMIT = {
  interior_id: INT_302,
  visitor_name: 'Ana Ruiz',
  valid_from: at(-HOUR),
  valid_to: at(7 * DAY),
}

function permit(orgId: string, permitId: string): Record<string, unknown> | undefined {
  return store.docs.get(`orgs/${orgId}/authorizations/${permitId}`)
}

beforeEach(() => {
  store.reset()
  vi.clearAllMocks()
  seedOrg(ORG)
  seedOrg(OTHER_ORG)
  seedMember(ADMIN, ORG, 'admin', 'Carlos Admin')
  seedMember(RESIDENT, ORG, 'responsable', 'María García')
  seedMember(NEIGHBOUR, ORG, 'responsable', 'Jorge Neighbour')
  seedMember(GUARD, ORG, 'security', 'Luis Guard')
  seedMember(OUTSIDER, OTHER_ORG, 'admin', 'Eva Outsider')
  seedInterior(ORG, INT_302, '302', RESIDENT)
  seedInterior(ORG, INT_401, '401', NEIGHBOUR)
})

// ---------------------------------------------------------------------------
// The code — this is what opens a door, so it gets its own tests
// ---------------------------------------------------------------------------

describe('permit codes', () => {
  it('is eight characters from an alphabet with no confusable letters', () => {
    for (let i = 0; i < 200; i += 1) {
      const code = newCode()
      expect(code).toHaveLength(CODE_LENGTH)
      expect(code).toMatch(/^[0-9ABCDEFGHJKMNPQRSTVWXYZ]{8}$/)
      // I, L, O and U are what a guard misreads in bad light.
      expect(code).not.toMatch(/[ILOU]/)
    }
  })

  it('does not repeat itself', () => {
    const seen = new Set(Array.from({ length: 500 }, () => newCode()))
    expect(seen.size).toBe(500)
  })

  it('shows as two groups of four, easier to read back over a phone', () => {
    expect(formatCode('A1B2C3D4')).toBe('A1B2-C3D4')
  })

  it('accepts what a guard actually types, including the confusable letters', () => {
    // A guard reading "0" as "O" must still get in — they are holding a valid
    // code, and refusing it would send a real visitor away.
    expect(normalizeCode('a1b2-c3d4')).toBe('A1B2C3D4')
    expect(normalizeCode('A1B2 C3D4')).toBe('A1B2C3D4')
    expect(normalizeCode('O1B2C3D4')).toBe('01B2C3D4')
    expect(normalizeCode('I1B2C3D4')).toBe('11B2C3D4')
    expect(normalizeCode('L1B2C3D4')).toBe('11B2C3D4')
    expect(normalizeCode('U1B2C3D4')).toBe('V1B2C3D4')
  })
})

describe('permit state', () => {
  const window = { valid_from: '2026-01-01T00:00:00.000Z', valid_to: '2026-01-31T00:00:00.000Z' }

  it('is scheduled before it starts', () => {
    expect(stateOf({ ...window, status: 'active' }, new Date('2025-12-31T00:00:00Z'))).toBe(
      'scheduled',
    )
  })

  it('is active inside the window', () => {
    expect(stateOf({ ...window, status: 'active' }, new Date('2026-01-15T00:00:00Z'))).toBe('active')
  })

  it('is expired after it ends, without anything having to mark it', () => {
    expect(stateOf({ ...window, status: 'active' }, new Date('2026-02-01T00:00:00Z'))).toBe(
      'expired',
    )
  })

  it('is revoked regardless of the dates', () => {
    expect(stateOf({ ...window, status: 'revoked' }, new Date('2026-01-15T00:00:00Z'))).toBe(
      'revoked',
    )
  })

  it('counts as live only while it could still let somebody in', () => {
    expect(isLive({ status: 'active', valid_to: FUTURE })).toBe(true)
    expect(isLive({ status: 'active', valid_to: PAST })).toBe(false)
    expect(isLive({ status: 'revoked', valid_to: FUTURE })).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// POST
// ---------------------------------------------------------------------------

describe('POST /orgs/{orgId}/authorizations', () => {
  it('rejects a caller with no Firebase token', async () => {
    const res = await request(app).post(`/orgs/${ORG}/authorizations`).send(NEW_PERMIT)

    expect(res.status).toBe(401)
    expect(store.writes).toHaveLength(0)
  })

  it('lets the person in charge of an interior issue a permit for it', async () => {
    signedInAs(RESIDENT)

    const res = await request(app)
      .post(`/orgs/${ORG}/authorizations`)
      .set('Authorization', 'Bearer good')
      .send(NEW_PERMIT)

    expect(res.status).toBe(201)
    expect(res.body.visitor_name).toBe('Ana Ruiz')
    expect(res.body.interior_id).toBe(INT_302)
    expect(res.body.interior_number).toBe('302')
    // Copied from the interior, so the door check is one read, not two.
    expect(res.body.location_id).toBe(LOC)
    expect(res.body.purpose).toBe('visitor')
    expect(res.body.state).toBe('active')
    expect(res.body.code).toMatch(/^[0-9A-Z]{4}-[0-9A-Z]{4}$/)
  })

  it('never derives the code from the permit id', async () => {
    signedInAs(RESIDENT)

    const res = await request(app)
      .post(`/orgs/${ORG}/authorizations`)
      .set('Authorization', 'Bearer good')
      .send(NEW_PERMIT)

    const stored = permit(ORG, res.body.id)!
    const idCharacters = String(res.body.id).toUpperCase().replace(/[^0-9A-Z]/g, '')

    expect(String(stored.code)).toHaveLength(CODE_LENGTH)
    expect(idCharacters).not.toContain(String(stored.code))
  })

  it('lets an administrator issue a permit for any interior', async () => {
    signedInAs(ADMIN)

    const res = await request(app)
      .post(`/orgs/${ORG}/authorizations`)
      .set('Authorization', 'Bearer good')
      .send({ ...NEW_PERMIT, interior_id: INT_401 })

    expect(res.status).toBe(201)
    expect(res.body.interior_number).toBe('401')
  })

  it("refuses a responsable issuing for somebody else's interior", async () => {
    signedInAs(RESIDENT)

    const res = await request(app)
      .post(`/orgs/${ORG}/authorizations`)
      .set('Authorization', 'Bearer good')
      .send({ ...NEW_PERMIT, interior_id: INT_401 })

    expect(res.status).toBe(403)
    expect(store.writes).toHaveLength(0)
  })

  it('refuses security staff — a guard checks permits, and does not issue them', async () => {
    signedInAs(GUARD)

    const res = await request(app)
      .post(`/orgs/${ORG}/authorizations`)
      .set('Authorization', 'Bearer good')
      .send(NEW_PERMIT)

    expect(res.status).toBe(403)
    expect(store.writes).toHaveLength(0)
  })

  it('refuses an unknown interior', async () => {
    signedInAs(ADMIN)

    const res = await request(app)
      .post(`/orgs/${ORG}/authorizations`)
      .set('Authorization', 'Bearer good')
      .send({ ...NEW_PERMIT, interior_id: 'int_nope' })

    expect(res.status).toBe(404)
    expect(store.writes).toHaveLength(0)
  })

  it('refuses a permit that ends before it starts', async () => {
    signedInAs(ADMIN)

    const res = await request(app)
      .post(`/orgs/${ORG}/authorizations`)
      .set('Authorization', 'Bearer good')
      .send({ ...NEW_PERMIT, valid_from: at(7 * DAY), valid_to: at(DAY) })

    expect(res.status).toBe(400)
    expect(store.writes).toHaveLength(0)
  })

  it('refuses a permit that is already over', async () => {
    signedInAs(ADMIN)

    const res = await request(app)
      .post(`/orgs/${ORG}/authorizations`)
      .set('Authorization', 'Bearer good')
      .send({ ...NEW_PERMIT, valid_from: at(-10 * DAY), valid_to: at(-DAY) })

    expect(res.status).toBe(400)
    expect(store.writes).toHaveLength(0)
  })

  it('refuses a permit longer than a year, so a mistyped date cannot open a door for a century', async () => {
    signedInAs(ADMIN)

    const res = await request(app)
      .post(`/orgs/${ORG}/authorizations`)
      .set('Authorization', 'Bearer good')
      .send({ ...NEW_PERMIT, valid_from: at(-HOUR), valid_to: at(400 * DAY) })

    expect(res.status).toBe(400)
    expect(store.writes).toHaveLength(0)
  })

  it('refuses dates that are not dates', async () => {
    signedInAs(ADMIN)

    const res = await request(app)
      .post(`/orgs/${ORG}/authorizations`)
      .set('Authorization', 'Bearer good')
      .send({ ...NEW_PERMIT, valid_to: 'mañana' })

    expect(res.status).toBe(400)
    expect(store.writes).toHaveLength(0)
  })

  it('refuses a field it does not know — an identity document must not slip in', async () => {
    signedInAs(ADMIN)

    const res = await request(app)
      .post(`/orgs/${ORG}/authorizations`)
      .set('Authorization', 'Bearer good')
      .send({ ...NEW_PERMIT, document_number: '1020304050' })

    expect(res.status).toBe(400)
    expect(store.writes).toHaveLength(0)
  })

  it('stores nothing about the visitor except their name', async () => {
    signedInAs(RESIDENT)

    const res = await request(app)
      .post(`/orgs/${ORG}/authorizations`)
      .set('Authorization', 'Bearer good')
      .send(NEW_PERMIT)

    const stored = permit(ORG, res.body.id)!
    // Every field is listed on purpose. This test is here to fail the day
    // somebody adds a phone number, a document, or a free-text note — so it
    // has to be updated deliberately, never loosened.
    expect(Object.keys(stored).sort()).toEqual(
      [
        'code',
        'created_at',
        'created_by',
        // Decision 014: how the permit may be used, and what use it has had.
        // About the permit, not about the person carrying it.
        'entry_mode',
        'entry_count',
        'first_entry_at',
        'last_entry_at',
        'id',
        'interior_id',
        'location_id',
        'org_id',
        'purpose',
        'revoked_at',
        'revoked_by',
        'status',
        'valid_from',
        'valid_to',
        'visitor_name',
      ].sort(),
    )
  })

  it('does not let another organization issue a permit here', async () => {
    signedInAs(OUTSIDER)

    const res = await request(app)
      .post(`/orgs/${ORG}/authorizations`)
      .set('Authorization', 'Bearer good')
      .send(NEW_PERMIT)

    // 404, not 403 — a stranger must not learn that this organization exists.
    expect(res.status).toBe(404)
    expect(store.writes).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// GET (list)
// ---------------------------------------------------------------------------

describe('GET /orgs/{orgId}/authorizations', () => {
  beforeEach(() => {
    seedPermit(ORG, 'auth_1', { interior_id: INT_302, valid_to: FUTURE })
    seedPermit(ORG, 'auth_2', { interior_id: INT_401, code: 'E5F6G7H8' })
    seedPermit(ORG, 'auth_3', { interior_id: INT_302, code: 'J9K0M1N2', status: 'revoked' })
  })

  it('shows an administrator every permit in the organization', async () => {
    signedInAs(ADMIN)

    const res = await request(app)
      .get(`/orgs/${ORG}/authorizations`)
      .set('Authorization', 'Bearer good')

    expect(res.status).toBe(200)
    expect(res.body.authorizations).toHaveLength(3)
  })

  it('shows a responsable only the permits of their own interior', async () => {
    signedInAs(RESIDENT)

    const res = await request(app)
      .get(`/orgs/${ORG}/authorizations`)
      .set('Authorization', 'Bearer good')

    expect(res.status).toBe(200)
    expect(res.body.authorizations).toHaveLength(2)
    expect(
      res.body.authorizations.every((row: { interior_id: string }) => row.interior_id === INT_302),
    ).toBe(true)
  })

  it('puts what is usable now at the top', async () => {
    signedInAs(ADMIN)

    const res = await request(app)
      .get(`/orgs/${ORG}/authorizations`)
      .set('Authorization', 'Bearer good')

    expect(res.body.authorizations[0].state).toBe('active')
    expect(res.body.authorizations.at(-1).state).toBe('revoked')
  })

  it('filters by what a permit is right now', async () => {
    signedInAs(ADMIN)

    const res = await request(app)
      .get(`/orgs/${ORG}/authorizations?state=revoked`)
      .set('Authorization', 'Bearer good')

    expect(res.body.authorizations).toHaveLength(1)
    expect(res.body.authorizations[0].id).toBe('auth_3')
  })

  it('refuses a state it does not recognise rather than quietly ignoring it', async () => {
    signedInAs(ADMIN)

    const res = await request(app)
      .get(`/orgs/${ORG}/authorizations?state=whatever`)
      .set('Authorization', 'Bearer good')

    expect(res.status).toBe(400)
  })

  it("refuses a responsable asking for another interior's permits", async () => {
    signedInAs(RESIDENT)

    const res = await request(app)
      .get(`/orgs/${ORG}/authorizations?interior_id=${INT_401}`)
      .set('Authorization', 'Bearer good')

    expect(res.status).toBe(403)
  })

  it('refuses security staff — a guard would otherwise see who is expected, all day', async () => {
    signedInAs(GUARD)

    const res = await request(app)
      .get(`/orgs/${ORG}/authorizations`)
      .set('Authorization', 'Bearer good')

    expect(res.status).toBe(403)
  })

  it('does not show another organization these permits', async () => {
    signedInAs(OUTSIDER)

    const res = await request(app)
      .get(`/orgs/${ORG}/authorizations`)
      .set('Authorization', 'Bearer good')

    expect(res.status).toBe(404)
    expect(res.body.authorizations).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// GET (one)
// ---------------------------------------------------------------------------

describe('GET /orgs/{orgId}/authorizations/{permitId}', () => {
  beforeEach(() => {
    seedPermit(ORG, 'auth_1')
  })

  it('shows the permit, with the code formatted for reading aloud', async () => {
    signedInAs(RESIDENT)

    const res = await request(app)
      .get(`/orgs/${ORG}/authorizations/auth_1`)
      .set('Authorization', 'Bearer good')

    expect(res.status).toBe(200)
    expect(res.body.code).toBe('A1B2-C3D4')
    expect(res.body.interior_number).toBe('302')
    expect(res.body.state).toBe('active')
  })

  it("refuses a responsable looking at another interior's permit", async () => {
    signedInAs(NEIGHBOUR)

    const res = await request(app)
      .get(`/orgs/${ORG}/authorizations/auth_1`)
      .set('Authorization', 'Bearer good')

    expect(res.status).toBe(403)
  })

  it('answers 404 for a permit that does not exist', async () => {
    signedInAs(ADMIN)

    const res = await request(app)
      .get(`/orgs/${ORG}/authorizations/auth_nope`)
      .set('Authorization', 'Bearer good')

    expect(res.status).toBe(404)
  })

  it('does not show this permit to another organization', async () => {
    signedInAs(OUTSIDER)

    const res = await request(app)
      .get(`/orgs/${ORG}/authorizations/auth_1`)
      .set('Authorization', 'Bearer good')

    expect(res.status).toBe(404)
    expect(res.body.code).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// DELETE (revoke)
// ---------------------------------------------------------------------------

describe('DELETE /orgs/{orgId}/authorizations/{permitId}', () => {
  beforeEach(() => {
    seedPermit(ORG, 'auth_1')
  })

  it('revokes the permit and keeps the record', async () => {
    signedInAs(RESIDENT)

    const res = await request(app)
      .delete(`/orgs/${ORG}/authorizations/auth_1`)
      .set('Authorization', 'Bearer good')

    expect(res.status).toBe(200)
    expect(res.body.state).toBe('revoked')

    const stored = permit(ORG, 'auth_1')!
    // Kept, not erased: a permit that once opened a door is the audit trail.
    expect(stored.status).toBe('revoked')
    expect(stored.revoked_by).toBe(RESIDENT)
    expect(stored.revoked_at).toBeTruthy()
  })

  it('lets an administrator revoke a permit they did not issue', async () => {
    signedInAs(ADMIN)

    const res = await request(app)
      .delete(`/orgs/${ORG}/authorizations/auth_1`)
      .set('Authorization', 'Bearer good')

    expect(res.status).toBe(200)
    expect(permit(ORG, 'auth_1')?.status).toBe('revoked')
  })

  it('succeeds without changing anything when it is already revoked', async () => {
    seedPermit(ORG, 'auth_1', { status: 'revoked', revoked_by: ADMIN })
    signedInAs(RESIDENT)

    const res = await request(app)
      .delete(`/orgs/${ORG}/authorizations/auth_1`)
      .set('Authorization', 'Bearer good')

    expect(res.status).toBe(200)
    // Pressing the button twice must not rewrite who revoked it.
    expect(permit(ORG, 'auth_1')?.revoked_by).toBe(ADMIN)
    expect(store.writes).toHaveLength(0)
  })

  it("refuses a responsable revoking another interior's permit", async () => {
    signedInAs(NEIGHBOUR)

    const res = await request(app)
      .delete(`/orgs/${ORG}/authorizations/auth_1`)
      .set('Authorization', 'Bearer good')

    expect(res.status).toBe(403)
    expect(permit(ORG, 'auth_1')?.status).toBe('active')
  })

  it('refuses security staff', async () => {
    signedInAs(GUARD)

    const res = await request(app)
      .delete(`/orgs/${ORG}/authorizations/auth_1`)
      .set('Authorization', 'Bearer good')

    expect(res.status).toBe(403)
    expect(permit(ORG, 'auth_1')?.status).toBe('active')
  })

  it('does not let another organization revoke this permit', async () => {
    signedInAs(OUTSIDER)

    const res = await request(app)
      .delete(`/orgs/${ORG}/authorizations/auth_1`)
      .set('Authorization', 'Bearer good')

    expect(res.status).toBe(404)
    expect(permit(ORG, 'auth_1')?.status).toBe('active')
  })
})

describe('one entry or many (Decision 014)', () => {
  it('issues a permit for one entry unless the caller says otherwise', async () => {
    // A permit is for a visit. Free entries are a deliberate choice, not what
    // somebody gets by not reading the question.
    signedInAs(RESIDENT)

    const res = await request(app)
      .post(`/orgs/${ORG}/authorizations`)
      .set('Authorization', 'Bearer good')
      .send(NEW_PERMIT)

    expect(res.status).toBe(201)
    expect(res.body.entry_mode).toBe('single')
    expect(res.body.entry_count).toBe(0)
    expect(res.body.last_entry_at).toBeNull()
    expect(permit(ORG, res.body.id)!.entry_mode).toBe('single')
  })

  it('issues a permit for free entries when asked', async () => {
    signedInAs(RESIDENT)

    const res = await request(app)
      .post(`/orgs/${ORG}/authorizations`)
      .set('Authorization', 'Bearer good')
      .send({ ...NEW_PERMIT, entry_mode: 'multiple' })

    expect(res.status).toBe(201)
    expect(res.body.entry_mode).toBe('multiple')
  })

  it('refuses anything that is not one of the two kinds', async () => {
    signedInAs(RESIDENT)

    const res = await request(app)
      .post(`/orgs/${ORG}/authorizations`)
      .set('Authorization', 'Bearer good')
      .send({ ...NEW_PERMIT, entry_mode: 'unlimited' })

    expect(res.status).toBe(400)
  })
})

