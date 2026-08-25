import { beforeEach, describe, expect, it, vi } from 'vitest'
import request from 'supertest'

const verifyIdToken = vi.fn()

/**
 * A small in-memory Firestore stand-in: two top-level collections (`users`,
 * `orgs`) plus the `authorizations` subcollection the delete guard queries.
 */
type Doc = Record<string, unknown>

const users = new Map<string, Doc>()
const orgs = new Map<string, Doc>()
const authorizations = new Map<string, Doc[]>()
const writes: Array<{ op: string; path: string; data: Doc }> = []

const ARRAY_UNION = Symbol('arrayUnion')

function resolveValue(current: unknown, incoming: unknown): unknown {
  if (incoming && typeof incoming === 'object' && ARRAY_UNION in (incoming as object)) {
    const additions = (incoming as { [ARRAY_UNION]: unknown[] })[ARRAY_UNION]
    const base = Array.isArray(current) ? current : []
    return [...base, ...additions]
  }
  return incoming
}

function applyWrite(store: Map<string, Doc>, id: string, data: Doc, merge: boolean): void {
  const current = merge ? (store.get(id) ?? {}) : {}
  const next: Doc = { ...current }
  for (const [key, value] of Object.entries(data)) {
    next[key] = resolveValue(current[key], value)
  }
  store.set(id, next)
}

function makeRef(store: Map<string, Doc>, id: string, label: string) {
  return {
    id,
    get: async () => ({ exists: store.has(id), id, data: () => store.get(id) }),
    set: async (data: Doc, options?: { merge?: boolean }) => {
      writes.push({ op: 'set', path: `${label}/${id}`, data })
      applyWrite(store, id, data, options?.merge === true)
    },
    update: async (data: Doc) => {
      writes.push({ op: 'update', path: `${label}/${id}`, data })
      applyWrite(store, id, data, true)
    },
    collection: (name: string) => ({
      where: () => ({
        limit: () => ({
          get: async () => {
            const rows = name === 'authorizations' ? (authorizations.get(id) ?? []) : []
            const active = rows.filter((row) => row.status === 'active')
            return { empty: active.length === 0, docs: active }
          },
        }),
      }),
    }),
  }
}

let autoId = 0

const firestore = {
  collection: (name: string) => {
    const store = name === 'users' ? users : orgs
    return {
      doc: (id?: string) => makeRef(store, id ?? `auto${++autoId}`, name),
    }
  },
  getAll: async (...refs: Array<{ id: string }>) =>
    refs.map((ref) => ({
      id: ref.id,
      exists: orgs.has(ref.id),
      data: () => orgs.get(ref.id),
    })),
  batch: () => {
    const queued: Array<() => void> = []
    return {
      set: (ref: { id: string }, data: Doc, options?: { merge?: boolean }) => {
        const store = users.has(ref.id) || String(ref.id).startsWith('user') ? users : orgs
        queued.push(() => {
          writes.push({ op: 'batch.set', path: String(ref.id), data })
          applyWrite(store, ref.id, data, options?.merge === true)
        })
      },
      commit: async () => queued.forEach((run) => run()),
    }
  },
  listCollections: vi.fn(),
}

vi.mock('../lib/firebase.js', () => ({
  db: () => firestore,
  auth: () => ({ verifyIdToken, revokeRefreshTokens: vi.fn() }),
  getFirebaseApp: () => ({}),
}))

vi.mock('firebase-admin/firestore', () => ({
  FieldValue: {
    serverTimestamp: () => ({ __serverTimestamp: true }),
    arrayUnion: (...items: unknown[]) => ({ [ARRAY_UNION]: items }),
  },
}))

const { createApp } = await import('../app.js')
const app = createApp()

const ALICE = 'user_alice'
const BOB = 'user_bob'

function signedInAs(uid: string) {
  verifyIdToken.mockResolvedValueOnce({ uid, email: `${uid}@example.com`, email_verified: true })
}

/** Puts an existing organization and its admin in place without going through the API. */
function seedOrg(orgId: string, adminUid: string, extra: Doc = {}): void {
  orgs.set(orgId, {
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
  const user = users.get(adminUid) ?? { id: adminUid, deleted: false, orgs: [] }
  user.orgs = [...((user.orgs as unknown[]) ?? []), { org_id: orgId, role: 'admin' }]
  users.set(adminUid, user)
}

beforeEach(() => {
  users.clear()
  orgs.clear()
  authorizations.clear()
  writes.length = 0
  autoId = 0
  vi.clearAllMocks()
})

describe('POST /orgs', () => {
  it('rejects a caller with no Firebase token', async () => {
    const res = await request(app).post('/orgs').send({ name: 'X', type: 'school' })

    expect(res.status).toBe(401)
    expect(writes).toHaveLength(0)
  })

  it('creates the organization and makes the caller its admin', async () => {
    signedInAs(ALICE)

    const res = await request(app)
      .post('/orgs')
      .set('Authorization', 'Bearer good')
      .send({ name: 'Colegio Bilingüe X', type: 'school', city: 'Bogotá', country: 'co' })

    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({
      name: 'Colegio Bilingüe X',
      type: 'school',
      city: 'Bogotá',
      country: 'CO',
      created_by: ALICE,
      role: 'admin',
    })
    expect(res.body.id).toMatch(/^org_/)
    // Internal bookkeeping is not part of the API contract.
    expect(res.body).not.toHaveProperty('status')

    // The membership was written together with the organization.
    expect(users.get(ALICE)?.orgs).toEqual([{ org_id: res.body.id, role: 'admin' }])
  })

  it('starts every organization on the free plan limits', async () => {
    signedInAs(ALICE)

    const res = await request(app)
      .post('/orgs')
      .set('Authorization', 'Bearer good')
      .send({ name: 'Unidad Residencial Y', type: 'residence' })

    expect(res.body.plan).toBe('free')
    expect(res.body.limits).toEqual({ max_locations: 1, max_interiors: 10 })
    expect(res.body.counts).toEqual({ locations: 0, interiors: 0 })
  })

  it('never stores a street address', async () => {
    signedInAs(ALICE)

    const res = await request(app)
      .post('/orgs')
      .set('Authorization', 'Bearer good')
      .send({ name: 'X', type: 'office', address: 'Calle 1 #2-3' })

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('invalid_request')
    expect(orgs.size).toBe(0)
  })

  it('rejects an unknown organization type', async () => {
    signedInAs(ALICE)

    const res = await request(app)
      .post('/orgs')
      .set('Authorization', 'Bearer good')
      .send({ name: 'X', type: 'hospital' })

    expect(res.status).toBe(400)
    expect(orgs.size).toBe(0)
  })

  it('refuses to let the caller set their own plan or limits', async () => {
    signedInAs(ALICE)

    const res = await request(app)
      .post('/orgs')
      .set('Authorization', 'Bearer good')
      .send({ name: 'X', type: 'office', plan: 'paid_b', limits: { max_interiors: 9999 } })

    expect(res.status).toBe(400)
    expect(orgs.size).toBe(0)
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
    expect(orgs.get('org_alice')?.name).toBe('Colegio Bilingüe X')
  })

  it('does not let one customer delete another customer\'s organization', async () => {
    seedOrg('org_alice', ALICE)
    seedOrg('org_bob', BOB)
    signedInAs(BOB)

    const res = await request(app).delete('/orgs/org_alice').set('Authorization', 'Bearer good')

    expect(res.status).toBe(404)
    expect(orgs.get('org_alice')?.status).toBe('active')
  })

  it('does not let a signed-in stranger with no organizations reach one', async () => {
    seedOrg('org_alice', ALICE)
    signedInAs(BOB)

    const res = await request(app).get('/orgs/org_alice').set('Authorization', 'Bearer good')

    expect(res.status).toBe(404)
  })

  it('refuses a member who is not an admin, without hiding the organization', async () => {
    seedOrg('org_shared', ALICE)
    users.set(BOB, { id: BOB, deleted: false, orgs: [{ org_id: 'org_shared', role: 'security' }] })
    signedInAs(BOB)

    const res = await request(app)
      .put('/orgs/org_shared')
      .set('Authorization', 'Bearer good')
      .send({ name: 'Renamed' })

    // 403, not 404: Bob already knows this organization exists — he is in it.
    expect(res.status).toBe(403)
    expect(orgs.get('org_shared')?.name).toBe('Colegio Bilingüe X')
  })

  it('lets a non-admin member still read the organization', async () => {
    seedOrg('org_shared', ALICE)
    users.set(BOB, { id: BOB, deleted: false, orgs: [{ org_id: 'org_shared', role: 'security' }] })
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
    expect(orgs.get('org_alice')?.city).toBe('Medellín')
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

    expect(orgs.get('org_alice')?.plan).toBe('free')
    expect(orgs.get('org_alice')?.limits).toEqual({ max_locations: 1, max_interiors: 10 })
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
    expect(orgs.get('org_alice')?.status).toBe('deleted')
  })

  it('refuses while an authorization is still active', async () => {
    seedOrg('org_alice', ALICE)
    authorizations.set('org_alice', [{ id: 'auth_1', status: 'active' }])
    signedInAs(ALICE)

    const res = await request(app).delete('/orgs/org_alice').set('Authorization', 'Bearer good')

    expect(res.status).toBe(409)
    expect(res.body.error).toBe('conflict')
    expect(orgs.get('org_alice')?.status).toBe('active')
  })

  it('allows deletion once the authorizations are revoked', async () => {
    seedOrg('org_alice', ALICE)
    authorizations.set('org_alice', [{ id: 'auth_1', status: 'revoked' }])
    signedInAs(ALICE)

    const res = await request(app).delete('/orgs/org_alice').set('Authorization', 'Bearer good')

    expect(res.status).toBe(200)
  })

  it('cannot be reached twice — a deleted organization is gone', async () => {
    seedOrg('org_alice', ALICE, { status: 'deleted' })
    signedInAs(ALICE)

    const res = await request(app).delete('/orgs/org_alice').set('Authorization', 'Bearer good')

    expect(res.status).toBe(404)
  })
})
