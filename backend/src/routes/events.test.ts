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
/** In charge of 302. Must never see 404's entries. */
const ANA = 'user_ana'
/** In charge of 404. The other side of the same wall. */
const BRUNO = 'user_bruno'
const GUARD = 'user_guard'
const OUTSIDER = 'user_outsider'

const ORG = 'org_alpha'
const OTHER_ORG = 'org_beta'
const GATE = 'loc_porteria'
const BACK = 'loc_trasera'
const INT_302 = 'int_302'
const INT_404 = 'int_404'

const PERMIT_ANA = 'auth_ana'
const PERMIT_BRUNO = 'auth_bruno'

function signedInAs(uid: string) {
  verifyIdToken.mockResolvedValueOnce({ uid, email: `${uid}@example.com`, email_verified: true })
}

function seedOrg(orgId: string) {
  store.seed(`orgs/${orgId}`, {
    id: orgId,
    name: 'Conjunto Los Cedros',
    type: 'residence',
    plan: 'free',
    limits: { max_locations: 3, max_interiors: 10 },
    counts: { locations: 2, interiors: 2 },
    status: 'active',
  })
}

function seedMember(uid: string, orgId: string, role: string) {
  const existing = (store.docs.get(`users/${uid}`)?.orgs as unknown[]) ?? []
  store.seed(`users/${uid}`, {
    id: uid,
    deleted: false,
    first_name: 'Persona',
    last_name: 'Prueba',
    orgs: [...existing, { org_id: orgId, role }],
  })
}

function seedLocation(orgId: string, locationId: string, name: string) {
  store.seed(`orgs/${orgId}/locations/${locationId}`, {
    id: locationId,
    org_id: orgId,
    name,
    description: '',
    type: 'entrance',
    enabled: true,
    created_by: ADMIN,
  })
}

function seedInterior(orgId: string, interiorId: string, number: string, responsable: string) {
  store.seed(`orgs/${orgId}/interiors/${interiorId}`, {
    id: interiorId,
    org_id: orgId,
    location_id: GATE,
    number,
    name: '',
    responsable_user_id: responsable,
    enabled: true,
    created_by: ADMIN,
  })
}

function seedPermit(orgId: string, permitId: string, interiorId: string, visitorName: string) {
  store.seed(`orgs/${orgId}/authorizations/${permitId}`, {
    id: permitId,
    org_id: orgId,
    interior_id: interiorId,
    location_id: GATE,
    visitor_name: visitorName,
    purpose: 'visitor',
    valid_from: '2026-09-01T00:00:00.000Z',
    valid_to: '2099-01-01T00:00:00.000Z',
    code: `CODE${permitId.slice(-4)}`,
    status: 'active',
    entry_mode: 'single',
    entry_count: 0,
    entry_returns: 0,
    created_by: ADMIN,
  })
}

let clock = 0

/** One check, at a known moment. Later calls are later events. */
function seedEvent(
  eventId: string,
  extra: Partial<Record<string, unknown>> = {},
  orgId = ORG,
): string {
  clock += 60_000
  store.seed(`orgs/${orgId}/access_events/${eventId}`, {
    id: eventId,
    org_id: orgId,
    location_id: GATE,
    permit_id: PERMIT_ANA,
    interior_id: INT_302,
    action: 'entry',
    result: 'allowed',
    deny_reason: null,
    note: null,
    about_event_id: null,
    entry_returned: null,
    scanned_code: null,
    checked_by: GUARD,
    request_id: 'req_seed',
    created_at: new Date(Date.UTC(2026, 8, 3, 8, 0, 0) + clock),
    expires_at: new Date(Date.UTC(2026, 11, 2)),
    ...extra,
  })
  return eventId
}

function list(
  uid: string,
  query = '',
  orgId = ORG,
): ReturnType<ReturnType<typeof request>['get']> {
  signedInAs(uid)
  return request(app)
    .get(`/orgs/${orgId}/events${query}`)
    .set('Authorization', 'Bearer token')
}

beforeEach(() => {
  store.reset()
  vi.clearAllMocks()
  clock = 0
  seedOrg(ORG)
  seedOrg(OTHER_ORG)
  seedMember(ADMIN, ORG, 'admin')
  seedMember(ANA, ORG, 'responsable')
  seedMember(BRUNO, ORG, 'responsable')
  seedMember(GUARD, ORG, 'security')
  seedMember(OUTSIDER, OTHER_ORG, 'admin')
  seedLocation(ORG, GATE, 'Portería principal')
  seedLocation(ORG, BACK, 'Puerta trasera')
  seedInterior(ORG, INT_302, '302', ANA)
  seedInterior(ORG, INT_404, '404', BRUNO)
  seedPermit(ORG, PERMIT_ANA, INT_302, 'Ana Ruiz')
  seedPermit(ORG, PERMIT_BRUNO, INT_404, 'Bruno Díaz')
})

// ---------------------------------------------------------------------------
// Who may read it
// ---------------------------------------------------------------------------

describe('GET /orgs/:orgId/events — who may read it', () => {
  it('shows an administrator every check in the organization', async () => {
    seedEvent('event_1')
    seedEvent('event_2', { permit_id: PERMIT_BRUNO, interior_id: INT_404 })

    const res = await list(ADMIN)

    expect(res.status).toBe(200)
    expect(res.body.events.map((one: { id: string }) => one.id).sort()).toEqual([
      'event_1',
      'event_2',
    ])
  })

  it('never shows a responsable another apartment’s entries', async () => {
    // The acceptance criterion Product Owner named for this unit. Ana is in
    // charge of 302; 404 is Bruno's and none of her business.
    seedEvent('event_ana')
    seedEvent('event_bruno', { permit_id: PERMIT_BRUNO, interior_id: INT_404 })

    const res = await list(ANA)

    expect(res.status).toBe(200)
    expect(res.body.events).toHaveLength(1)
    expect(res.body.events[0].id).toBe('event_ana')
    expect(res.body.events[0].interior_number).toBe('302')
    // Not a word about the other apartment, anywhere in the answer.
    expect(JSON.stringify(res.body)).not.toContain(INT_404)
    expect(JSON.stringify(res.body)).not.toContain('Bruno')
  })

  it('shows each responsable only their own side of the wall', async () => {
    seedEvent('event_ana')
    seedEvent('event_bruno', { permit_id: PERMIT_BRUNO, interior_id: INT_404 })

    const forBruno = await list(BRUNO)

    expect(forBruno.body.events).toHaveLength(1)
    expect(forBruno.body.events[0].id).toBe('event_bruno')
    expect(JSON.stringify(forBruno.body)).not.toContain('Ana Ruiz')
  })

  it('refuses a guard, who may check but never read back', async () => {
    // Decision 007 kept a guard from listing permits, because whoever can list
    // them knows who is expected where all day. A readable history is the same
    // knowledge afterwards.
    seedEvent('event_1')

    const res = await list(GUARD)

    expect(res.status).toBe(403)
    expect(res.body.events).toBeUndefined()
  })

  it('tells somebody from another organization that nothing is here', async () => {
    seedEvent('event_1')

    expect((await list(OUTSIDER)).status).toBe(404)
  })

  it('gives a responsable with no interiors an empty list, not an error', async () => {
    seedEvent('event_1')
    store.docs.delete(`orgs/${ORG}/interiors/${INT_302}`)

    const res = await list(ANA)

    expect(res.status).toBe(200)
    expect(res.body.events).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// What a line says
// ---------------------------------------------------------------------------

describe('GET /orgs/:orgId/events — what a line says', () => {
  it('resolves the name from the permit, which the event does not hold', async () => {
    seedEvent('event_1')

    const res = await list(ADMIN)
    const event = res.body.events[0]

    expect(event.visitor_name).toBe('Ana Ruiz')
    expect(event.interior_number).toBe('302')
    expect(event.location_name).toBe('Portería principal')
    // The stored event still holds no name — that is the point.
    const stored = store.docs.get(`orgs/${ORG}/access_events/event_1`)!
    expect(stored.visitor_name).toBeUndefined()
  })

  it('still shows a check whose permit was deleted', async () => {
    // The check happened. Hiding the row would be a hole in an audit trail.
    seedEvent('event_1')
    store.docs.delete(`orgs/${ORG}/authorizations/${PERMIT_ANA}`)

    const res = await list(ADMIN)

    expect(res.body.events).toHaveLength(1)
    expect(res.body.events[0].visitor_name).toBe('')
  })

  it('names the reason a check was refused', async () => {
    seedEvent('event_1', { result: 'denied', deny_reason: 'already_used' })

    const res = await list(ADMIN)

    expect(res.body.events[0].result).toBe('denied')
    expect(res.body.events[0].deny_reason).toBe('already_used')
  })

  it('shows a guard’s note as its own line, pointing at the check', async () => {
    // Decision 015: a correction is a new record, never an edit. The history
    // shows both, or it is not showing what happened.
    seedEvent('event_1')
    seedEvent('event_2', {
      action: 'note',
      note: 'no_entry',
      about_event_id: 'event_1',
      entry_returned: true,
    })

    const res = await list(ADMIN)
    const note = res.body.events.find((one: { action: string }) => one.action === 'note')

    expect(note.note).toBe('no_entry')
    expect(note.about_event_id).toBe('event_1')
    expect(note.entry_returned).toBe(true)
  })

  it('never returns a permit code', async () => {
    seedEvent('event_1')
    seedEvent('event_2', { permit_id: null, interior_id: null, scanned_code: 'ZZZZ9999' })

    const res = await list(ADMIN)

    // A live code has no business on a screen more people can open, and the
    // one typed at a failed check is not echoed back either.
    expect(JSON.stringify(res.body)).not.toContain('CODE')
    expect(JSON.stringify(res.body)).not.toContain('ZZZZ9999')
  })
})

// ---------------------------------------------------------------------------
// Order, filters and paging
// ---------------------------------------------------------------------------

describe('GET /orgs/:orgId/events — order, filters and paging', () => {
  it('puts the most recent first', async () => {
    seedEvent('event_old')
    seedEvent('event_middle')
    seedEvent('event_new')

    const res = await list(ADMIN)

    expect(res.body.events.map((one: { id: string }) => one.id)).toEqual([
      'event_new',
      'event_middle',
      'event_old',
    ])
  })

  it('narrows to the refused ones', async () => {
    seedEvent('event_ok')
    seedEvent('event_no', { result: 'denied', deny_reason: 'expired' })

    const res = await list(ADMIN, '?result=denied')

    expect(res.body.events).toHaveLength(1)
    expect(res.body.events[0].id).toBe('event_no')
  })

  it('narrows a responsable to their own refused ones, and no further', async () => {
    seedEvent('event_ana_no', { result: 'denied', deny_reason: 'expired' })
    seedEvent('event_bruno_no', {
      permit_id: PERMIT_BRUNO,
      interior_id: INT_404,
      result: 'denied',
      deny_reason: 'expired',
    })

    const res = await list(ANA, '?result=denied')

    expect(res.body.events).toHaveLength(1)
    expect(res.body.events[0].id).toBe('event_ana_no')
  })

  it('bounds the range, with "to" excluded so a whole day is one call', async () => {
    seedEvent('event_1') // 08:01
    seedEvent('event_2') // 08:02
    seedEvent('event_3') // 08:03

    const res = await list(
      ADMIN,
      '?from=2026-09-03T08:02:00.000Z&to=2026-09-03T08:03:00.000Z',
    )

    expect(res.body.events.map((one: { id: string }) => one.id)).toEqual(['event_2'])
  })

  it('refuses a range that runs backwards', async () => {
    const res = await list(ADMIN, '?from=2026-09-03T10:00:00.000Z&to=2026-09-03T09:00:00.000Z')

    expect(res.status).toBe(400)
  })

  it('refuses a date that is not a date, and an unknown filter', async () => {
    expect((await list(ADMIN, '?from=ayer')).status).toBe(400)
    expect((await list(ADMIN, '?resultado=denied')).status).toBe(400)
    expect((await list(ADMIN, '?limit=0')).status).toBe(400)
    expect((await list(ADMIN, '?limit=500')).status).toBe(400)
  })

  it('pages without skipping or repeating a row', async () => {
    for (let i = 1; i <= 5; i += 1) seedEvent(`event_${i}`)

    const first = await list(ADMIN, '?limit=2')
    expect(first.body.events.map((one: { id: string }) => one.id)).toEqual(['event_5', 'event_4'])
    expect(first.body.next_cursor).toBe('event_4')

    const second = await list(ADMIN, `?limit=2&cursor=${first.body.next_cursor}`)
    expect(second.body.events.map((one: { id: string }) => one.id)).toEqual(['event_3', 'event_2'])

    const third = await list(ADMIN, `?limit=2&cursor=${second.body.next_cursor}`)
    expect(third.body.events.map((one: { id: string }) => one.id)).toEqual(['event_1'])
    // The last page says so, rather than handing back a cursor to nothing.
    expect(third.body.next_cursor).toBeNull()
  })

  it('treats a cursor pointing at a deleted event as the start, not an error', async () => {
    // Retention deletes events while somebody has a screen open.
    seedEvent('event_1')

    const res = await list(ADMIN, '?cursor=event_gone_at_90_days')

    expect(res.status).toBe(200)
    expect(res.body.events).toHaveLength(1)
  })
})
