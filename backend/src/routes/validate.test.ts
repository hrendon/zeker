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
const { EVENT_RETENTION_DAYS, retentionDate } = await import('../lib/events.js')
const app = createApp()

const ADMIN = 'user_admin'
const RESIDENT = 'user_resident'
const GUARD = 'user_guard'
/** A guard at a different organization entirely. */
const OUTSIDER = 'user_outsider'

const ORG = 'org_alpha'
const OTHER_ORG = 'org_beta'
/** The main gate, and a second entrance at the same organization. */
const GATE = 'loc_porteria'
const BACK_GATE = 'loc_puerta_trasera'
const RETIRED_GATE = 'loc_retirada'
const INT_302 = 'int_302'

const PERMIT = 'auth_live'
const CODE = 'A1B2C3D4'

const DAY = 24 * 60 * 60 * 1000

const PAST_FROM = '2020-01-01T00:00:00.000Z'
const PAST_TO = '2020-01-02T00:00:00.000Z'
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
    limits: { max_locations: 3, max_interiors: 10 },
    counts: { locations: 3, interiors: 1 },
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

function seedLocation(orgId: string, locationId: string, name: string, enabled = true) {
  store.seed(`orgs/${orgId}/locations/${locationId}`, {
    id: locationId,
    org_id: orgId,
    name,
    description: '',
    type: 'entrance',
    enabled,
    created_by: ADMIN,
  })
}

function seedInterior(orgId: string, interiorId: string, number: string) {
  store.seed(`orgs/${orgId}/interiors/${interiorId}`, {
    id: interiorId,
    org_id: orgId,
    location_id: GATE,
    number,
    name: '',
    responsable_user_id: RESIDENT,
    enabled: true,
    created_by: ADMIN,
  })
}

function seedPermit(orgId: string, permitId: string, extra: Record<string, unknown> = {}) {
  store.seed(`orgs/${orgId}/authorizations/${permitId}`, {
    id: permitId,
    org_id: orgId,
    interior_id: INT_302,
    location_id: GATE,
    visitor_name: 'Ana Ruiz',
    purpose: 'pickup',
    valid_from: PAST_FROM,
    valid_to: FUTURE,
    code: CODE,
    status: 'active',
    created_by: RESIDENT,
    revoked_at: null,
    revoked_by: null,
    ...extra,
  })
}

/** Every access event written so far, in the order they were written. */
function events(orgId = ORG): Array<Record<string, unknown>> {
  const prefix = `orgs/${orgId}/access_events/`
  return [...store.docs.entries()]
    .filter(([path]) => path.startsWith(prefix))
    .map(([, data]) => data)
}

function check(
  uid: string,
  body: Record<string, unknown>,
  orgId = ORG,
): ReturnType<ReturnType<typeof request>['post']> {
  signedInAs(uid)
  return request(app)
    .post(`/orgs/${orgId}/validate`)
    .set('Authorization', 'Bearer token')
    .send(body)
}

beforeEach(() => {
  store.reset()
  vi.clearAllMocks()
  seedOrg(ORG)
  seedOrg(OTHER_ORG)
  seedMember(ADMIN, ORG, 'admin', 'Carlos Admin')
  seedMember(RESIDENT, ORG, 'responsable', 'María García')
  seedMember(GUARD, ORG, 'security', 'Luis Guard')
  seedMember(OUTSIDER, OTHER_ORG, 'security', 'Eva Outsider')
  seedLocation(ORG, GATE, 'Portería principal')
  seedLocation(ORG, BACK_GATE, 'Puerta trasera')
  seedLocation(ORG, RETIRED_GATE, 'Portería vieja', false)
  seedInterior(ORG, INT_302, '302')
})

// ---------------------------------------------------------------------------
// The answer a guard gets
// ---------------------------------------------------------------------------

describe('checking a permit at a door', () => {
  it('lets a valid visitor in, and says who they are and where they are going', async () => {
    seedPermit(ORG, PERMIT)

    const response = await check(GUARD, { location_id: GATE, code: 'A1B2-C3D4' })

    expect(response.status).toBe(200)
    expect(response.body.result).toBe('allowed')
    expect(response.body.permit).toMatchObject({
      id: PERMIT,
      visitor_name: 'Ana Ruiz',
      interior_number: '302',
      purpose: 'pickup',
    })
    expect(response.body.event_id).toMatch(/^event_/)
  })

  it('never hands the code back to the guard', async () => {
    seedPermit(ORG, PERMIT)

    const response = await check(GUARD, { location_id: GATE, code: CODE })

    // The guard already has the code in front of them. Echoing a live door
    // credential into a second screen only creates another place it can leak.
    expect(JSON.stringify(response.body)).not.toContain(CODE)
  })

  it('accepts what a guard actually types, confusable letters and all', async () => {
    seedPermit(ORG, PERMIT, { code: '01B2C3D4' })

    // "O" for zero, in bad light, at a gate. This visitor is holding a valid
    // code and must not be turned away.
    const response = await check(GUARD, { location_id: GATE, code: 'o1b2 c3d4' })

    expect(response.body.result).toBe('allowed')
  })

  it('refuses a code that matches nothing, and says so', async () => {
    const response = await check(GUARD, { location_id: GATE, code: 'ZZZZ-ZZZZ' })

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({ result: 'denied', reason: 'invalid_code' })
    // Nothing is known about this code, so nothing is shown.
    expect(response.body.permit).toBeUndefined()
  })

  it('refuses a revoked permit', async () => {
    seedPermit(ORG, PERMIT, { status: 'revoked', revoked_by: RESIDENT })

    const response = await check(GUARD, { location_id: GATE, code: CODE })

    expect(response.body).toMatchObject({ result: 'denied', reason: 'revoked' })
    // The guard can still say who was turned away, which is the difference
    // between a useful refusal and a shrug.
    expect(response.body.permit.visitor_name).toBe('Ana Ruiz')
  })

  it('refuses a permit that has not started yet', async () => {
    seedPermit(ORG, PERMIT, { valid_from: FUTURE, valid_to: '2099-01-02T00:00:00.000Z' })

    const response = await check(GUARD, { location_id: GATE, code: CODE })

    expect(response.body).toMatchObject({ result: 'denied', reason: 'not_started' })
  })

  it('refuses a permit that is over', async () => {
    seedPermit(ORG, PERMIT, { valid_from: PAST_FROM, valid_to: PAST_TO })

    const response = await check(GUARD, { location_id: GATE, code: CODE })

    expect(response.body).toMatchObject({ result: 'denied', reason: 'expired' })
  })

  it('refuses a permit at the wrong entrance, and names the right one', async () => {
    seedPermit(ORG, PERMIT, { location_id: BACK_GATE })

    const response = await check(GUARD, { location_id: GATE, code: CODE })

    expect(response.body).toMatchObject({ result: 'denied', reason: 'wrong_location' })
    // So the guard can send the visitor to the right gate instead of away.
    expect(response.body.expected_location).toBe('Puerta trasera')
  })

  it('never tells a guard to try another gate for a revoked permit', async () => {
    // Both wrong: revoked, and at the other entrance. If the entrance were
    // checked first, the guard would redirect somebody who must not enter
    // anywhere. The permit's own state is settled before the entrance.
    seedPermit(ORG, PERMIT, { location_id: BACK_GATE, status: 'revoked' })

    const response = await check(GUARD, { location_id: GATE, code: CODE })

    expect(response.body.reason).toBe('revoked')
    expect(response.body.expected_location).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Who may check
// ---------------------------------------------------------------------------

describe('who may check a permit', () => {
  it('lets an administrator check, for the small building where they staff the gate', async () => {
    seedPermit(ORG, PERMIT)

    const response = await check(ADMIN, { location_id: GATE, code: CODE })

    expect(response.body.result).toBe('allowed')
  })

  it('refuses a resident', async () => {
    seedPermit(ORG, PERMIT)

    const response = await check(RESIDENT, { location_id: GATE, code: CODE })

    expect(response.status).toBe(403)
    expect(events()).toHaveLength(0)
  })

  it('refuses a guard from another organization, and does not admit the org exists', async () => {
    seedPermit(ORG, PERMIT)

    const response = await check(OUTSIDER, { location_id: GATE, code: CODE })

    // 404, not 403 — telling a stranger which organizations exist is itself a
    // leak. This is the standing isolation rule for every org-scoped route.
    expect(response.status).toBe(404)
    expect(events()).toHaveLength(0)
  })

  it('cannot be used to check another organization’s code', async () => {
    // The same characters, issued at a different customer. Codes are only
    // unique within one organization, so a lookup that escaped the
    // organization would let one customer's code open another's door.
    seedPermit(OTHER_ORG, 'auth_beta')

    const response = await check(GUARD, { location_id: GATE, code: CODE })

    expect(response.body).toMatchObject({ result: 'denied', reason: 'invalid_code' })
  })
})

// ---------------------------------------------------------------------------
// The entrance
// ---------------------------------------------------------------------------

describe('the entrance', () => {
  it('refuses an entrance that does not exist, and records nothing', async () => {
    seedPermit(ORG, PERMIT)

    const response = await check(GUARD, { location_id: 'loc_nowhere', code: CODE })

    expect(response.status).toBe(404)
    // An event has to say where it happened. With no real entrance there is
    // nothing truthful to write.
    expect(events()).toHaveLength(0)
  })

  it('refuses an entrance that has been taken out of use', async () => {
    seedPermit(ORG, PERMIT)

    const response = await check(GUARD, { location_id: RETIRED_GATE, code: CODE })

    expect(response.status).toBe(409)
    expect(events()).toHaveLength(0)
  })

  it('requires both an entrance and a code', async () => {
    expect((await check(GUARD, { code: CODE })).status).toBe(400)
    expect((await check(GUARD, { location_id: GATE })).status).toBe(400)
    expect((await check(GUARD, { location_id: GATE, code: CODE, extra: 1 })).status).toBe(400)
    expect(events()).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// The record — the audit trail the whole product rests on
// ---------------------------------------------------------------------------

describe('the record of a check', () => {
  it('records an entry that was allowed', async () => {
    seedPermit(ORG, PERMIT)

    const response = await check(GUARD, { location_id: GATE, code: CODE })

    expect(events()).toHaveLength(1)
    expect(events()[0]).toMatchObject({
      id: response.body.event_id,
      org_id: ORG,
      location_id: GATE,
      permit_id: PERMIT,
      interior_id: INT_302,
      action: 'entry',
      result: 'allowed',
      deny_reason: null,
      checked_by: GUARD,
    })
  })

  it('records a refusal too, with the reason', async () => {
    seedPermit(ORG, PERMIT, { status: 'revoked' })

    await check(GUARD, { location_id: GATE, code: CODE })

    expect(events()[0]).toMatchObject({ result: 'denied', deny_reason: 'revoked' })
  })

  it('keeps the characters someone typed only when they matched nothing', async () => {
    seedPermit(ORG, PERMIT)

    await check(GUARD, { location_id: GATE, code: 'ZZZZ-ZZZZ' })
    await check(GUARD, { location_id: GATE, code: CODE })

    const [failed, succeeded] = events()
    // The only evidence of what was attempted.
    expect(failed!.scanned_code).toBe('ZZZZ-ZZZZ')
    // A live door code is not copied into a second collection.
    expect(succeeded!.scanned_code).toBeNull()
  })

  it('stores nothing about the guard’s device or connection', async () => {
    seedPermit(ORG, PERMIT)

    await check(GUARD, { location_id: GATE, code: CODE })

    // Founder decision, 2026-08-30. Kept across every scan of a shift, an
    // address and a device become a location trail of a customer's own staff.
    const stored = events()[0]!
    expect(stored).not.toHaveProperty('ip_address')
    expect(stored).not.toHaveProperty('device_type')
    // And the visitor's name is not copied here either — it lives on the
    // permit, which this event points at.
    expect(stored).not.toHaveProperty('visitor_name')
  })

  it('keeps an entry for 90 days and a refusal for 30', async () => {
    seedPermit(ORG, PERMIT)
    const before = Date.now()

    await check(GUARD, { location_id: GATE, code: CODE })
    await check(GUARD, { location_id: GATE, code: 'ZZZZ-ZZZZ' })

    const [allowed, denied] = events()
    expect((allowed!.expires_at as Date).getTime()).toBeGreaterThanOrEqual(before + 90 * DAY)
    // A refusal is kept for a third as long: it is where the record of people
    // who never entered accumulates.
    expect((denied!.expires_at as Date).getTime()).toBeLessThan(before + 31 * DAY)

    expect(EVENT_RETENTION_DAYS).toEqual({ allowed: 90, denied: 30 })
    expect(retentionDate(new Date(0), 'allowed').getTime()).toBe(90 * DAY)
    expect(retentionDate(new Date(0), 'denied').getTime()).toBe(30 * DAY)
  })

  it('counts the entry on the permit itself, not only in the history', async () => {
    // Decision 014. The history is deleted at 90 days; the permit's own record
    // is not, and a list of permits must not cost one query per row.
    seedPermit(ORG, PERMIT, { entry_mode: 'multiple', entry_count: 0 })

    await check(GUARD, { location_id: GATE, code: CODE })

    const stored = store.docs.get(`orgs/${ORG}/authorizations/${PERMIT}`)!
    expect(stored.entry_count).toBe(1)
    expect(stored.last_entry_at).toBeDefined()
    expect(stored.first_entry_at).toBeDefined()
  })

  it('is never changed once written', async () => {
    seedPermit(ORG, PERMIT)

    await check(GUARD, { location_id: GATE, code: CODE })
    await check(GUARD, { location_id: GATE, code: CODE })

    const written = store.writes.filter((entry) => entry.path.includes('/access_events/'))
    expect(written).toHaveLength(2)
    // Two separate records, and nothing updated. A log that can be edited is
    // not evidence. Since Decision 014 the write happens inside the same
    // transaction that counts the entry, so the operation is `tx.set` rather
    // than `set` — what matters is that it is a whole new record either way,
    // and that nothing ever updates one.
    expect(written.every((entry) => entry.op.endsWith('set'))).toBe(true)
    expect(written.some((entry) => entry.op.includes('update'))).toBe(false)
    expect(new Set(written.map((entry) => entry.path)).size).toBe(2)
  })
})

describe('how many times a permit works (Decision 014)', () => {
  it('lets the first person in on a one-entry permit, and refuses the second', async () => {
    seedPermit(ORG, PERMIT, { entry_mode: 'single', entry_count: 0 })

    const first = await check(GUARD, { location_id: GATE, code: CODE })
    expect(first.status).toBe(200)
    expect(first.body.result).toBe('allowed')

    const second = await check(GUARD, { location_id: GATE, code: CODE })
    expect(second.status).toBe(200)
    expect(second.body.result).toBe('denied')
    // A guard who is only told "no" cannot explain anything to the person in
    // front of them, and that turns into an argument at the gate.
    expect(second.body.reason).toBe('already_used')
  })

  it('lets the same person in again and again when the permit says so', async () => {
    // A domestic employee, a technician working across a day: in and out.
    seedPermit(ORG, PERMIT, { entry_mode: 'multiple', entry_count: 0 })

    for (const _ of [1, 2, 3]) {
      const answer = await check(GUARD, { location_id: GATE, code: CODE })
      expect(answer.body.result).toBe('allowed')
    }

    expect(store.docs.get(`orgs/${ORG}/authorizations/${PERMIT}`)!.entry_count).toBe(3)
  })

  it('leaves permits issued before the decision working exactly as they did', async () => {
    // No entry_mode at all: issued when there was no other option. Converting
    // it to single-use would revoke access nobody agreed to revoke.
    seedPermit(ORG, PERMIT)

    expect((await check(GUARD, { location_id: GATE, code: CODE })).body.result).toBe('allowed')
    expect((await check(GUARD, { location_id: GATE, code: CODE })).body.result).toBe('allowed')
  })

  it('refuses a spent permit before it looks at the entrance', async () => {
    // The order of reasons is not cosmetic: "try the other gate" for a permit
    // that can no longer open anything would send a guard to redirect somebody
    // who cannot be let in anywhere.
    seedPermit(ORG, PERMIT, { entry_mode: 'single', entry_count: 1, location_id: GATE })

    const answer = await check(GUARD, { location_id: GATE, code: CODE })
    expect(answer.body.reason).toBe('already_used')
  })

  it('never lets a revoked permit look merely used', async () => {
    seedPermit(ORG, PERMIT, { entry_mode: 'single', entry_count: 1, status: 'revoked' })

    expect((await check(GUARD, { location_id: GATE, code: CODE })).body.reason).toBe('revoked')
  })
})


// ---------------------------------------------------------------------------
// Decision 015 — what a guard records when nobody comes in
// ---------------------------------------------------------------------------

describe('POST /orgs/:orgId/validate/:eventId/nota', () => {
  function note(
    uid: string,
    eventId: string,
    body: Record<string, unknown>,
    orgId = ORG,
  ): ReturnType<ReturnType<typeof request>['post']> {
    signedInAs(uid)
    return request(app)
      .post(`/orgs/${orgId}/validate/${eventId}/nota`)
      .set('Authorization', 'Bearer token')
      .send(body)
  }

  /** Lets somebody in and hands back the id of the check that did it. */
  async function letSomebodyIn(extra: Record<string, unknown> = {}): Promise<string> {
    seedPermit(ORG, PERMIT, { entry_mode: 'single', entry_count: 0, ...extra })
    const answer = await check(GUARD, { location_id: GATE, code: CODE })
    expect(answer.body.result).toBe('allowed')
    return String(answer.body.event_id)
  }

  function permit(orgId = ORG, permitId = PERMIT): Record<string, unknown> {
    return store.docs.get(`orgs/${orgId}/authorizations/${permitId}`) as Record<string, unknown>
  }

  /** Rewrites a check's timestamp, to test the window without waiting. */
  function ageCheck(eventId: string, minutes: number, orgId = ORG) {
    const path = `orgs/${orgId}/access_events/${eventId}`
    const stored = store.docs.get(path) as Record<string, unknown>
    const at = new Date(Date.now() - minutes * 60 * 1000)
    store.docs.set(path, { ...stored, created_at: { toDate: () => at } })
  }

  it('gives a one-entry permit back when the visitor did not come in', async () => {
    const eventId = await letSomebodyIn()
    expect(permit().entry_count).toBe(1)

    const res = await note(GUARD, eventId, { note: 'no_entry' })

    expect(res.status).toBe(201)
    expect(res.body.entry_returned).toBe(true)
    expect(permit().entry_count).toBe(0)
    expect(permit().entry_returns).toBe(1)
  })

  it('lets the same person in again after the entry is given back', async () => {
    // The whole point of the decision, stated as the thing a person does: the
    // permit was spent by mistake and now works again.
    const eventId = await letSomebodyIn()
    expect((await check(GUARD, { location_id: GATE, code: CODE })).body.reason).toBe('already_used')

    await note(GUARD, eventId, { note: 'no_entry' })

    expect((await check(GUARD, { location_id: GATE, code: CODE })).body.result).toBe('allowed')
  })

  it('clears the last entry when the permit is back to none', async () => {
    // A permit with no entries and a timestamp saying when somebody last came
    // in is a lie, and the detail screen reads exactly that field.
    const eventId = await letSomebodyIn()
    expect(permit().last_entry_at).toBeTruthy()

    await note(GUARD, eventId, { note: 'no_entry' })

    expect(permit().last_entry_at).toBeNull()
    expect(permit().first_entry_at).toBeNull()
  })

  it('keeps the count honest on a permit that allows many entries', async () => {
    seedPermit(ORG, PERMIT, { entry_mode: 'multiple', entry_count: 0 })
    await check(GUARD, { location_id: GATE, code: CODE })
    const second = await check(GUARD, { location_id: GATE, code: CODE })
    expect(permit().entry_count).toBe(2)

    await note(GUARD, String(second.body.event_id), { note: 'no_entry' })

    expect(permit().entry_count).toBe(1)
    // Somebody is still inside, so the last entry stays.
    expect(permit().last_entry_at).toBeTruthy()
  })

  it('never edits the check — a note is a second record', async () => {
    // events.ts: a log that can be edited is not evidence.
    const eventId = await letSomebodyIn()
    const before = { ...(store.docs.get(`orgs/${ORG}/access_events/${eventId}`) as object) }

    await note(GUARD, eventId, { note: 'no_entry' })

    expect(store.docs.get(`orgs/${ORG}/access_events/${eventId}`)).toEqual(before)
    expect(events()).toHaveLength(2)
    const written = events().find((one) => one.action === 'note')!
    expect(written.about_event_id).toBe(eventId)
    expect(written.note).toBe('no_entry')
    expect(written.entry_returned).toBe(true)
    expect(written.checked_by).toBe(GUARD)
  })

  it('records a reason that changes nothing', async () => {
    const eventId = await letSomebodyIn()

    const res = await note(GUARD, eventId, { note: 'returning_later' })

    expect(res.status).toBe(201)
    expect(res.body.entry_returned).toBe(false)
    expect(permit().entry_count).toBe(1)
    expect(permit().entry_returns ?? 0).toBe(0)
  })

  it('accepts each of the four reasons and no others', async () => {
    const eventId = await letSomebodyIn()
    // The list is closed on purpose. A free-text field is a field somebody
    // eventually fills with an ID number.
    expect((await note(GUARD, eventId, { note: 'llego tarde, traia una caja' })).status).toBe(400)
    expect((await note(GUARD, eventId, { note: 'sent_to_other_entrance' })).status).toBe(201)
  })

  it('refuses anything beyond the reason', async () => {
    const eventId = await letSomebodyIn()

    const res = await note(GUARD, eventId, { note: 'no_entry', comentario: 'CC 1020304050' })

    expect(res.status).toBe(400)
    expect(permit().entry_count).toBe(1)
  })

  it('refuses once the window has passed', async () => {
    const eventId = await letSomebodyIn()
    ageCheck(eventId, 11)

    const res = await note(GUARD, eventId, { note: 'no_entry' })

    expect(res.status).toBe(409)
    expect(permit().entry_count).toBe(1)
    expect(events()).toHaveLength(1)
  })

  it('still allows it just inside the window', async () => {
    const eventId = await letSomebodyIn()
    ageCheck(eventId, 9)

    expect((await note(GUARD, eventId, { note: 'no_entry' })).status).toBe(201)
  })

  it('refuses a second note on the same check', async () => {
    // Without this, the button pressed twice takes the count below what
    // actually happened.
    const eventId = await letSomebodyIn()
    await note(GUARD, eventId, { note: 'no_entry' })

    const res = await note(GUARD, eventId, { note: 'no_entry' })

    expect(res.status).toBe(409)
    expect(permit().entry_count).toBe(0)
    expect(permit().entry_returns).toBe(1)
  })

  it('writes the note but returns nothing when the check was a refusal', async () => {
    seedPermit(ORG, PERMIT, { entry_mode: 'single', entry_count: 0, location_id: BACK_GATE })
    const answer = await check(GUARD, { location_id: GATE, code: CODE })
    expect(answer.body.result).toBe('denied')

    const res = await note(GUARD, String(answer.body.event_id), { note: 'sent_to_other_entrance' })

    expect(res.status).toBe(201)
    expect(res.body.entry_returned).toBe(false)
    expect(permit().entry_count ?? 0).toBe(0)
  })

  it('lets an administrator record it too', async () => {
    const eventId = await letSomebodyIn()

    expect((await note(ADMIN, eventId, { note: 'no_entry' })).status).toBe(201)
  })

  it('refuses a responsable, like a check does', async () => {
    const eventId = await letSomebodyIn()

    const res = await note(RESIDENT, eventId, { note: 'no_entry' })

    expect(res.status).toBe(403)
    expect(permit().entry_count).toBe(1)
  })

  it('tells somebody from another organization that nothing is here', async () => {
    // 404, not 403, and deliberately: a stranger must not be able to learn
    // that this organization exists by being told they may not touch it.
    const eventId = await letSomebodyIn()

    const res = await note(OUTSIDER, eventId, { note: 'no_entry' })

    expect(res.status).toBe(404)
    expect(permit().entry_count).toBe(1)
  })

  it('refuses a check that does not exist', async () => {
    await letSomebodyIn()

    expect((await note(GUARD, 'event_nada', { note: 'no_entry' })).status).toBe(404)
  })

  it('refuses a note about another note', async () => {
    const eventId = await letSomebodyIn()
    const first = await note(GUARD, eventId, { note: 'returning_later' })

    const res = await note(GUARD, String(first.body.event_id), { note: 'no_entry' })

    expect(res.status).toBe(404)
  })

  it('keeps a note exactly as long as the check it is about', async () => {
    // Anything else produces a half-history: an entry that outlives the record
    // saying nobody actually came in.
    const eventId = await letSomebodyIn()
    const original = events().find((one) => one.id === eventId)!

    await note(GUARD, eventId, { note: 'no_entry' })

    const written = events().find((one) => one.action === 'note')!
    expect(written.expires_at).toEqual(original.expires_at)
  })

  it('never copies the code onto the note', async () => {
    const eventId = await letSomebodyIn()

    await note(GUARD, eventId, { note: 'no_entry' })

    const written = events().find((one) => one.action === 'note')!
    expect(written.scanned_code).toBeNull()
    expect(JSON.stringify(written)).not.toContain(CODE)
  })
})
