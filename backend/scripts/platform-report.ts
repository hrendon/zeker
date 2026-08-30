import { db } from '../src/lib/firebase.js'
import { stateOf } from '../src/lib/permits.js'
import type { PermitDocument, PermitState } from '../src/lib/permits.js'
import type { OrgDocument } from '../src/lib/orgs.js'
import type { AccessEventDocument } from '../src/lib/events.js'
import type { UserDocument } from '../src/lib/users.js'

/**
 * How the business is doing — the whole platform, in one page.
 *
 * Run it:
 *
 *     npm run report
 *
 * **This is an operator tool, not part of the product**, and that distinction
 * is the important one. It reads every customer's data, which is exactly what
 * the API is built never to allow: since Decision 004 the backend is the only
 * thing keeping one customer out of another's records, and adding a route that
 * could read across customers would put a hole in the single wall the whole
 * product rests on.
 *
 * So this reads Firestore directly, with whoever runs it authenticated as
 * themselves through Application Default Credentials (`gcloud auth
 * application-default login`). Access is governed by Google IAM — take away the
 * person's project access and this stops working, with no code change and
 * nothing to revoke inside Zeker. There is no account to create, no password to
 * hold, and no privileged role inside the product that could ever be stolen or
 * misused.
 *
 * It counts. It never prints a visitor's name, a resident's name, or a permit
 * code — the answer to "how is the business doing" needs none of those, and a
 * report that quietly becomes a list of who visited whom is the thing
 * `docs/security/data-minimization.md` exists to prevent.
 *
 * What it deliberately cannot tell you: API latency, error rate and cost. Those
 * are not in the database. They live in Google Cloud — see the end of the
 * output.
 */

const DAY = 24 * 60 * 60 * 1000
const now = new Date()

/** Firestore timestamps are objects; some of our dates are ISO strings. */
function asDate(value: unknown): Date | undefined {
  if (value && typeof (value as { toDate?: unknown }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate()
  }
  if (typeof value === 'string') {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? undefined : parsed
  }
  return undefined
}

function within(value: unknown, days: number): boolean {
  const at = asDate(value)
  return at !== undefined && now.getTime() - at.getTime() <= days * DAY
}

/** Counts by key, in descending order, so the interesting rows come first. */
function tally<T extends string>(values: T[]): Array<[T, number]> {
  const counts = new Map<T, number>()
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1)
  return [...counts.entries()].sort((a, b) => b[1] - a[1])
}

function bar(count: number, total: number, width = 20): string {
  if (total === 0) return '░'.repeat(width)
  const filled = Math.round((count / total) * width)
  return '█'.repeat(filled) + '░'.repeat(width - filled)
}

function section(title: string): void {
  console.log(`\n${title}\n${'─'.repeat(title.length)}`)
}

function line(label: string, value: string | number, note = ''): void {
  console.log(`  ${label.padEnd(34)}${String(value).padStart(7)}  ${note}`)
}

async function main(): Promise<void> {
  console.log(`\nZEKER — PLATFORM REPORT`)
  console.log(`${now.toISOString().slice(0, 16).replace('T', ' ')} UTC\n`)

  // One read per collection group rather than one per organization: this stays
  // a handful of queries whether there are two customers or two thousand.
  const [orgsSnap, usersSnap, locationsSnap, interiorsSnap, permitsSnap, eventsSnap] =
    await Promise.all([
      db().collection('orgs').get(),
      db().collection('users').get(),
      db().collectionGroup('locations').get(),
      db().collectionGroup('interiors').get(),
      db().collectionGroup('authorizations').get(),
      db().collectionGroup('access_events').get(),
    ])

  const orgs = orgsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Partial<OrgDocument>) }))
  const users = usersSnap.docs.map((d) => d.data() as Partial<UserDocument>)
  const permits = permitsSnap.docs.map((d) => d.data() as Partial<PermitDocument>)
  const events = eventsSnap.docs.map((d) => d.data() as Partial<AccessEventDocument>)

  const live = orgs.filter((org) => org.status !== 'deleted')

  // ------------------------------------------------------------------------
  // Who has signed up
  // ------------------------------------------------------------------------
  section('CUSTOMERS')

  line('Organizations', live.length, live.length === 0 ? '— nobody has signed up yet' : '')
  line('  new this week', live.filter((o) => within(o.created_at, 7)).length)
  line('  new this month', live.filter((o) => within(o.created_at, 30)).length)
  line('Closed / deleted', orgs.length - live.length)

  if (live.length > 0) {
    console.log('\n  By segment — which market is actually biting:')
    for (const [type, count] of tally(live.map((o) => String(o.type ?? 'other')))) {
      console.log(`    ${type.padEnd(12)} ${bar(count, live.length)} ${count}`)
    }
    console.log('\n  By plan:')
    for (const [plan, count] of tally(live.map((o) => String(o.plan ?? 'free')))) {
      console.log(`    ${plan.padEnd(12)} ${bar(count, live.length)} ${count}`)
    }
  }

  // ------------------------------------------------------------------------
  // People
  // ------------------------------------------------------------------------
  section('PEOPLE')

  const memberships = users.flatMap((user) =>
    user.deleted ? [] : (user.orgs ?? []).map((m) => String(m.role)),
  )
  line('User accounts', users.filter((u) => !u.deleted).length)
  line('Memberships across all orgs', memberships.length)
  for (const [role, count] of tally(memberships)) {
    console.log(`    ${role.padEnd(12)} ${bar(count, memberships.length)} ${count}`)
  }

  // ------------------------------------------------------------------------
  // Are they using it
  // ------------------------------------------------------------------------
  section('USE — PERMITS ISSUED')

  const states = permits.map((p) =>
    stateOf(
      {
        valid_from: String(p.valid_from ?? ''),
        valid_to: String(p.valid_to ?? ''),
        status: p.status,
      },
      now,
    ),
  )

  line('Permits, all time', permits.length)
  line('  issued this week', permits.filter((p) => within(p.created_at, 7)).length)
  line('  issued this month', permits.filter((p) => within(p.created_at, 30)).length)

  if (permits.length > 0) {
    console.log('')
    const order: PermitState[] = ['active', 'scheduled', 'expired', 'revoked']
    const counts = new Map(tally(states))
    for (const state of order) {
      const count = counts.get(state) ?? 0
      console.log(`    ${state.padEnd(12)} ${bar(count, permits.length)} ${count}`)
    }

    // A high revocation rate is not a bug — it is a trust signal. People who
    // revoke are people who believe the code does something.
    const revoked = counts.get('revoked') ?? 0
    console.log('')
    line('Revocation rate', `${Math.round((revoked / permits.length) * 100)}%`, 'low is normal')
  }

  // Active customers: the only engagement number that matters early on.
  const activeOrgIds = new Set(
    permits.filter((p) => within(p.created_at, 7)).map((p) => String(p.org_id)),
  )
  line(
    'Organizations active this week',
    `${activeOrgIds.size}/${live.length}`,
    'issued at least one permit',
  )

  // ------------------------------------------------------------------------
  // The door
  // ------------------------------------------------------------------------
  section('USE — CHECKS AT A DOOR')

  const allowed = events.filter((e) => e.result === 'allowed')
  const denied = events.filter((e) => e.result === 'denied')

  line('Checks, all time', events.length)
  line('  this week', events.filter((e) => within(e.created_at, 7)).length)
  line('  today', events.filter((e) => within(e.created_at, 1)).length)

  if (events.length > 0) {
    console.log('')
    console.log(`    allowed      ${bar(allowed.length, events.length)} ${allowed.length}`)
    console.log(`    denied       ${bar(denied.length, events.length)} ${denied.length}`)

    if (denied.length > 0) {
      console.log('\n  Why people were turned away:')
      for (const [reason, count] of tally(denied.map((e) => String(e.deny_reason ?? 'unknown')))) {
        console.log(`    ${reason.padEnd(14)} ${bar(count, denied.length)} ${count}`)
      }
      // Worth watching: lots of "invalid_code" means either guards mistyping,
      // or somebody guessing. Lots of "expired" means residents are setting
      // windows that are too short for real life.
    }
  }

  // ------------------------------------------------------------------------
  // Who is about to need a paid plan
  // ------------------------------------------------------------------------
  section('WHO IS OUTGROWING THE FREE PLAN')

  const atLimit = live
    .map((org) => {
      const limits = (org.limits ?? {}) as { max_locations?: number; max_interiors?: number }
      const counts = (org.counts ?? {}) as { locations?: number; interiors?: number }
      return {
        name: String(org.name ?? org.id),
        plan: String(org.plan ?? 'free'),
        locations: `${counts.locations ?? 0}/${limits.max_locations ?? 0}`,
        interiors: `${counts.interiors ?? 0}/${limits.max_interiors ?? 0}`,
        full:
          (counts.locations ?? 0) >= (limits.max_locations ?? Infinity) ||
          (counts.interiors ?? 0) >= (limits.max_interiors ?? Infinity),
      }
    })
    .filter((row) => row.plan === 'free' && row.full)

  if (atLimit.length === 0) {
    console.log('  Nobody has hit a free-plan limit yet.')
  } else {
    console.log('  These customers cannot add anything more without paying.')
    console.log('  This is the warmest sales list the product produces:\n')
    for (const row of atLimit) {
      console.log(`    ${row.name.padEnd(30)} sites ${row.locations}   units ${row.interiors}`)
    }
  }

  console.log('')
  line('Sites, all customers', locationsSnap.size)
  line('Units (apartments, bodegas…)', interiorsSnap.size)

  // ------------------------------------------------------------------------
  // What this report cannot see
  // ------------------------------------------------------------------------
  section('NOT IN THIS REPORT — LOOK IN GOOGLE CLOUD')

  console.log(`  Speed, errors and uptime, and the audit trail of who did what:
    https://console.cloud.google.com/logs/query?project=zeker-505918
    Filter on jsonPayload.audit to see every permit issued, revoked or checked.

  What it is costing, and how close the free tier is to running out:
    https://console.cloud.google.com/billing
    https://console.cloud.google.com/firestore/usage?project=zeker-505918

  Sign-ins, and accounts that exist:
    https://console.firebase.google.com/project/zeker-505918/authentication/users
`)
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error('\nCould not read the platform.\n')
    console.error(error instanceof Error ? error.message : error)
    console.error(
      '\nIf this says the credentials are missing, run:\n  gcloud auth application-default login\n',
    )
    process.exit(1)
  })
