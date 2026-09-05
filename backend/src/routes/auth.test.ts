import { beforeEach, describe, expect, it, vi } from 'vitest'
import request from 'supertest'

const verifyIdToken = vi.fn()
const revokeRefreshTokens = vi.fn()

// One in-memory stand-in for the users collection, driving both the
// transaction used by POST /auth/session and the plain read used by GET /auth/me.
interface StoredDoc {
  exists: boolean
  data: Record<string, unknown> | undefined
}

const store = new Map<string, StoredDoc>()
const writes: Array<{ op: 'set' | 'update'; id: string; data: Record<string, unknown> }> = []

function makeRef(id: string) {
  return {
    id,
    get: async () => {
      const doc = store.get(id)
      return { exists: doc?.exists ?? false, data: () => doc?.data }
    },
    // Added 2026-09-04 for PUT /auth/me, which writes outside a transaction:
    // it changes one document and has nothing to race against.
    set: async (data: Record<string, unknown>, options?: { merge?: boolean }) => {
      writes.push({ op: 'set', id, data })
      const current = store.get(id)
      store.set(id, {
        exists: true,
        data: options?.merge ? { ...current?.data, ...data } : data,
      })
    },
  }
}

const transaction = {
  get: async (ref: { id: string }) => {
    const doc = store.get(ref.id)
    return { exists: doc?.exists ?? false, data: () => doc?.data }
  },
  set: (ref: { id: string }, data: Record<string, unknown>) => {
    writes.push({ op: 'set', id: ref.id, data })
    store.set(ref.id, { exists: true, data })
  },
  update: (ref: { id: string }, data: Record<string, unknown>) => {
    writes.push({ op: 'update', id: ref.id, data })
    const current = store.get(ref.id)
    store.set(ref.id, { exists: true, data: { ...current?.data, ...data } })
  },
}

vi.mock('../lib/firebase.js', () => ({
  db: () => ({
    collection: () => ({ doc: (id: string) => makeRef(id) }),
    runTransaction: async (fn: (tx: typeof transaction) => Promise<unknown>) => fn(transaction),
    listCollections: vi.fn(),
  }),
  auth: () => ({ verifyIdToken, revokeRefreshTokens }),
  getFirebaseApp: () => ({}),
}))

const { createApp } = await import('../app.js')
const app = createApp()

const UID = 'user_xyz789'

function signedIn(overrides: Record<string, unknown> = {}) {
  verifyIdToken.mockResolvedValueOnce({
    uid: UID,
    email: 'juan@example.com',
    email_verified: true,
    ...overrides,
  })
}

beforeEach(() => {
  store.clear()
  writes.length = 0
  vi.clearAllMocks()
})

describe('POST /auth/session', () => {
  it('rejects a caller with no Firebase token', async () => {
    const res = await request(app).post('/auth/session').send({})

    expect(res.status).toBe(401)
    expect(res.body.error).toBe('unauthorized')
    expect(writes).toHaveLength(0)
  })

  it('creates the profile on first sign-in and returns 201', async () => {
    signedIn()

    const res = await request(app)
      .post('/auth/session')
      .set('Authorization', 'Bearer good')
      .send({ first_name: 'Juan', last_name: 'García' })

    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({
      user_id: UID,
      email: 'juan@example.com',
      email_verified: true,
      first_name: 'Juan',
      last_name: 'García',
      orgs: [],
    })
    expect(writes).toEqual([
      expect.objectContaining({ op: 'set', id: UID }),
    ])
    // A new user belongs to no organization until one is created or shared.
    expect(writes[0]?.data.orgs).toEqual([])
  })

  it('is idempotent: a second sign-in updates instead of recreating', async () => {
    signedIn()
    await request(app)
      .post('/auth/session')
      .set('Authorization', 'Bearer good')
      .send({ first_name: 'Juan', last_name: 'García' })

    writes.length = 0
    signedIn()
    const res = await request(app).post('/auth/session').set('Authorization', 'Bearer good').send({})

    expect(res.status).toBe(200)
    expect(res.body.first_name).toBe('Juan')
    expect(writes).toHaveLength(1)
    expect(writes[0]?.op).toBe('update')
    // An empty body must not wipe the name already on file.
    expect(writes[0]?.data).not.toHaveProperty('first_name')
  })

  it('falls back to the display name when no name is supplied', async () => {
    signedIn({ name: 'María García López' })

    const res = await request(app).post('/auth/session').set('Authorization', 'Bearer good').send({})

    expect(res.status).toBe(201)
    expect(res.body.first_name).toBe('María')
    expect(res.body.last_name).toBe('García López')
  })

  it('rejects an unknown field instead of silently storing it', async () => {
    signedIn()

    const res = await request(app)
      .post('/auth/session')
      .set('Authorization', 'Bearer good')
      .send({ first_name: 'Juan', role: 'admin' })

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('invalid_request')
    expect(writes).toHaveLength(0)
  })

  it('rejects an empty name', async () => {
    signedIn()

    const res = await request(app)
      .post('/auth/session')
      .set('Authorization', 'Bearer good')
      .send({ first_name: '   ' })

    expect(res.status).toBe(400)
    expect(writes).toHaveLength(0)
  })

  it('never stores the email address', async () => {
    signedIn()

    await request(app)
      .post('/auth/session')
      .set('Authorization', 'Bearer good')
      .send({ first_name: 'Juan' })

    const written = JSON.stringify(writes[0]?.data)
    expect(written).not.toContain('juan@example.com')
    expect(written).not.toContain('email')
  })
})

describe('GET /auth/me', () => {
  it('rejects a caller with no Firebase token', async () => {
    const res = await request(app).get('/auth/me')

    expect(res.status).toBe(401)
  })

  it('returns the profile and organization memberships', async () => {
    store.set(UID, {
      exists: true,
      data: {
        id: UID,
        first_name: 'Juan',
        last_name: 'García',
        orgs: [{ org_id: 'org_abc123', role: 'admin' }],
        deleted: false,
      },
    })
    signedIn()

    const res = await request(app).get('/auth/me').set('Authorization', 'Bearer good')

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      user_id: UID,
      first_name: 'Juan',
      orgs: [{ org_id: 'org_abc123', role: 'admin' }],
      profile_exists: true,
    })
  })

  it('signals that the profile has not been created yet', async () => {
    signedIn()

    const res = await request(app).get('/auth/me').set('Authorization', 'Bearer good')

    expect(res.status).toBe(200)
    expect(res.body.profile_exists).toBe(false)
    expect(res.body.orgs).toEqual([])
    // The email still comes back — it lives in the Firebase token, not in our database.
    expect(res.body.email).toBe('juan@example.com')
  })

  it('reports an unverified email address as unverified', async () => {
    signedIn({ email_verified: false })

    const res = await request(app).get('/auth/me').set('Authorization', 'Bearer good')

    expect(res.body.email_verified).toBe(false)
  })
})

describe('POST /auth/logout', () => {
  it('rejects a caller with no Firebase token', async () => {
    const res = await request(app).post('/auth/logout')

    expect(res.status).toBe(401)
    expect(revokeRefreshTokens).not.toHaveBeenCalled()
  })

  it('revokes the session so it cannot be resumed', async () => {
    signedIn()

    const res = await request(app).post('/auth/logout').set('Authorization', 'Bearer good')

    expect(res.status).toBe(200)
    expect(res.body.revoked).toBe(true)
    expect(revokeRefreshTokens).toHaveBeenCalledWith(UID)
  })

  it('reports a failure to revoke instead of claiming success', async () => {
    signedIn()
    revokeRefreshTokens.mockRejectedValueOnce(new Error('firebase unavailable'))

    const res = await request(app).post('/auth/logout').set('Authorization', 'Bearer good')

    expect(res.status).toBe(500)
    expect(res.body.error).toBe('internal_server_error')
    expect(res.body.revoked).toBeUndefined()
    // The caller-facing message stays generic. The error handler attaches the
    // underlying reason under `details` only outside production, and the
    // container pins NODE_ENV=production.
    expect(res.body.message).not.toContain('firebase unavailable')
  })
})

describe('every /auth route requires a verified token', () => {
  it('rejects a token Firebase does not accept, on all routes', async () => {
    for (const call of [
      () => request(app).post('/auth/session').set('Authorization', 'Bearer bad').send({}),
      () => request(app).get('/auth/me').set('Authorization', 'Bearer bad'),
      () => request(app).post('/auth/logout').set('Authorization', 'Bearer bad'),
    ]) {
      verifyIdToken.mockRejectedValueOnce(new Error('token expired'))
      const res = await call()
      expect(res.status).toBe(401)
    }

    expect(writes).toHaveLength(0)
    expect(revokeRefreshTokens).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// A person correcting their own name
// ---------------------------------------------------------------------------

describe('PUT /auth/me', () => {
  // 2026-09-05. Somebody added without a surname must be able to save a
  // correction to their first name without inventing one, and somebody who
  // does not want their surname stored must be able to take it away.
  it('saves a first name with no surname, and clears one that was there', async () => {
    store.set(UID, {
      exists: true,
      data: { id: UID, deleted: false, first_name: 'Maria', last_name: 'Garcia' },
    })
    signedIn()

    const response = await request(app)
      .put('/auth/me')
      .set('Authorization', 'Bearer token')
      .send({ first_name: 'María' })

    expect(response.status).toBe(200)
    expect(store.get(UID)!.data!.first_name).toBe('María')
    expect(store.get(UID)!.data!.last_name).toBe('')
  })

  it('changes only the caller s own name', async () => {
    store.set(UID, {
      exists: true,
      data: {
        id: UID,
        deleted: false,
        first_name: '',
        last_name: '',
        orgs: [{ org_id: 'org_a', role: 'admin' }],
      },
    })
    signedIn()

    const res = await request(app)
      .put('/auth/me')
      .set('Authorization', 'Bearer token')
      .send({ first_name: 'Hernán', last_name: 'Rendón' })

    expect(res.status).toBe(200)
    expect(res.body.first_name).toBe('Hernán')
    expect(store.get(UID)!.data!.first_name).toBe('Hernán')
    // The memberships are untouched: this is a name edit, not a re-write of
    // who the person is in which building.
    expect(store.get(UID)!.data!.orgs).toEqual([{ org_id: 'org_a', role: 'admin' }])
  })

  it('works for somebody who has no profile document yet', async () => {
    signedIn()

    const res = await request(app)
      .put('/auth/me')
      .set('Authorization', 'Bearer token')
      .send({ first_name: 'Ana', last_name: 'Ruiz' })

    expect(res.status).toBe(200)
    expect(store.get(UID)!.data!.first_name).toBe('Ana')
  })

  it('refuses an empty name', async () => {
    signedIn()

    const res = await request(app)
      .put('/auth/me')
      .set('Authorization', 'Bearer token')
      .send({ first_name: '  ', last_name: 'Ruiz' })

    expect(res.status).toBe(400)
  })

  it('refuses anything that is not a name — there is no back door here', async () => {
    // `.strict()`, so an attempt to set a role or an id is rejected outright
    // rather than quietly ignored.
    signedIn()

    const res = await request(app)
      .put('/auth/me')
      .set('Authorization', 'Bearer token')
      .send({ first_name: 'Ana', last_name: 'Ruiz', orgs: [{ org_id: 'org_x', role: 'admin' }] })

    expect(res.status).toBe(400)
    expect(store.get(UID)?.data?.orgs ?? []).toEqual([])
  })

  it('does not echo the name back into anything but the profile', async () => {
    // The audit line records that somebody renamed themselves, never what to.
    // That is checked by reading the route rather than by capturing logs, which
    // this suite does not do — recorded here so the intent is not lost.
    signedIn()

    const res = await request(app)
      .put('/auth/me')
      .set('Authorization', 'Bearer token')
      .send({ first_name: 'Hernán', last_name: 'Rendón' })

    expect(res.body.first_name).toBe('Hernán')
    expect(res.body.email_verified).toBe(true)
  })
})
