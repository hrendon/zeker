import { describe, expect, it } from 'vitest'
import {
  MAX_PERMIT_DAYS,
  checkWindow,
  defaultWindow,
  formatWindow,
  purposeLabel,
  stateLabel,
  toIsoInstant,
  toLocalInput,
} from './permits'
import { es } from './strings'

/**
 * The permit screens' pure logic — the date handling in particular.
 *
 * Getting a date wrong here produces a permit that does not work at the gate,
 * which the visitor discovers standing in front of a guard. Everything else
 * about these screens (a QR actually drawing, a menu opening) is only honestly
 * checkable by a person driving a browser, and is verified that way.
 */

const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

describe('the browser date input and the API instant', () => {
  it('fills the form in the reader’s own timezone, not in UTC', () => {
    // The bug this prevents: using toISOString() would show a person in Bogotá
    // a time five hours from the one they meant.
    const at = new Date(2026, 7, 30, 14, 5)

    expect(toLocalInput(at)).toBe('2026-08-30T14:05')
  })

  it('pads single digits, because the input refuses "2026-8-3T9:5"', () => {
    expect(toLocalInput(new Date(2026, 0, 3, 9, 5))).toBe('2026-01-03T09:05')
  })

  it('reads what the person typed as their local time', () => {
    const iso = toIsoInstant('2026-08-30T14:00')

    expect(iso).not.toBeNull()
    expect(new Date(iso!).getTime()).toBe(new Date(2026, 7, 30, 14, 0).getTime())
  })

  it('survives a round trip unchanged', () => {
    const typed = '2026-08-30T14:05'

    expect(toLocalInput(new Date(toIsoInstant(typed)!))).toBe(typed)
  })

  it('returns null rather than an invalid date', () => {
    expect(toIsoInstant('')).toBeNull()
    expect(toIsoInstant('mañana')).toBeNull()
  })
})

describe('the window the form starts with', () => {
  it('runs from this hour for one day, so the common case is one button press', () => {
    const now = new Date(2026, 7, 30, 14, 37, 45)
    const { from, to } = defaultWindow(now)

    // Minutes rounded down: a pre-filled "14:37" reads like a mistake.
    expect(from).toBe('2026-08-30T14:00')
    expect(to).toBe('2026-08-31T14:00')
  })
})

describe('checking the window before sending it', () => {
  const now = new Date(2026, 7, 30, 12, 0)
  const local = (offsetMs: number) => toLocalInput(new Date(now.getTime() + offsetMs))

  it('accepts an ordinary visit', () => {
    expect(checkWindow(local(0), local(4 * HOUR), now)).toBeUndefined()
  })

  it('accepts a window that started earlier today', () => {
    // "Valid since this morning" is a normal thing to write.
    expect(checkWindow(local(-3 * HOUR), local(4 * HOUR), now)).toBeUndefined()
  })

  it('refuses a window that ends before it starts', () => {
    expect(checkWindow(local(4 * HOUR), local(HOUR), now)).toBe(es.validation.datesOutOfOrder)
  })

  it('refuses a permit that is already over', () => {
    expect(checkWindow(local(-2 * DAY), local(-DAY), now)).toBe(es.validation.datesInThePast)
  })

  it('refuses a permit longer than the server will accept', () => {
    // Mirrors the API's cap, so a mistyped year is caught before a round trip.
    expect(checkWindow(local(0), local((MAX_PERMIT_DAYS + 1) * DAY), now)).toBe(
      es.validation.datesTooLong,
    )
    expect(checkWindow(local(0), local(MAX_PERMIT_DAYS * DAY), now)).toBeUndefined()
  })

  it('asks for the dates when a field is empty', () => {
    expect(checkWindow('', local(HOUR), now)).toBe(es.validation.datesRequired)
    expect(checkWindow(local(0), '', now)).toBe(es.validation.datesRequired)
  })
})

describe('what the reader sees', () => {
  it('never shows an English state name', () => {
    expect(stateLabel('active')).toBe('Activo')
    expect(stateLabel('scheduled')).toBe('Programado')
    expect(stateLabel('expired')).toBe('Vencido')
    expect(stateLabel('revoked')).toBe('Anulado')
  })

  it('names every purpose the API can return', () => {
    for (const purpose of ['visitor', 'pickup', 'provider', 'employee', 'other'] as const) {
      expect(purposeLabel(purpose)).toBeTruthy()
      expect(purposeLabel(purpose)).not.toBe(purpose)
    }
  })

  it('shows a window as one readable line', () => {
    const from = new Date(2026, 7, 30, 14, 0).toISOString()
    const to = new Date(2026, 7, 31, 14, 0).toISOString()

    expect(formatWindow(from, to)).toContain('→')
    expect(formatWindow(from, to)).not.toContain('T')
  })

  it('shows nothing rather than "Invalid Date" for a broken value', () => {
    expect(formatWindow('', '')).toBe(' → ')
  })
})
