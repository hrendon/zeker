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
const RESIDENT = 'user_resident'
const GUARD = 'user_guard'
const OUTSIDER = 'user_outsider'
const ORG = 'org_alpha'
const OTHER_ORG = 'org_beta'
const LOC = 'loc_torre_a'
const LOC_B = 'loc_torre_b'

function signedInAs(uid: string) {
  verifyIdToken.mockResolvedValueOnce({ uid, email: `${uid}@example.com`, email_verified: true })
}

function seedOrg(orgId: string, maxInteriors = 10, used = 0) {
  store.seed(`orgs/${orgId}`, {
    id: orgId,
    name: 'Unidad Residencial Y',
    type: 'residence',
    plan: 'free',
    limits: { max_locations: 1, max_interiors: maxInteriors },
    counts: { locations: 1, interiors: used },
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

function seedLocation(orgId: string, locationId: string) {
  store.seed(`orgs/${orgId}/locations/${locationId}`, {
    id: locationId,
    org_id: orgId,
    name: 'Torre A',
    type: 'entrance',
    enabled: true,
  })
}

function seedInterior(orgId: string, interiorId: string, extra: Record<string, unknown> = {}) {
  store.seed(`orgs/${orgId}/interiors/${interiorId}`, {
    id: interiorId,
    org_id: orgId,
    location_id: LOC,
    number: '302',
    name: '',
    responsable_user_id: RESIDENT,
    enabled: true,
    created_by: ADMIN,
    ...extra,
  })
}

function counts(orgId = ORG): Record<string, number> {
  return store.docs.get(`orgs/${orgId}`)?.counts as Record<string, number>
}

const NEW_INTERIOR = {
  location_id: LOC,
  number: '302',
  responsable_user_id: RESIDENT,
}

beforeEach(() => {
  store.reset()
  vi.clearAllMocks()
  seedOrg(ORG)
  seedLocation(ORG, LOC)
  seedMember(ADMIN, ORG, 'admin')
  seedMember(GUARD, ORG, 'security')
  seedMember(RESIDENT, ORG, 'responsable')
})

describe('POST /orgs/{orgId}/interiors', () => {
  it('rejects a caller with no Firebase token', async () => {
    const res = await request(app).post(`/orgs/${ORG}/interiors`).send(NEW_INTERIOR)

    expect(res.status).toBe(401)
    expect(store.writes).toHaveLength(0)
  })

  it('creates an interior and counts it against the plan', async () => {
    signedInAs(ADMIN)

    const res = await request(app)
      .post(`/orgs/${ORG}/interiors`)
      .set('Authorization', 'Bearer good')
      .send({ ...NEW_INTERIOR, name: 'Apartamento 302' })

    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({
      org_id: ORG,
      location_id: LOC,
      number: '302',
      name: 'Apartamento 302',
      responsable_user_id: RESIDENT,
      // The name is shown from the account, not stored on the interior.
      responsable_name: 'María García',
      enabled: true,
    })
    expect(res.body.id).toMatch(/^int_/)
    expect(res.body.usage).toEqual({ interiors: 1 })
    expect(counts().interiors).toBe(1)
  })

  it('refuses the eleventh interior on the free plan, and writes nothing', async () => {
    seedOrg(ORG, 10, 10)
    signedInAs(ADMIN)

    const res = await request(app)
      .post(`/orgs/${ORG}/interiors`)
      .set('Authorization', 'Bearer good')
      .send({ ...NEW_INTERIOR, number: '999' })

    expect(res.status).toBe(403)
    expect(res.body.error).toBe('quota_exceeded')
    expect(res.body.details).toMatchObject({ resource: 'interiors', limit: 10 })
    expect(store.writes).toHaveLength(0)
    expect(counts().interiors).toBe(10)
  })

  it('counts interiors across the whole organization, not per location', async () => {
    // 10 already used, spread over two locations: the limit is global.
    seedOrg(ORG, 10, 10)
    seedLocation(ORG, LOC_B)
    signedInAs(ADMIN)

    const res = await request(app)
      .post(`/orgs/${ORG}/interiors`)
      .set('Authorization', 'Bearer good')
      .send({ ...NEW_INTERIOR, location_id: LOC_B, number: '101' })

    expect(res.status).toBe(403)
    expect(res.body.error).toBe('quota_exceeded')
  })

  it('refuses two interiors with the same number in one location', async () => {
    seedInterior(ORG, 'int_1', { number: '302' })
    signedInAs(ADMIN)

    const res = await request(app)
      .post(`/orgs/${ORG}/interiors`)
      .set('Authorization', 'Bearer good')
      .send(NEW_INTERIOR)

    expect(res.status).toBe(409)
    expect(res.body.error).toBe('conflict')
    expect(res.body.message).toContain('302')
    expect(counts().interiors).toBe(0)
  })

  it('allows the same number in a different location', async () => {
    seedInterior(ORG, 'int_1', { number: '302', location_id: LOC })
    seedLocation(ORG, LOC_B)
    signedInAs(ADMIN)

    const res = await request(app)
      .post(`/orgs/${ORG}/interiors`)
      .set('Authorization', 'Bearer good')
      .send({ ...NEW_INTERIOR, location_id: LOC_B })

    expect(res.status).toBe(201)
  })

  it('refuses an interior in a location that does not exist', async () => {
    signedInAs(ADMIN)

    const res = await request(app)
      .post(`/orgs/${ORG}/interiors`)
      .set('Authorization', 'Bearer good')
      .send({ ...NEW_INTERIOR, location_id: 'loc_imaginary' })

    expect(res.status).toBe(400)
    expect(counts().interiors).toBe(0)
  })

  it('refuses an interior with nobody in charge of it', async () => {
    signedInAs(ADMIN)

    const res = await request(app)
      .post(`/orgs/${ORG}/interiors`)
      .set('Authorization', 'Bearer good')
      .send({ location_id: LOC, number: '302' })

    // Decision 006: an interior with nobody designated has nobody to issue
    // its permits, so it may not exist.
    expect(res.status).toBe(400)
    expect(store.writes).toHaveLength(0)
  })

  it('does not accept a typed name instead of an account', async () => {
    signedInAs(ADMIN)

    const res = await request(app)
      .post(`/orgs/${ORG}/interiors`)
      .set('Authorization', 'Bearer good')
      .send({ location_id: LOC, number: '302', responsable_name: 'María García' })

    expect(res.status).toBe(400)
    expect(store.writes).toHaveLength(0)
  })

  it('stores no name on the interior — it comes from the account', async () => {
    signedInAs(ADMIN)

    const res = await request(app)
      .post(`/orgs/${ORG}/interiors`)
      .set('Authorization', 'Bearer good')
      .send(NEW_INTERIOR)

    expect(res.status).toBe(201)
    expect(res.body.responsable_name).toBe('María García')
    const stored = store.docs.get(`orgs/${ORG}/interiors/${res.body.id}`)
    expect(stored).not.toHaveProperty('responsable_name')
  })

  it('refuses a responsable from outside the organization', async () => {
    seedOrg(OTHER_ORG)
    seedMember(OUTSIDER, OTHER_ORG, 'admin')
    signedInAs(ADMIN)

    const res = await request(app)
      .post(`/orgs/${ORG}/interiors`)
      .set('Authorization', 'Bearer good')
      .send({ ...NEW_INTERIOR, responsable_user_id: OUTSIDER })

    expect(res.status).toBe(400)
    expect(counts().interiors).toBe(0)
  })

  it('refuses a member who is not an administrator', async () => {
    signedInAs(GUARD)

    const res = await request(app)
      .post(`/orgs/${ORG}/interiors`)
      .set('Authorization', 'Bearer good')
      .send(NEW_INTERIOR)

    expect(res.status).toBe(403)
    expect(store.writes).toHaveLength(0)
  })

  it('rejects an unknown field instead of storing it', async () => {
    signedInAs(ADMIN)

    const res = await request(app)
      .post(`/orgs/${ORG}/interiors`)
      .set('Authorization', 'Bearer good')
      .send({ ...NEW_INTERIOR, responsable_phone: '+571234567890' })

    expect(res.status).toBe(400)
    expect(store.writes).toHaveLength(0)
  })
})

describe('GET /orgs/{orgId}/interiors', () => {
  it('lists interiors in number order with usage against the plan', async () => {
    seedOrg(ORG, 10, 3)
    seedInterior(ORG, 'int_c', { number: '1201' })
    seedInterior(ORG, 'int_a', { number: '101' })
    seedInterior(ORG, 'int_b', { number: '302' })
    signedInAs(ADMIN)

    const res = await request(app).get(`/orgs/${ORG}/interiors`).set('Authorization', 'Bearer good')

    expect(res.status).toBe(200)
    expect(res.body.interiors.map((i: { number: string }) => i.number)).toEqual([
      '101',
      '302',
      '1201',
    ])
    expect(res.body.usage).toEqual({ interiors: 3, max_interiors: 10 })
  })

  it('narrows the list to one location on request', async () => {
    seedOrg(ORG, 10, 2)
    seedLocation(ORG, LOC_B)
    seedInterior(ORG, 'int_a', { number: '101', location_id: LOC })
    seedInterior(ORG, 'int_b', { number: '201', location_id: LOC_B })
    signedInAs(ADMIN)

    const res = await request(app)
      .get(`/orgs/${ORG}/interiors?location_id=${LOC_B}`)
      .set('Authorization', 'Bearer good')

    expect(res.body.interiors).toHaveLength(1)
    expect(res.body.interiors[0].number).toBe('201')
    // Usage still reports the organization-wide total, not the filtered count.
    expect(res.body.usage.interiors).toBe(2)
  })

  it('lets security personnel list interiors', async () => {
    seedInterior(ORG, 'int_a')
    signedInAs(GUARD)

    const res = await request(app).get(`/orgs/${ORG}/interiors`).set('Authorization', 'Bearer good')

    expect(res.status).toBe(200)
    expect(res.body.interiors).toHaveLength(1)
  })
})

describe('interiors stay inside their organization', () => {
  beforeEach(() => {
    seedOrg(OTHER_ORG)
    seedMember(OUTSIDER, OTHER_ORG, 'admin')
    seedInterior(ORG, 'int_secret', { number: '302' })
  })

  it('does not list another organization\'s interiors', async () => {
    signedInAs(OUTSIDER)

    const res = await request(app).get(`/orgs/${ORG}/interiors`).set('Authorization', 'Bearer good')

    expect(res.status).toBe(404)
    expect(JSON.stringify(res.body)).not.toContain('María')
  })

  it('does not read another organization\'s interior', async () => {
    signedInAs(OUTSIDER)

    const res = await request(app)
      .get(`/orgs/${ORG}/interiors/int_secret`)
      .set('Authorization', 'Bearer good')

    expect(res.status).toBe(404)
    expect(JSON.stringify(res.body)).not.toContain('María')
  })

  it('does not create an interior in another organization', async () => {
    signedInAs(OUTSIDER)

    const res = await request(app)
      .post(`/orgs/${ORG}/interiors`)
      .set('Authorization', 'Bearer good')
      .send({ ...NEW_INTERIOR, number: '999' })

    expect(res.status).toBe(404)
    expect(store.writes).toHaveLength(0)
  })

  it('does not change another organization\'s interior', async () => {
    signedInAs(OUTSIDER)

    const res = await request(app)
      .put(`/orgs/${ORG}/interiors/int_secret`)
      .set('Authorization', 'Bearer good')
      .send({ number: 'Tomado' })

    expect(res.status).toBe(404)
    expect(store.docs.get(`orgs/${ORG}/interiors/int_secret`)?.number).toBe('302')
  })

  it('does not delete another organization\'s interior', async () => {
    signedInAs(OUTSIDER)

    const res = await request(app)
      .delete(`/orgs/${ORG}/interiors/int_secret`)
      .set('Authorization', 'Bearer good')

    expect(res.status).toBe(404)
    expect(store.docs.has(`orgs/${ORG}/interiors/int_secret`)).toBe(true)
  })
})

describe('PUT /orgs/{orgId}/interiors/{interiorId}', () => {
  it('hands the interior over to another member', async () => {
    seedMember(GUARD, ORG, 'security', 'Carlos Pérez')
    seedInterior(ORG, 'int_1')
    signedInAs(ADMIN)

    const res = await request(app)
      .put(`/orgs/${ORG}/interiors/int_1`)
      .set('Authorization', 'Bearer good')
      .send({ responsable_user_id: GUARD })

    expect(res.status).toBe(200)
    expect(res.body.responsable_user_id).toBe(GUARD)
    // The name follows the account it was handed to.
    expect(res.body.responsable_name).toBe('Carlos Pérez')
  })

  it('refuses to leave an interior with nobody in charge', async () => {
    seedInterior(ORG, 'int_1')
    signedInAs(ADMIN)

    const res = await request(app)
      .put(`/orgs/${ORG}/interiors/int_1`)
      .set('Authorization', 'Bearer good')
      .send({ responsable_user_id: null })

    expect(res.status).toBe(400)
    expect(store.docs.get(`orgs/${ORG}/interiors/int_1`)?.responsable_user_id).toBe(RESIDENT)
  })

  it('refuses to hand an interior to someone outside the organization', async () => {
    seedOrg(OTHER_ORG)
    seedMember(OUTSIDER, OTHER_ORG, 'admin')
    seedInterior(ORG, 'int_1')
    signedInAs(ADMIN)

    const res = await request(app)
      .put(`/orgs/${ORG}/interiors/int_1`)
      .set('Authorization', 'Bearer good')
      .send({ responsable_user_id: OUTSIDER })

    expect(res.status).toBe(400)
    expect(store.docs.get(`orgs/${ORG}/interiors/int_1`)?.responsable_user_id).toBe(RESIDENT)
  })

  it('refuses a number already used in the same location', async () => {
    seedInterior(ORG, 'int_1', { number: '302' })
    seedInterior(ORG, 'int_2', { number: '303' })
    signedInAs(ADMIN)

    const res = await request(app)
      .put(`/orgs/${ORG}/interiors/int_2`)
      .set('Authorization', 'Bearer good')
      .send({ number: '302' })

    expect(res.status).toBe(409)
    expect(store.docs.get(`orgs/${ORG}/interiors/int_2`)?.number).toBe('303')
  })

  it('allows saving an interior with its own number unchanged', async () => {
    seedInterior(ORG, 'int_1', { number: '302' })
    signedInAs(ADMIN)

    const res = await request(app)
      .put(`/orgs/${ORG}/interiors/int_1`)
      .set('Authorization', 'Bearer good')
      .send({ number: '302', name: 'Apartamento 302' })

    expect(res.status).toBe(200)
    expect(res.body.name).toBe('Apartamento 302')
  })

  it('does not let the interior be moved to another location', async () => {
    seedInterior(ORG, 'int_1')
    signedInAs(ADMIN)

    const res = await request(app)
      .put(`/orgs/${ORG}/interiors/int_1`)
      .set('Authorization', 'Bearer good')
      .send({ location_id: LOC_B })

    expect(res.status).toBe(400)
    expect(store.docs.get(`orgs/${ORG}/interiors/int_1`)?.location_id).toBe(LOC)
  })

  it('refuses a member who is not an administrator', async () => {
    seedInterior(ORG, 'int_1')
    signedInAs(GUARD)

    const res = await request(app)
      .put(`/orgs/${ORG}/interiors/int_1`)
      .set('Authorization', 'Bearer good')
      .send({ number: 'Cambiado' })

    expect(res.status).toBe(403)
  })
})

describe('DELETE /orgs/{orgId}/interiors/{interiorId}', () => {
  it('deletes the interior and frees its slot', async () => {
    seedOrg(ORG, 10, 1)
    seedInterior(ORG, 'int_1')
    signedInAs(ADMIN)

    const res = await request(app)
      .delete(`/orgs/${ORG}/interiors/int_1`)
      .set('Authorization', 'Bearer good')

    expect(res.status).toBe(200)
    expect(store.docs.has(`orgs/${ORG}/interiors/int_1`)).toBe(false)
    expect(counts().interiors).toBe(0)
  })

  it('refuses while an authorization for it is still active', async () => {
    seedOrg(ORG, 10, 1)
    seedInterior(ORG, 'int_1')
    store.seed(`orgs/${ORG}/authorizations/auth_1`, {
      id: 'auth_1',
      interior_id: 'int_1',
      status: 'active',
    })
    signedInAs(ADMIN)

    const res = await request(app)
      .delete(`/orgs/${ORG}/interiors/int_1`)
      .set('Authorization', 'Bearer good')

    expect(res.status).toBe(409)
    expect(store.docs.has(`orgs/${ORG}/interiors/int_1`)).toBe(true)
    expect(counts().interiors).toBe(1)
  })

  it('frees a slot that can then be reused', async () => {
    seedOrg(ORG, 1, 1)
    seedInterior(ORG, 'int_1', { number: '302' })

    signedInAs(ADMIN)
    await request(app).delete(`/orgs/${ORG}/interiors/int_1`).set('Authorization', 'Bearer good')

    signedInAs(ADMIN)
    const res = await request(app)
      .post(`/orgs/${ORG}/interiors`)
      .set('Authorization', 'Bearer good')
      .send({ ...NEW_INTERIOR, number: '401' })

    expect(res.status).toBe(201)
    expect(res.body.usage).toEqual({ interiors: 1 })
  })
})
