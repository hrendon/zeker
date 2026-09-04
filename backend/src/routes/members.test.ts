import { beforeEach, describe, expect, it, vi } from 'vitest'
import request from 'supertest'
import { FakeFirestore, FieldValue } from '../test/fakeFirestore.js'

const verifyIdToken = vi.fn()
const getUserByEmail = vi.fn()
const createUser = vi.fn()
const getUsers = vi.fn()
const store = new FakeFirestore()

vi.mock('../lib/firebase.js', () => ({
  db: () => store,
  auth: () => ({
    verifyIdToken,
    revokeRefreshTokens: vi.fn(),
    getUserByEmail,
    createUser,
    getUsers,
  }),
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

function signedInAs(uid: string) {
  verifyIdToken.mockResolvedValueOnce({ uid, email: `${uid}@example.com`, email_verified: true })
}

function seedOrg(orgId: string) {
  store.seed(`orgs/${orgId}`, {
    id: orgId,
    name: 'Unidad Residencial Y',
    type: 'residence',
    plan: 'free',
    limits: { max_locations: 1, max_interiors: 10 },
    counts: { locations: 1, interiors: 0 },
    status: 'active',
  })
}

function seedMember(uid: string, orgId: string, role: string, names: Record<string, string> = {}) {
  const existing = (store.docs.get(`users/${uid}`)?.orgs as unknown[]) ?? []
  store.seed(`users/${uid}`, {
    id: uid,
    deleted: false,
    first_name: 'Nombre',
    last_name: 'Apellido',
    ...names,
    orgs: [...existing, { org_id: orgId, role }],
  })
}

/** Firebase says this email has no account yet. */
function accountDoesNotExist() {
  getUserByEmail.mockRejectedValueOnce({ code: 'auth/user-not-found' })
}

const NEW_MEMBER = {
  email: 'maria@example.com',
  first_name: 'María',
  last_name: 'García',
  role: 'responsable',
}

function orgsOf(uid: string): Array<{ org_id: string; role: string }> {
  return (store.docs.get(`users/${uid}`)?.orgs ?? []) as Array<{ org_id: string; role: string }>
}

beforeEach(() => {
  store.reset()
  vi.clearAllMocks()
  seedOrg(ORG)
  seedOrg(OTHER_ORG)
  seedMember(ADMIN, ORG, 'admin', { first_name: 'Ana', last_name: 'Admin' })
  getUsers.mockResolvedValue({ users: [], notFound: [] })
})

describe('POST /orgs/:orgId/members', () => {
  it('creates the account when the person has none, and makes them a member', async () => {
    accountDoesNotExist()
    createUser.mockResolvedValueOnce({ uid: RESIDENT })
    signedInAs(ADMIN)

    const response = await request(app)
      .post(`/orgs/${ORG}/members`)
      .set('Authorization', 'Bearer token')
      .send(NEW_MEMBER)

    expect(response.status).toBe(201)
    expect(response.body.user_id).toBe(RESIDENT)
    // The account was created a moment ago; nobody has used it yet.
    expect(response.body.has_signed_in).toBe(false)
    expect(response.body.role).toBe('responsable')
    expect(response.body.first_name).toBe('María')
    expect(orgsOf(RESIDENT)).toEqual([{ org_id: ORG, role: 'responsable' }])

    // The password is generated and thrown away; nobody is ever told it.
    expect(createUser).toHaveBeenCalledOnce()
    expect(createUser.mock.calls[0]![0].password).toEqual(expect.any(String))
    expect(response.text).not.toContain(createUser.mock.calls[0]![0].password)
  })

  it('reuses the account when the person already has one', async () => {
    getUserByEmail.mockResolvedValueOnce({ uid: RESIDENT })
    store.seed(`users/${RESIDENT}`, {
      id: RESIDENT,
      first_name: 'María',
      last_name: 'García',
      deleted: false,
      orgs: [{ org_id: OTHER_ORG, role: 'admin' }],
    })
    signedInAs(ADMIN)

    const response = await request(app)
      .post(`/orgs/${ORG}/members`)
      .set('Authorization', 'Bearer token')
      .send(NEW_MEMBER)

    expect(response.status).toBe(201)
    expect(createUser).not.toHaveBeenCalled()
    // Their membership elsewhere is untouched — one person, several buildings.
    expect(orgsOf(RESIDENT)).toEqual([
      { org_id: OTHER_ORG, role: 'admin' },
      { org_id: ORG, role: 'responsable' },
    ])
  })

  it('answers the same whether or not the account already existed', async () => {
    accountDoesNotExist()
    createUser.mockResolvedValueOnce({ uid: RESIDENT })
    signedInAs(ADMIN)
    const created = await request(app)
      .post(`/orgs/${ORG}/members`)
      .set('Authorization', 'Bearer token')
      .send(NEW_MEMBER)

    store.reset()
    seedOrg(ORG)
    seedMember(ADMIN, ORG, 'admin', { first_name: 'Ana', last_name: 'Admin' })
    store.seed(`users/${RESIDENT}`, {
      id: RESIDENT,
      first_name: 'María',
      last_name: 'García',
      deleted: false,
      orgs: [],
    })
    getUserByEmail.mockResolvedValueOnce({ uid: RESIDENT })
    signedInAs(ADMIN)
    const reused = await request(app)
      .post(`/orgs/${ORG}/members`)
      .set('Authorization', 'Bearer token')
      .send(NEW_MEMBER)

    // An administrator must not learn which emails already belong to a user.
    expect(reused.status).toBe(created.status)
    expect(Object.keys(reused.body).sort()).toEqual(Object.keys(created.body).sort())
  })

  it('does not overwrite the name of someone who already has a profile', async () => {
    getUserByEmail.mockResolvedValueOnce({ uid: RESIDENT })
    store.seed(`users/${RESIDENT}`, {
      id: RESIDENT,
      first_name: 'Mariana',
      last_name: 'Gutiérrez',
      deleted: false,
      orgs: [],
    })
    signedInAs(ADMIN)

    await request(app)
      .post(`/orgs/${ORG}/members`)
      .set('Authorization', 'Bearer token')
      .send(NEW_MEMBER)

    expect(store.docs.get(`users/${RESIDENT}`)?.first_name).toBe('Mariana')
    expect(store.docs.get(`users/${RESIDENT}`)?.last_name).toBe('Gutiérrez')
  })

  it('stores no email address in our database', async () => {
    accountDoesNotExist()
    createUser.mockResolvedValueOnce({ uid: RESIDENT })
    signedInAs(ADMIN)

    await request(app)
      .post(`/orgs/${ORG}/members`)
      .set('Authorization', 'Bearer token')
      .send(NEW_MEMBER)

    expect(JSON.stringify(store.docs.get(`users/${RESIDENT}`))).not.toContain('maria@example.com')
  })

  it('refuses a role an administrator may not grant', async () => {
    signedInAs(ADMIN)

    const response = await request(app)
      .post(`/orgs/${ORG}/members`)
      .set('Authorization', 'Bearer token')
      .send({ ...NEW_MEMBER, role: 'admin' })

    expect(response.status).toBe(400)
    expect(response.body.error).toBe('invalid_request')
    expect(createUser).not.toHaveBeenCalled()
  })

  it('refuses an address that is not an email', async () => {
    signedInAs(ADMIN)

    const response = await request(app)
      .post(`/orgs/${ORG}/members`)
      .set('Authorization', 'Bearer token')
      .send({ ...NEW_MEMBER, email: 'not-an-email' })

    expect(response.status).toBe(400)
    expect(createUser).not.toHaveBeenCalled()
  })

  it('does not let an administrator change their own role', async () => {
    getUserByEmail.mockResolvedValueOnce({ uid: ADMIN })
    signedInAs(ADMIN)

    const response = await request(app)
      .post(`/orgs/${ORG}/members`)
      .set('Authorization', 'Bearer token')
      .send({ ...NEW_MEMBER, email: 'ana@example.com' })

    expect(response.status).toBe(409)
    expect(orgsOf(ADMIN)).toEqual([{ org_id: ORG, role: 'admin' }])
  })

  it('is refused for a resident of the same organization', async () => {
    seedMember(RESIDENT, ORG, 'responsable')
    signedInAs(RESIDENT)

    const response = await request(app)
      .post(`/orgs/${ORG}/members`)
      .set('Authorization', 'Bearer token')
      .send(NEW_MEMBER)

    expect(response.status).toBe(403)
    expect(createUser).not.toHaveBeenCalled()
  })
})

describe('GET /orgs/:orgId/members', () => {
  it('lists the people in this organization only', async () => {
    seedMember(RESIDENT, ORG, 'responsable', { first_name: 'María', last_name: 'García' })
    seedMember(GUARD, ORG, 'security', { first_name: 'Pedro', last_name: 'Vigilante' })
    seedMember(OUTSIDER, OTHER_ORG, 'admin', { first_name: 'Zoe', last_name: 'Otra' })
    getUsers.mockResolvedValue({
      users: [{ uid: RESIDENT, email: 'maria@example.com' }],
      notFound: [],
    })
    signedInAs(ADMIN)

    const response = await request(app)
      .get(`/orgs/${ORG}/members`)
      .set('Authorization', 'Bearer token')

    expect(response.status).toBe(200)
    expect(response.body.members.map((m: { user_id: string }) => m.user_id)).toEqual([
      ADMIN,
      RESIDENT,
      GUARD,
    ])
    expect(response.body.members[1].email).toBe('maria@example.com')
    // Firebase had no email for the guard; the list still answers.
    expect(response.body.members[2].email).toBeNull()
  })

  it('says who has never signed in, and stays silent about who it cannot read', async () => {
    seedMember(RESIDENT, ORG, 'responsable', { first_name: 'María', last_name: 'García' })
    seedMember(GUARD, ORG, 'security', { first_name: 'Pedro', last_name: 'Vigilante' })
    getUsers.mockResolvedValue({
      users: [
        // Invited, never opened the email: the account exists, the person is out.
        { uid: RESIDENT, email: 'maria@example.com', metadata: { lastSignInTime: '' } },
        {
          uid: ADMIN,
          email: 'ana@example.com',
          metadata: { lastSignInTime: 'Mon, 01 Sep 2026 10:00:00 GMT' },
        },
      ],
      notFound: [{ uid: GUARD }],
    })
    signedInAs(ADMIN)

    const response = await request(app)
      .get(`/orgs/${ORG}/members`)
      .set('Authorization', 'Bearer token')

    expect(response.status).toBe(200)
    const [admin, maria, guard] = response.body.members
    expect(admin.has_signed_in).toBe(true)
    expect(maria.has_signed_in).toBe(false)
    // Firebase did not return this account. Unknown is not "has not entered".
    expect(guard.has_signed_in).toBeNull()
  })

  it('is refused for a resident — one neighbour cannot list the others', async () => {
    seedMember(RESIDENT, ORG, 'responsable')
    signedInAs(RESIDENT)

    const response = await request(app)
      .get(`/orgs/${ORG}/members`)
      .set('Authorization', 'Bearer token')

    expect(response.status).toBe(403)
  })
})

describe('DELETE /orgs/:orgId/members/:userId', () => {
  it('removes the membership without touching the account', async () => {
    seedMember(RESIDENT, ORG, 'responsable')
    seedMember(RESIDENT, OTHER_ORG, 'responsable')
    signedInAs(ADMIN)

    const response = await request(app)
      .delete(`/orgs/${ORG}/members/${RESIDENT}`)
      .set('Authorization', 'Bearer token')

    expect(response.status).toBe(200)
    expect(response.body.removed).toBe(true)
    // Still a member where they belong; the account itself survives.
    expect(orgsOf(RESIDENT)).toEqual([{ org_id: OTHER_ORG, role: 'responsable' }])
    expect(store.docs.get(`users/${RESIDENT}`)).toBeDefined()
  })

  it('is refused while the person is in charge of an interior', async () => {
    seedMember(RESIDENT, ORG, 'responsable')
    store.seed(`orgs/${ORG}/interiors/int_302`, {
      id: 'int_302',
      org_id: ORG,
      location_id: 'loc_a',
      number: '302',
      responsable_user_id: RESIDENT,
      enabled: true,
    })
    signedInAs(ADMIN)

    const response = await request(app)
      .delete(`/orgs/${ORG}/members/${RESIDENT}`)
      .set('Authorization', 'Bearer token')

    expect(response.status).toBe(409)
    expect(orgsOf(RESIDENT)).toEqual([{ org_id: ORG, role: 'responsable' }])
  })

  it('does not let an administrator remove themselves', async () => {
    signedInAs(ADMIN)

    const response = await request(app)
      .delete(`/orgs/${ORG}/members/${ADMIN}`)
      .set('Authorization', 'Bearer token')

    expect(response.status).toBe(409)
    expect(orgsOf(ADMIN)).toEqual([{ org_id: ORG, role: 'admin' }])
  })

  it('reports a person who is not a member as not found', async () => {
    seedMember(OUTSIDER, OTHER_ORG, 'admin')
    signedInAs(ADMIN)

    const response = await request(app)
      .delete(`/orgs/${ORG}/members/${OUTSIDER}`)
      .set('Authorization', 'Bearer token')

    expect(response.status).toBe(404)
    expect(orgsOf(OUTSIDER)).toEqual([{ org_id: OTHER_ORG, role: 'admin' }])
  })
})

/**
 * The isolation tests every org-scoped route ships with. Since Decision 004
 * closed direct database access, backend code is the only thing keeping one
 * customer away from another's data.
 */
describe('organization isolation', () => {
  beforeEach(() => {
    seedMember(OUTSIDER, OTHER_ORG, 'admin')
  })

  it('an outsider cannot list this organization members', async () => {
    signedInAs(OUTSIDER)

    const response = await request(app)
      .get(`/orgs/${ORG}/members`)
      .set('Authorization', 'Bearer token')

    // 404, not 403: telling a stranger the organization exists is itself a leak.
    expect(response.status).toBe(404)
  })

  it('an outsider cannot add a person to this organization', async () => {
    signedInAs(OUTSIDER)

    const response = await request(app)
      .post(`/orgs/${ORG}/members`)
      .set('Authorization', 'Bearer token')
      .send(NEW_MEMBER)

    expect(response.status).toBe(404)
    expect(createUser).not.toHaveBeenCalled()
  })

  it('an outsider cannot remove a person from this organization', async () => {
    seedMember(RESIDENT, ORG, 'responsable')
    signedInAs(OUTSIDER)

    const response = await request(app)
      .delete(`/orgs/${ORG}/members/${RESIDENT}`)
      .set('Authorization', 'Bearer token')

    expect(response.status).toBe(404)
    expect(orgsOf(RESIDENT)).toEqual([{ org_id: ORG, role: 'responsable' }])
  })
})

// ---------------------------------------------------------------------------
// R-02 — how many people one organization may add, and how many in a day
// ---------------------------------------------------------------------------

describe('the limits on adding people (R-02)', () => {
  /** Puts the organization's counters wherever a test needs them. */
  function orgWith(fields: Record<string, unknown>) {
    store.seed(`orgs/${ORG}`, {
      ...(store.docs.get(`orgs/${ORG}`) as Record<string, unknown>),
      ...fields,
    })
  }

  function org(): Record<string, unknown> {
    return store.docs.get(`orgs/${ORG}`) as Record<string, unknown>
  }

  const today = new Date().toISOString().slice(0, 10)

  function addSomebody(uid: string, email: string) {
    accountDoesNotExist()
    createUser.mockResolvedValueOnce({ uid })
    signedInAs(ADMIN)
    return request(app)
      .post(`/orgs/${ORG}/members`)
      .set('Authorization', 'Bearer token')
      .send({ ...NEW_MEMBER, email })
  }

  it('counts a person on the organization when one is added', async () => {
    await addSomebody(RESIDENT, 'maria@example.com')

    expect(org().counts).toMatchObject({ members: 1 })
    expect(org().invites_today).toBe(1)
    expect(org().invites_day).toBe(today)
  })

  it('refuses once the organization is full, and says it is a plan limit', async () => {
    orgWith({ counts: { locations: 1, interiors: 0, members: 25 } })

    const res = await addSomebody(RESIDENT, 'maria@example.com')

    expect(res.status).toBe(403)
    expect(res.body.error).toBe('quota_exceeded')
    // Refused before the account exists: no orphan, and no email.
    expect(createUser).not.toHaveBeenCalled()
  })

  it('refuses after the day s invitations are used up, with its own code', async () => {
    orgWith({ invites_day: today, invites_today: 15 })

    const res = await addSomebody(RESIDENT, 'maria@example.com')

    expect(res.status).toBe(429)
    expect(res.body.error).toBe('invite_limit_reached')
    expect(createUser).not.toHaveBeenCalled()
  })

  it('gives the day s allowance back when the day changes, and never carries yesterday forward', async () => {
    orgWith({ invites_day: '2020-01-01', invites_today: 15 })

    const res = await addSomebody(RESIDENT, 'maria@example.com')

    expect(res.status).toBe(201)
    // Replaced, not incremented: yesterday's 15 must not become today's 16.
    expect(org().invites_today).toBe(1)
    expect(org().invites_day).toBe(today)
  })

  it('gives a place back when somebody is removed', async () => {
    orgWith({ counts: { locations: 1, interiors: 0, members: 3 } })
    seedMember(RESIDENT, ORG, 'responsable')
    signedInAs(ADMIN)

    await request(app)
      .delete(`/orgs/${ORG}/members/${RESIDENT}`)
      .set('Authorization', 'Bearer token')

    expect(org().counts).toMatchObject({ members: 2 })
  })

  it('does NOT give the day s invitation back when somebody is removed', async () => {
    // The whole point of the daily counter. Removing a person does not un-send
    // the email their address already received, so add-and-remove must not be
    // a way to send an unlimited number of them.
    orgWith({
      counts: { locations: 1, interiors: 0, members: 3 },
      invites_day: today,
      invites_today: 9,
    })
    seedMember(RESIDENT, ORG, 'responsable')
    signedInAs(ADMIN)

    await request(app)
      .delete(`/orgs/${ORG}/members/${RESIDENT}`)
      .set('Authorization', 'Bearer token')

    expect(org().invites_today).toBe(9)
  })

  it('lets a full organization still change somebody s role', async () => {
    // Being at the limit must not trap an administrator: changing a role adds
    // nobody and sends nothing.
    orgWith({ counts: { locations: 1, interiors: 0, members: 25 } })
    seedMember(RESIDENT, ORG, 'responsable')
    getUserByEmail.mockResolvedValueOnce({ uid: RESIDENT })
    signedInAs(ADMIN)

    const res = await request(app)
      .post(`/orgs/${ORG}/members`)
      .set('Authorization', 'Bearer token')
      .send({ ...NEW_MEMBER, role: 'security' })

    expect(res.status).toBe(201)
    expect(orgsOf(RESIDENT)).toEqual([{ org_id: ORG, role: 'security' }])
    // And it consumed neither allowance.
    expect(org().counts).toMatchObject({ members: 25 })
    expect(org().invites_today ?? 0).toBe(0)
  })

  it('reads an organization created before today as having no members counted', async () => {
    // Nothing counted members before 2026-09-04. Such an organization gets a
    // slightly larger allowance than a new one, never a smaller one — and it
    // must never be refused for a counter that was never written.
    orgWith({ counts: { locations: 1, interiors: 0 } })

    const res = await addSomebody(RESIDENT, 'maria@example.com')

    expect(res.status).toBe(201)
  })
})

// ---------------------------------------------------------------------------
// Decision 018 — a person approves the building before anybody else exists in it
// ---------------------------------------------------------------------------

describe('a building nobody has approved yet', () => {
  function unapproved() {
    store.seed(`orgs/${ORG}`, {
      ...(store.docs.get(`orgs/${ORG}`) as Record<string, unknown>),
      approved: false,
    })
  }

  it('cannot add a person, and says why in its own words', async () => {
    unapproved()
    accountDoesNotExist()
    createUser.mockResolvedValueOnce({ uid: RESIDENT })
    signedInAs(ADMIN)

    const res = await request(app)
      .post(`/orgs/${ORG}/members`)
      .set('Authorization', 'Bearer token')
      .send(NEW_MEMBER)

    expect(res.status).toBe(403)
    // Not `forbidden`: an administrator told "no tiene permiso" goes looking
    // for a role they lack, when what is missing is an approval.
    expect(res.body.error).toBe('org_not_approved')
    // And nothing happened at Google: no account, so no email.
    expect(createUser).not.toHaveBeenCalled()
  })

  it('can still be looked at — the wall is on writing about other people', async () => {
    unapproved()
    seedMember(RESIDENT, ORG, 'responsable')
    signedInAs(ADMIN)

    const res = await request(app)
      .get(`/orgs/${ORG}/members`)
      .set('Authorization', 'Bearer token')

    expect(res.status).toBe(200)
  })

  it('lets a building with no approval field through, because absent means approved', async () => {
    // Every organization created before 2026-09-04 is in exactly this state.
    // Reading a missing field as "not approved" would lock people out of
    // buildings they already run, to enforce a rule that did not exist when
    // they created them.
    accountDoesNotExist()
    createUser.mockResolvedValueOnce({ uid: RESIDENT })
    signedInAs(ADMIN)

    const res = await request(app)
      .post(`/orgs/${ORG}/members`)
      .set('Authorization', 'Bearer token')
      .send(NEW_MEMBER)

    expect(res.status).toBe(201)
  })

  it('lets an approved building through', async () => {
    store.seed(`orgs/${ORG}`, {
      ...(store.docs.get(`orgs/${ORG}`) as Record<string, unknown>),
      approved: true,
    })
    accountDoesNotExist()
    createUser.mockResolvedValueOnce({ uid: RESIDENT })
    signedInAs(ADMIN)

    const res = await request(app)
      .post(`/orgs/${ORG}/members`)
      .set('Authorization', 'Bearer token')
      .send(NEW_MEMBER)

    expect(res.status).toBe(201)
  })
})
