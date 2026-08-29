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

const ADMIN = 'user_admin'
const GUARD = 'user_guard'
const OUTSIDER = 'user_outsider'
const ORG = 'org_alpha'
const OTHER_ORG = 'org_beta'

function signedInAs(uid: string) {
  verifyIdToken.mockResolvedValueOnce({ uid, email: `${uid}@example.com`, email_verified: true })
}

function seedOrg(orgId: string, maxLocations = 1, used = 0) {
  store.seed(`orgs/${orgId}`, {
    id: orgId,
    name: 'Unidad Residencial Y',
    type: 'residence',
    plan: 'free',
    limits: { max_locations: maxLocations, max_interiors: 10 },
    counts: { locations: used, interiors: 0 },
    status: 'active',
  })
}

function seedMember(uid: string, orgId: string, role: string) {
  const existing = (store.docs.get(`users/${uid}`)?.orgs as unknown[]) ?? []
  store.seed(`users/${uid}`, {
    id: uid,
    deleted: false,
    orgs: [...existing, { org_id: orgId, role }],
  })
}

function seedLocation(orgId: string, locationId: string, extra: Record<string, unknown> = {}) {
  store.seed(`orgs/${orgId}/locations/${locationId}`, {
    id: locationId,
    org_id: orgId,
    name: 'Main Entrance',
    description: '',
    type: 'entrance',
    enabled: true,
    created_by: ADMIN,
    ...extra,
  })
}

beforeEach(() => {
  store.reset()
  vi.clearAllMocks()
  seedOrg(ORG)
  seedMember(ADMIN, ORG, 'admin')
  seedMember(GUARD, ORG, 'security')
})

describe('POST /orgs/{orgId}/locations', () => {
  it('rejects a caller with no Firebase token', async () => {
    const res = await request(app).post(`/orgs/${ORG}/locations`).send({ name: 'Entrada' })

    expect(res.status).toBe(401)
    expect(store.writes).toHaveLength(0)
  })

  it('creates a location and counts it against the plan', async () => {
    signedInAs(ADMIN)

    const res = await request(app)
      .post(`/orgs/${ORG}/locations`)
      .set('Authorization', 'Bearer good')
      .send({ name: 'Entrada Principal', type: 'entrance', description: 'Puerta de la calle' })

    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({
      org_id: ORG,
      name: 'Entrada Principal',
      type: 'entrance',
      enabled: true,
    })
    expect(res.body.id).toMatch(/^loc_/)
    expect(res.body.usage).toEqual({ locations: 1 })

    // The organization's counter moved with it.
    expect((store.docs.get(`orgs/${ORG}`)?.counts as Record<string, number>).locations).toBe(1)
  })

  it('refuses once the plan limit is reached, and writes nothing', async () => {
    seedOrg(ORG, 1, 1)
    signedInAs(ADMIN)

    const res = await request(app)
      .post(`/orgs/${ORG}/locations`)
      .set('Authorization', 'Bearer good')
      .send({ name: 'Segunda Sede' })

    expect(res.status).toBe(403)
    expect(res.body.error).toBe('quota_exceeded')
    expect(res.body.details).toMatchObject({ resource: 'locations', limit: 1 })
    expect(store.writes).toHaveLength(0)
    expect((store.docs.get(`orgs/${ORG}`)?.counts as Record<string, number>).locations).toBe(1)
  })

  it('allows more locations on a plan that permits them', async () => {
    seedOrg(ORG, 5, 1)
    signedInAs(ADMIN)

    const res = await request(app)
      .post(`/orgs/${ORG}/locations`)
      .set('Authorization', 'Bearer good')
      .send({ name: 'Segunda Sede' })

    expect(res.status).toBe(201)
    expect(res.body.usage).toEqual({ locations: 2 })
  })

  it('refuses a member who is not an administrator', async () => {
    signedInAs(GUARD)

    const res = await request(app)
      .post(`/orgs/${ORG}/locations`)
      .set('Authorization', 'Bearer good')
      .send({ name: 'Entrada' })

    expect(res.status).toBe(403)
    expect(store.writes).toHaveLength(0)
  })

  it('rejects an unknown field instead of storing it', async () => {
    signedInAs(ADMIN)

    const res = await request(app)
      .post(`/orgs/${ORG}/locations`)
      .set('Authorization', 'Bearer good')
      .send({ name: 'Entrada', security_personnel: 'José' })

    expect(res.status).toBe(400)
    expect(store.writes).toHaveLength(0)
  })

  it('rejects a location with no name', async () => {
    signedInAs(ADMIN)

    const res = await request(app)
      .post(`/orgs/${ORG}/locations`)
      .set('Authorization', 'Bearer good')
      .send({ description: 'Sin nombre' })

    expect(res.status).toBe(400)
  })
})

describe('GET /orgs/{orgId}/locations', () => {
  it('lists the locations with the current usage against the plan', async () => {
    seedOrg(ORG, 5, 2)
    seedLocation(ORG, 'loc_2', { name: 'Recepción' })
    seedLocation(ORG, 'loc_1', { name: 'Entrada' })
    signedInAs(ADMIN)

    const res = await request(app)
      .get(`/orgs/${ORG}/locations`)
      .set('Authorization', 'Bearer good')

    expect(res.status).toBe(200)
    expect(res.body.locations.map((l: { name: string }) => l.name)).toEqual([
      'Entrada',
      'Recepción',
    ])
    expect(res.body.usage).toEqual({ locations: 2, max_locations: 5 })
  })

  it('lets security personnel list locations too', async () => {
    seedLocation(ORG, 'loc_1')
    signedInAs(GUARD)

    const res = await request(app)
      .get(`/orgs/${ORG}/locations`)
      .set('Authorization', 'Bearer good')

    expect(res.status).toBe(200)
    expect(res.body.locations).toHaveLength(1)
  })
})

describe('locations stay inside their organization', () => {
  beforeEach(() => {
    seedOrg(OTHER_ORG)
    seedMember(OUTSIDER, OTHER_ORG, 'admin')
    seedLocation(ORG, 'loc_secret', { name: 'Bóveda' })
  })

  it('does not list another organization\'s locations', async () => {
    signedInAs(OUTSIDER)

    const res = await request(app)
      .get(`/orgs/${ORG}/locations`)
      .set('Authorization', 'Bearer good')

    expect(res.status).toBe(404)
    expect(JSON.stringify(res.body)).not.toContain('Bóveda')
  })

  it('does not read another organization\'s location', async () => {
    signedInAs(OUTSIDER)

    const res = await request(app)
      .get(`/orgs/${ORG}/locations/loc_secret`)
      .set('Authorization', 'Bearer good')

    expect(res.status).toBe(404)
    expect(JSON.stringify(res.body)).not.toContain('Bóveda')
  })

  it('does not create a location in another organization', async () => {
    signedInAs(OUTSIDER)

    const res = await request(app)
      .post(`/orgs/${ORG}/locations`)
      .set('Authorization', 'Bearer good')
      .send({ name: 'Puerta trasera' })

    expect(res.status).toBe(404)
    expect(store.writes).toHaveLength(0)
  })

  it('does not change another organization\'s location', async () => {
    signedInAs(OUTSIDER)

    const res = await request(app)
      .put(`/orgs/${ORG}/locations/loc_secret`)
      .set('Authorization', 'Bearer good')
      .send({ name: 'Tomada' })

    expect(res.status).toBe(404)
    expect(store.docs.get(`orgs/${ORG}/locations/loc_secret`)?.name).toBe('Bóveda')
  })

  it('does not delete another organization\'s location', async () => {
    signedInAs(OUTSIDER)

    const res = await request(app)
      .delete(`/orgs/${ORG}/locations/loc_secret`)
      .set('Authorization', 'Bearer good')

    expect(res.status).toBe(404)
    expect(store.docs.has(`orgs/${ORG}/locations/loc_secret`)).toBe(true)
  })
})

describe('PUT /orgs/{orgId}/locations/{locationId}', () => {
  it('renames a location', async () => {
    seedLocation(ORG, 'loc_1')
    signedInAs(ADMIN)

    const res = await request(app)
      .put(`/orgs/${ORG}/locations/loc_1`)
      .set('Authorization', 'Bearer good')
      .send({ name: 'Entrada Norte' })

    expect(res.status).toBe(200)
    expect(res.body.name).toBe('Entrada Norte')
    expect(store.docs.get(`orgs/${ORG}/locations/loc_1`)?.name).toBe('Entrada Norte')
  })

  it('takes a location out of use without deleting it', async () => {
    seedLocation(ORG, 'loc_1')
    signedInAs(ADMIN)

    const res = await request(app)
      .put(`/orgs/${ORG}/locations/loc_1`)
      .set('Authorization', 'Bearer good')
      .send({ enabled: false })

    expect(res.status).toBe(200)
    expect(res.body.enabled).toBe(false)
    // Still there, so its entry history survives.
    expect(store.docs.has(`orgs/${ORG}/locations/loc_1`)).toBe(true)
  })

  it('answers 404 for a location that does not exist', async () => {
    signedInAs(ADMIN)

    const res = await request(app)
      .put(`/orgs/${ORG}/locations/loc_missing`)
      .set('Authorization', 'Bearer good')
      .send({ name: 'X' })

    expect(res.status).toBe(404)
  })

  it('refuses a member who is not an administrator', async () => {
    seedLocation(ORG, 'loc_1')
    signedInAs(GUARD)

    const res = await request(app)
      .put(`/orgs/${ORG}/locations/loc_1`)
      .set('Authorization', 'Bearer good')
      .send({ name: 'Cambiada' })

    expect(res.status).toBe(403)
    expect(store.docs.get(`orgs/${ORG}/locations/loc_1`)?.name).toBe('Main Entrance')
  })
})

describe('DELETE /orgs/{orgId}/locations/{locationId}', () => {
  it('deletes the location and frees its slot', async () => {
    seedOrg(ORG, 1, 1)
    seedLocation(ORG, 'loc_1')
    signedInAs(ADMIN)

    const res = await request(app)
      .delete(`/orgs/${ORG}/locations/loc_1`)
      .set('Authorization', 'Bearer good')

    expect(res.status).toBe(200)
    expect(store.docs.has(`orgs/${ORG}/locations/loc_1`)).toBe(false)
    expect((store.docs.get(`orgs/${ORG}`)?.counts as Record<string, number>).locations).toBe(0)
  })

  it('refuses while the location still has interiors', async () => {
    seedOrg(ORG, 1, 1)
    seedLocation(ORG, 'loc_1')
    store.seed(`orgs/${ORG}/interiors/int_1`, { id: 'int_1', location_id: 'loc_1', number: '302' })
    signedInAs(ADMIN)

    const res = await request(app)
      .delete(`/orgs/${ORG}/locations/loc_1`)
      .set('Authorization', 'Bearer good')

    expect(res.status).toBe(409)
    expect(res.body.error).toBe('conflict')
    expect(store.docs.has(`orgs/${ORG}/locations/loc_1`)).toBe(true)
    expect((store.docs.get(`orgs/${ORG}`)?.counts as Record<string, number>).locations).toBe(1)
  })

  it('refuses while an authorization still points at the location', async () => {
    seedOrg(ORG, 1, 1)
    seedLocation(ORG, 'loc_1')
    store.seed(`orgs/${ORG}/authorizations/auth_1`, {
      id: 'auth_1',
      location_id: 'loc_1',
      status: 'active',
      valid_to: '2099-01-01T00:00:00.000Z',
    })
    signedInAs(ADMIN)

    const res = await request(app)
      .delete(`/orgs/${ORG}/locations/loc_1`)
      .set('Authorization', 'Bearer good')

    expect(res.status).toBe(409)
    expect(store.docs.has(`orgs/${ORG}/locations/loc_1`)).toBe(true)
  })

  it('allows deletion when the authorization pointing at it has expired', async () => {
    seedOrg(ORG, 1, 1)
    seedLocation(ORG, 'loc_1')
    store.seed(`orgs/${ORG}/authorizations/auth_1`, {
      id: 'auth_1',
      location_id: 'loc_1',
      status: 'active',
      valid_to: '2020-01-01T00:00:00.000Z',
    })
    signedInAs(ADMIN)

    const res = await request(app)
      .delete(`/orgs/${ORG}/locations/loc_1`)
      .set('Authorization', 'Bearer good')

    expect(res.status).toBe(200)
  })

  it('allows deletion once the authorization is revoked', async () => {
    seedOrg(ORG, 1, 1)
    seedLocation(ORG, 'loc_1')
    store.seed(`orgs/${ORG}/authorizations/auth_1`, {
      id: 'auth_1',
      location_id: 'loc_1',
      status: 'revoked',
      valid_to: '2099-01-01T00:00:00.000Z',
    })
    signedInAs(ADMIN)

    const res = await request(app)
      .delete(`/orgs/${ORG}/locations/loc_1`)
      .set('Authorization', 'Bearer good')

    expect(res.status).toBe(200)
  })

  it('refuses a member who is not an administrator', async () => {
    seedLocation(ORG, 'loc_1')
    signedInAs(GUARD)

    const res = await request(app)
      .delete(`/orgs/${ORG}/locations/loc_1`)
      .set('Authorization', 'Bearer good')

    expect(res.status).toBe(403)
    expect(store.docs.has(`orgs/${ORG}/locations/loc_1`)).toBe(true)
  })

  it('deleting frees a slot that can then be reused', async () => {
    seedOrg(ORG, 1, 1)
    seedLocation(ORG, 'loc_1')

    signedInAs(ADMIN)
    await request(app).delete(`/orgs/${ORG}/locations/loc_1`).set('Authorization', 'Bearer good')

    signedInAs(ADMIN)
    const res = await request(app)
      .post(`/orgs/${ORG}/locations`)
      .set('Authorization', 'Bearer good')
      .send({ name: 'Nueva Sede' })

    expect(res.status).toBe(201)
    expect(res.body.usage).toEqual({ locations: 1 })
  })
})
