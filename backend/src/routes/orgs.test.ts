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
const app = createApp()

const ALICE = 'user_alice'
const BOB = 'user_bob'

function signedInAs(uid: string) {
  verifyIdToken.mockResolvedValueOnce({ uid, email: `${uid}@example.com`, email_verified: true })
}

function org(orgId: string) {
  return store.docs.get(`orgs/${orgId}`)
}

function user(uid: string) {
  return store.docs.get(`users/${uid}`)
}

function orgCount(): number {
  return [...store.docs.keys()].filter((path) => /^orgs\/[^/]+$/.test(path)).length
}

/** Puts an existing organization and its admin in place without going through the API. */
function seedOrg(orgId: string, adminUid: string, extra: Record<string, unknown> = {}): void {
  store.seed(`orgs/${orgId}`, {
    id: orgId,
    name: 'Colegio Bilingüe X',
    type: 'school',
    description: '',
    plan: 'free',
    limits: { max_locations: 1, max_interiors: 10 },
    counts: { locations: 0, interiors: 0 },
    city: null,
    country: null,
    created_by: adminUid,
    status: 'active',
    ...extra,
  })
  const existing = (user(adminUid)?.orgs as unknown[]) ?? []
  store.seed(`users/${adminUid}`, {
    id: adminUid,
    deleted: false,
    orgs: [...existing, { org_id: orgId, role: 'admin' }],
  })
}

beforeEach(() => {
  store.reset()
  vi.clearAllMocks()
})

describe('POST /orgs', () => {
  it('rejects a caller with no Firebase token', async () => {
    const res = await request(app).post('/orgs').send({ name: 'X', type: 'school' })

    expect(res.status).toBe(401)
    expect(store.writes).toHaveLength(0)
  })

  it('creates the organization and makes the caller its admin', async () => {
    signedInAs(ALICE)

    const res = await request(app)
      .post('/orgs')
      .set('Authorization', 'Bearer good')
      .send({
        name: 'Colegio Bilingüe X',
        type: 'school',
        city: 'Bogotá',
        country: 'co',
        tax_id: '901.234.567-8',
      })

    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({
      name: 'Colegio Bilingüe X',
      type: 'school',
      city: 'Bogotá',
      country: 'CO',
      // Decision 019. Stored as digits: one building is one number, not three
      // spellings of it.
      tax_id: '9012345678',
      created_by: ALICE,
      role: 'admin',
    })
    expect(res.body.id).toMatch(/^org_/)
    // Internal bookkeeping is not part of the API contract.
    expect(res.body).not.toHaveProperty('status')

    // The membership was written together with the organization.
    expect(user(ALICE)?.orgs).toEqual([{ org_id: res.body.id, role: 'admin' }])
  })

  it('starts every organization on the free plan limits', async () => {
    signedInAs(ALICE)

    const res = await request(app)
      .post('/orgs')
      .set('Authorization', 'Bearer good')
      .send({ name: 'Unidad Residencial Y', type: 'residence', tax_id: '901234567' })

    expect(res.body.plan).toBe('free')
    expect(res.body.limits).toEqual({
      max_locations: 1,
      max_interiors: 10,
      // R-02, added 2026-09-04. A plan limit an administrator would recognise,
      // and a daily one that exists because adding a person makes Google send
      // an email with our name on it.
      max_members: 25,
      max_invites_per_day: 15,
      // Decision 011's third precondition, added 2026-09-04. Permits are the
      // record that actually accumulates.
      max_permits_per_day: 50,
    })
    expect(res.body.counts).toEqual({ locations: 0, interiors: 0 })
  })

  // Decision 019 — the building's NIT.
  it('refuses to create a building with no NIT', async () => {
    signedInAs(ALICE)

    const res = await request(app)
      .post('/orgs')
      .set('Authorization', 'Bearer good')
      .send({ name: 'Conjunto Sin NIT', type: 'residence' })

    expect(res.status).toBe(400)
    // Nothing was written: a refused creation must not leave an organization
    // that nobody can see and nobody approved.
    expect(store.writes).toHaveLength(0)
  })

  it('stores the same building as one number however it was typed', async () => {
    for (const typed of ['901.234.567-8', '901234567-8', '901 234 567 8']) {
      signedInAs(ALICE)
      const res = await request(app)
        .post('/orgs')
        .set('Authorization', 'Bearer good')
        .send({ name: 'Conjunto X', type: 'residence', tax_id: typed })

      expect(res.status).toBe(201)
      expect(res.body.tax_id).toBe('9012345678')
    }
  })

  it('refuses something that is not a NIT', async () => {
    for (const typed of ['', 'no tengo', '123', '9012345678901234']) {
      signedInAs(ALICE)
      const res = await request(app)
        .post('/orgs')
        .set('Authorization', 'Bearer good')
        .send({ name: 'Conjunto X', type: 'residence', tax_id: typed })

      expect(res.status).toBe(400)
    }
  })

  it('reads an organization created before the NIT was asked for', async () => {
    // The Founder's own buildings are in this state, and they must keep working.
    signedInAs(ALICE)
    const created = await request(app)
      .post('/orgs')
      .set('Authorization', 'Bearer good')
      .send({ name: 'Conjunto Viejo', type: 'residence', tax_id: '901234567' })

    const orgId = created.body.id as string
    delete store.docs.get(`orgs/${orgId}`)!.tax_id

    signedInAs(ALICE)
    const res = await request(app).get(`/orgs/${orgId}`).set('Authorization', 'Bearer good')

    expect(res.status).toBe(200)
    expect(res.body.tax_id).toBeNull()
  })

  it('never stores a street address', async () => {
    signedInAs(ALICE)

    const res = await request(app)
      .post('/orgs')
      .set('Authorization', 'Bearer good')
      .send({ name: 'X', type: 'office', address: 'Calle 1 #2-3' })

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('invalid_request')
    expect(orgCount()).toBe(0)
  })

  it('rejects an unknown organization type', async () => {
    signedInAs(ALICE)

    const res = await request(app)
      .post('/orgs')
      .set('Authorization', 'Bearer good')
      .send({ name: 'X', type: 'hospital' })

    expect(res.status).toBe(400)
    expect(orgCount()).toBe(0)
  })

  it('refuses to let the caller set their own plan or limits', async () => {
    signedInAs(ALICE)

    const res = await request(app)
      .post('/orgs')
      .set('Authorization', 'Bearer good')
      .send({ name: 'X', type: 'office', plan: 'paid_b', limits: { max_interiors: 9999 } })

    expect(res.status).toBe(400)
    expect(orgCount()).toBe(0)
  })
})

describe('GET /orgs', () => {
  it('returns only the organizations the caller belongs to', async () => {
    seedOrg('org_alice', ALICE)
    seedOrg('org_bob', BOB)
    signedInAs(ALICE)

    const res = await request(app).get('/orgs').set('Authorization', 'Bearer good')

    expect(res.status).toBe(200)
    expect(res.body.orgs).toHaveLength(1)
    expect(res.body.orgs[0].id).toBe('org_alice')
    expect(res.body.orgs[0].role).toBe('admin')
  })

  it('returns an empty list for someone with no organizations', async () => {
    seedOrg('org_bob', BOB)
    signedInAs(ALICE)

    const res = await request(app).get('/orgs').set('Authorization', 'Bearer good')

    expect(res.status).toBe(200)
    expect(res.body.orgs).toEqual([])
  })

  it('hides an organization that has been deleted', async () => {
    seedOrg('org_alice', ALICE, { status: 'deleted' })
    signedInAs(ALICE)

    const res = await request(app).get('/orgs').set('Authorization', 'Bearer good')

    expect(res.body.orgs).toEqual([])
  })
})

describe('multi-organization isolation', () => {
  it('does not let one customer read another customer\'s organization', async () => {
    seedOrg('org_alice', ALICE)
    seedOrg('org_bob', BOB)
    signedInAs(BOB)

    const res = await request(app).get('/orgs/org_alice').set('Authorization', 'Bearer good')

    // 404, not 403: a stranger must not learn that this organization exists.
    expect(res.status).toBe(404)
    expect(JSON.stringify(res.body)).not.toContain('Colegio')
  })

  it('does not let one customer change another customer\'s organization', async () => {
    seedOrg('org_alice', ALICE)
    seedOrg('org_bob', BOB)
    signedInAs(BOB)

    const res = await request(app)
      .put('/orgs/org_alice')
      .set('Authorization', 'Bearer good')
      .send({ name: 'Taken over' })

    expect(res.status).toBe(404)
    expect(org('org_alice')?.name).toBe('Colegio Bilingüe X')
  })

  it('does not let one customer delete another customer\'s organization', async () => {
    seedOrg('org_alice', ALICE)
    seedOrg('org_bob', BOB)
    signedInAs(BOB)

    const res = await request(app).delete('/orgs/org_alice').set('Authorization', 'Bearer good')

    expect(res.status).toBe(404)
    expect(org('org_alice')?.status).toBe('active')
  })

  it('does not let a signed-in stranger with no organizations reach one', async () => {
    seedOrg('org_alice', ALICE)
    signedInAs(BOB)

    const res = await request(app).get('/orgs/org_alice').set('Authorization', 'Bearer good')

    expect(res.status).toBe(404)
  })

  it('refuses a member who is not an admin, without hiding the organization', async () => {
    seedOrg('org_shared', ALICE)
    store.seed(`users/${BOB}`, {
      id: BOB,
      deleted: false,
      orgs: [{ org_id: 'org_shared', role: 'security' }],
    })
    signedInAs(BOB)

    const res = await request(app)
      .put('/orgs/org_shared')
      .set('Authorization', 'Bearer good')
      .send({ name: 'Renamed' })

    // 403, not 404: Bob already knows this organization exists — he is in it.
    expect(res.status).toBe(403)
    expect(org('org_shared')?.name).toBe('Colegio Bilingüe X')
  })

  it('lets a non-admin member still read the organization', async () => {
    seedOrg('org_shared', ALICE)
    store.seed(`users/${BOB}`, {
      id: BOB,
      deleted: false,
      orgs: [{ org_id: 'org_shared', role: 'security' }],
    })
    signedInAs(BOB)

    const res = await request(app).get('/orgs/org_shared').set('Authorization', 'Bearer good')

    expect(res.status).toBe(200)
    expect(res.body.role).toBe('security')
  })
})

describe('PUT /orgs/{orgId}', () => {
  it('updates the fields an admin is allowed to change', async () => {
    seedOrg('org_alice', ALICE)
    signedInAs(ALICE)

    const res = await request(app)
      .put('/orgs/org_alice')
      .set('Authorization', 'Bearer good')
      .send({ name: 'Colegio Bilingüe X (2026)', city: 'Medellín' })

    expect(res.status).toBe(200)
    expect(res.body.name).toBe('Colegio Bilingüe X (2026)')
    expect(org('org_alice')?.city).toBe('Medellín')
  })

  it('refuses to change the plan, the limits or the counters', async () => {
    seedOrg('org_alice', ALICE)

    for (const body of [
      { plan: 'paid_b' },
      { limits: { max_locations: 99, max_interiors: 99 } },
      { counts: { locations: 0, interiors: 0 } },
    ]) {
      signedInAs(ALICE)
      const res = await request(app)
        .put('/orgs/org_alice')
        .set('Authorization', 'Bearer good')
        .send(body)

      expect(res.status).toBe(400)
    }

    expect(org('org_alice')?.plan).toBe('free')
    expect(org('org_alice')?.limits).toEqual({ max_locations: 1, max_interiors: 10 })
  })

  it('rejects an empty change', async () => {
    seedOrg('org_alice', ALICE)
    signedInAs(ALICE)

    const res = await request(app)
      .put('/orgs/org_alice')
      .set('Authorization', 'Bearer good')
      .send({})

    expect(res.status).toBe(400)
  })
})

describe('DELETE /orgs/{orgId}', () => {
  it('marks the organization deleted rather than erasing it', async () => {
    seedOrg('org_alice', ALICE)
    signedInAs(ALICE)

    const res = await request(app).delete('/orgs/org_alice').set('Authorization', 'Bearer good')

    expect(res.status).toBe(200)
    expect(res.body.deleted).toBe(true)
    // Still present, so the audit trail beneath it survives.
    expect(org('org_alice')?.status).toBe('deleted')
  })

  it('refuses while an authorization is still active', async () => {
    seedOrg('org_alice', ALICE)
    store.seed('orgs/org_alice/authorizations/auth_1', {
      id: 'auth_1',
      status: 'active',
      valid_to: '2099-01-01T00:00:00.000Z',
    })
    signedInAs(ALICE)

    const res = await request(app).delete('/orgs/org_alice').set('Authorization', 'Bearer good')

    expect(res.status).toBe(409)
    expect(res.body.error).toBe('conflict')
    expect(org('org_alice')?.status).toBe('active')
  })

  it('allows deletion once the authorizations are revoked', async () => {
    seedOrg('org_alice', ALICE)
    store.seed('orgs/org_alice/authorizations/auth_1', {
      id: 'auth_1',
      status: 'revoked',
      valid_to: '2099-01-01T00:00:00.000Z',
    })
    signedInAs(ALICE)

    const res = await request(app).delete('/orgs/org_alice').set('Authorization', 'Bearer good')

    expect(res.status).toBe(200)
  })

  it('allows deletion when the only authorization has already expired', async () => {
    // Nothing marks a permit expired on a schedule, so an old one keeps
    // status "active" forever. If the guard looked at status alone, one
    // permit from 2020 would block this organization for good.
    seedOrg('org_alice', ALICE)
    store.seed('orgs/org_alice/authorizations/auth_1', {
      id: 'auth_1',
      status: 'active',
      valid_to: '2020-01-01T00:00:00.000Z',
    })
    signedInAs(ALICE)

    const res = await request(app).delete('/orgs/org_alice').set('Authorization', 'Bearer good')

    expect(res.status).toBe(200)
    expect(org('org_alice')?.status).toBe('deleted')
  })

  it('cannot be reached twice — a deleted organization is gone', async () => {
    seedOrg('org_alice', ALICE, { status: 'deleted' })
    signedInAs(ALICE)

    const res = await request(app).delete('/orgs/org_alice').set('Authorization', 'Bearer good')

    expect(res.status).toBe(404)
  })
})
