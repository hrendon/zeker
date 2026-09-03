import { es } from './strings'
import type { Permit, PermitEntryMode, PermitPurpose, PermitState } from './api'

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
  permit: Pick<Permit, 'entry_count' | 'last_entry_at' | 'state'>,
  format: (iso: string) => string,
): string | null {
  if (permit.entry_count > 0 && permit.last_entry_at) {
    const when = `${es.permits.usedOnce} ${format(permit.last_entry_at)}`
    // The count only earns its place once it stops being obvious.
    return permit.entry_count > 1
      ? `${when} · ${es.permits.usedTimes} ${permit.entry_count}`
      : when
  }
  if (permit.state === 'active' || permit.state === 'scheduled') {
    return es.permits.notUsedYet
  }
  return null
}
