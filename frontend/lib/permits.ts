import { es } from './strings'
import type {
  Permit,
  PermitEntryMode,
  PermitPurpose,
  PermitSchedule,
  PermitState,
} from './api'

/**
 * The date and text handling behind the permit screens.
 *
 * Kept out of the components so it can be tested without a browser: getting a
 * date wrong here means a permit that does not work at the gate, which the
 * visitor discovers standing in front of a guard.
 *
 * The browser's `datetime-local` input speaks **local time with no zone**
 * ("2026-08-30T14:00"), while the API stores instants in UTC. The two
 * conversions below are the only place those meet.
 */

/** One year, matching the server's cap. Kept in sync deliberately. */
export const MAX_PERMIT_DAYS = 365

const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/**
 * A `datetime-local` value for a moment, in the reader's own timezone.
 *
 * `toISOString` cannot be used: it converts to UTC, so a person in Bogotá
 * would see a form pre-filled five hours away from the time they meant.
 */
export function toLocalInput(at: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return (
    `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}` +
    `T${pad(at.getHours())}:${pad(at.getMinutes())}`
  )
}

/**
 * The instant a `datetime-local` value means, as the API wants it.
 *
 * `new Date("2026-08-30T14:00")` is read as local time by every browser, which
 * is exactly what the person typing it meant.
 */
export function toIsoInstant(localValue: string): string | null {
  const at = new Date(localValue)
  return Number.isNaN(at.getTime()) ? null : at.toISOString()
}

/**
 * What the form starts with: valid from now, for one day.
 *
 * A resident opening this screen usually has someone at the gate or arriving
 * shortly. Pre-filling the common case means they type a name and press one
 * button. Minutes are rounded down so the field does not read "14:37".
 */
export function defaultWindow(now: Date = new Date()): { from: string; to: string } {
  const from = new Date(now.getTime())
  from.setSeconds(0, 0)
  from.setMinutes(0)

  return { from: toLocalInput(from), to: toLocalInput(new Date(from.getTime() + DAY)) }
}

/**
 * Checks the two dates the way the server does, so a person is told what is
 * wrong before a request goes out rather than after it comes back refused.
 * Returns Spanish text, or undefined when the window is fine.
 */
export function checkWindow(
  fromLocal: string,
  toLocal: string,
  now: Date = new Date(),
): string | undefined {
  const from = toIsoInstant(fromLocal)
  const to = toIsoInstant(toLocal)

  if (!from || !to) return es.validation.datesRequired

  const fromMs = new Date(from).getTime()
  const toMs = new Date(to).getTime()

  if (fromMs >= toMs) return es.validation.datesOutOfOrder
  if (toMs <= now.getTime()) return es.validation.datesInThePast
  if (toMs - fromMs > MAX_PERMIT_DAYS * DAY) return es.validation.datesTooLong

  return undefined
}

// ---------------------------------------------------------------------------
// Display
// ---------------------------------------------------------------------------

const STATE_LABELS: Record<PermitState, string> = {
  active: es.permits.stateActive,
  scheduled: es.permits.stateScheduled,
  used: es.permits.stateUsed,
  expired: es.permits.stateExpired,
  revoked: es.permits.stateRevoked,
}

export function stateLabel(state: PermitState): string {
  return STATE_LABELS[state]
}

const PURPOSE_LABELS: Record<PermitPurpose, string> = {
  visitor: es.permits.purposeVisitor,
  pickup: es.permits.purposePickup,
  provider: es.permits.purposeProvider,
  employee: es.permits.purposeEmployee,
  other: es.permits.purposeOther,
}

export function purposeLabel(purpose: PermitPurpose): string {
  return PURPOSE_LABELS[purpose]
}

export const PURPOSE_OPTIONS: ReadonlyArray<{ value: PermitPurpose; label: string }> = (
  ['visitor', 'pickup', 'provider', 'employee', 'other'] as const
).map((value) => ({ value, label: PURPOSE_LABELS[value] }))

/**
 * A date a Colombian reader recognises: "30 ago 2026, 2:00 p. m.".
 *
 * Rendered in the reader's own timezone, which is the one they are standing
 * in. `es-CO` rather than the browser's locale, because the product is in
 * Spanish and a phone set to English must not produce "Aug 30".
 */
export function formatMoment(iso: string): string {
  const at = new Date(iso)
  if (Number.isNaN(at.getTime())) return ''
  return at.toLocaleString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

/** "30 ago 2026, 2:00 p. m. → 31 ago 2026, 2:00 p. m." */
export function formatWindow(from: string, to: string): string {
  return `${formatMoment(from)} → ${formatMoment(to)}`
}

// ---------------------------------------------------------------------------
// How a permit has been used (Decision 014)
// ---------------------------------------------------------------------------

export const ENTRY_MODE_OPTIONS: ReadonlyArray<{
  value: PermitEntryMode
  label: string
  hint: string
}> = [
  {
    value: 'single',
    label: es.permits.entryModeSingle,
    hint: es.permits.entryModeSingleHint,
  },
  {
    value: 'multiple',
    label: es.permits.entryModeMultiple,
    hint: es.permits.entryModeMultipleHint,
  },
]

/**
 * One line about whether anybody has come in on this permit.
 *
 * Returns null when there is nothing worth saying — a permit that is over and
 * was never used does not need a line telling the reader so.
 */
export function useLine(
  permit: Pick<Permit, 'entry_count' | 'entry_returns' | 'last_entry_at' | 'state'>,
  format: (iso: string) => string,
): string | null {
  if (permit.entry_count > 0 && permit.last_entry_at) {
    const when = `${es.permits.usedOnce} ${format(permit.last_entry_at)}`
    // The count only earns its place once it stops being obvious.
    return permit.entry_count > 1
      ? `${when} · ${es.permits.usedTimes} ${permit.entry_count}`
      : when
  }
  // Decision 015. A permit at zero entries that a guard gave back is not the
  // same thing as one nobody ever presented, and an administrator asked for
  // exactly that difference. Said before "todavía no se ha usado", which
  // would be true and useless.
  if ((permit.entry_returns ?? 0) > 0) {
    return es.permits.visitorNeverCame
  }
  if (permit.state === 'active' || permit.state === 'scheduled') {
    return es.permits.notUsedYet
  }
  return null
}

// ---------------------------------------------------------------------------
// The days and hours a permit may be used (Decision 016)
// ---------------------------------------------------------------------------

/**
 * The week, starting on Monday.
 *
 * `value` is the number the API uses (0 = Sunday), and the order here is the
 * order a Spanish-speaking reader expects to see the week in. The two are
 * deliberately not the same thing: sorting the API's numbers would put Sunday
 * first on a screen where nobody looks for it there.
 */
export const WEEK_DAYS: ReadonlyArray<{ value: number; short: string; long: string }> = [
  { value: 1, short: 'lun', long: 'lunes' },
  { value: 2, short: 'mar', long: 'martes' },
  { value: 3, short: 'mié', long: 'miércoles' },
  { value: 4, short: 'jue', long: 'jueves' },
  { value: 5, short: 'vie', long: 'viernes' },
  { value: 6, short: 'sáb', long: 'sábado' },
  { value: 0, short: 'dom', long: 'domingo' },
]

const WEEKDAYS = [1, 2, 3, 4, 5]
const WEEKEND = [0, 6]

function sameDays(days: number[], other: number[]): boolean {
  return days.length === other.length && other.every((day) => days.includes(day))
}

/** `"07:00"` → `"7:00 a. m."`, the way a time is read aloud in Colombia. */
export function formatHour(hhmm: string): string {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(hhmm)
  if (!match) return hhmm

  const hours = Number(match[1])
  const minutes = match[2]
  const suffix = hours < 12 ? 'a. m.' : 'p. m.'
  const shown = hours % 12 === 0 ? 12 : hours % 12

  return `${shown}:${minutes} ${suffix}`
}

/**
 * The days, written the way somebody would say them: "de lunes a viernes",
 * "todos los días", "lunes, miércoles y viernes".
 *
 * The named cases are not decoration. "1, 2, 3, 4, 5" is a list a reader has
 * to assemble in their head; "de lunes a viernes" is the thing they meant.
 */
export function formatDays(days: number[]): string {
  const chosen = WEEK_DAYS.filter((day) => days.includes(day.value))
  if (chosen.length === 0) return ''
  if (chosen.length === 7) return es.permits.scheduleEveryDay
  if (sameDays(days, WEEKDAYS)) return es.permits.scheduleWeekdays
  if (sameDays(days, WEEKEND)) return es.permits.scheduleWeekend

  const names = chosen.map((day) => day.long)
  const last = names.pop() ?? ''
  if (names.length === 0) return last

  return `${names.join(', ')} ${es.permits.scheduleAnd} ${last}`
}

/** "de lunes a viernes, de 7:00 a. m. a 4:00 p. m." */
export function formatSchedule(schedule: PermitSchedule | null | undefined): string {
  if (!schedule || schedule.days.length === 0) return es.permits.scheduleAlways

  const days = formatDays(schedule.days)
  const from = formatHour(schedule.from)
  const to = formatHour(schedule.to)

  return `${days}, ${es.permits.scheduleTimeJoin} ${from} ${es.permits.scheduleTimeTo} ${to}`
}

/**
 * Checks a schedule the way the server does, so the person is told what is
 * wrong before the request goes out. Returns Spanish text, or undefined.
 */
export function checkSchedule(days: number[], from: string, to: string): string | undefined {
  if (days.length === 0) return es.validation.scheduleNeedsDay

  const fromMinutes = minutesOf(from)
  const toMinutes = minutesOf(to)
  if (fromMinutes === null || toMinutes === null) return es.validation.scheduleOutOfOrder
  // Both wrong orders read the same to a person filling in a form, but the
  // midnight one has an action attached: make two permits.
  if (toMinutes === fromMinutes) return es.validation.scheduleOutOfOrder
  if (toMinutes < fromMinutes) return es.validation.scheduleNoMidnight

  return undefined
}

function minutesOf(hhmm: string): number | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(hhmm).trim())
  return match ? Number(match[1]) * 60 + Number(match[2]) : null
}
