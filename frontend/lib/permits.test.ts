import { describe, expect, it } from 'vitest'
import {
  MAX_PERMIT_DAYS,
  checkWindow,
  defaultWindow,
  formatWindow,
  ENTRY_MODE_OPTIONS,
  purposeLabel,
  stateLabel,
  useLine,
  toIsoInstant,
  toLocalInput,
  checkSchedule,
  formatDays,
  formatHour,
  formatSchedule,
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

describe('whether anybody has come in on a permit (Decision 014)', () => {
  const format = (iso: string) => `[${iso}]`
  const base = { entry_count: 0, entry_returns: 0, last_entry_at: null, state: 'active' as const }

  it('says nobody has used it yet, while it could still be used', () => {
    expect(useLine(base, format)).toBe(es.permits.notUsedYet)
    expect(useLine({ ...base, state: 'scheduled' }, format)).toBe(es.permits.notUsedYet)
  })

  it('says when somebody came in', () => {
    const line = useLine(
      { entry_count: 1, entry_returns: 0, last_entry_at: '2026-09-02T20:14:00.000Z', state: 'used' },
      format,
    )
    expect(line).toContain('[2026-09-02T20:14:00.000Z]')
    // One entry needs no count: "1 vez" tells the reader nothing the date did
    // not already say.
    expect(line).not.toContain(es.permits.usedTimes)
  })

  it('adds the count only once it stops being obvious', () => {
    const line = useLine(
      { entry_count: 4, entry_returns: 0, last_entry_at: '2026-09-02T20:14:00.000Z', state: 'active' },
      format,
    )
    expect(line).toContain(es.permits.usedTimes)
    expect(line).toContain('4')
  })

  it('says nothing about a finished permit nobody ever used', () => {
    // A line telling the reader that an expired permit was never used is noise
    // on a screen that already says it expired.
    expect(useLine({ ...base, state: 'expired' }, format)).toBeNull()
    expect(useLine({ ...base, state: 'revoked' }, format)).toBeNull()
  })

  it('tells a permit nobody used from one whose visitor was turned around', () => {
    // Decision 015. Both are at zero entries, and they are not the same fact.
    // An administrator asked for exactly this difference.
    expect(useLine(base, format)).toBe(es.permits.notUsedYet)
    expect(useLine({ ...base, entry_returns: 1 }, format)).toBe(es.permits.visitorNeverCame)
  })

  it('still says when somebody came in, even after an earlier one was given back', () => {
    // A permit for free entries: two people came in, one was given back. What
    // matters is that somebody is inside, not the correction.
    const line = useLine(
      { entry_count: 1, entry_returns: 1, last_entry_at: '2026-09-03T14:00:00.000Z', state: 'active' },
      format,
    )
    expect(line).toContain('[2026-09-03T14:00:00.000Z]')
    expect(line).not.toBe(es.permits.visitorNeverCame)
  })

  it('names the spent state, and does not reuse another one for it', () => {
    expect(stateLabel('used')).toBe(es.permits.stateUsed)
    expect(stateLabel('used')).not.toBe(stateLabel('expired'))
    expect(stateLabel('used')).not.toBe(stateLabel('revoked'))
  })

  it('offers exactly the two kinds of permit, each with its consequence', () => {
    expect(ENTRY_MODE_OPTIONS.map((option) => option.value)).toEqual(['single', 'multiple'])
    // The label alone does not say that a single-entry permit stops working;
    // the hint has to, because that is what surprises somebody later.
    for (const option of ENTRY_MODE_OPTIONS) {
      expect(option.hint.length).toBeGreaterThan(option.label.length)
    }
  })
})


// ---------------------------------------------------------------------------
// The days and hours a permit may be used (Decision 016)
// ---------------------------------------------------------------------------

describe('writing a schedule the way somebody would say it', () => {
  it('names the week rather than listing it', () => {
    expect(formatDays([1, 2, 3, 4, 5])).toBe('de lunes a viernes')
    expect(formatDays([0, 1, 2, 3, 4, 5, 6])).toBe('todos los días')
    expect(formatDays([0, 6])).toBe('fines de semana')
  })

  it('lists the days when they are not a named group', () => {
    expect(formatDays([1, 3, 5])).toBe('lunes, miércoles y viernes')
    expect(formatDays([3])).toBe('miércoles')
  })

  it('puts the week in the order a reader looks for it, not in the API s order', () => {
    // Sunday is 0 for the API and last for a person. Sorting the numbers would
    // put it first on the screen.
    expect(formatDays([0, 1])).toBe('lunes y domingo')
  })

  it('writes the hours the way they are said out loud', () => {
    expect(formatHour('07:00')).toBe('7:00 a. m.')
    expect(formatHour('16:30')).toBe('4:30 p. m.')
    expect(formatHour('00:15')).toBe('12:15 a. m.')
    expect(formatHour('12:00')).toBe('12:00 p. m.')
  })

  it('writes the whole schedule as one sentence', () => {
    expect(formatSchedule({ days: [1, 2, 3, 4, 5], from: '07:00', to: '16:00' })).toBe(
      'de lunes a viernes, de 7:00 a. m. a 4:00 p. m.',
    )
  })

  it('says a permit with no schedule works at any time', () => {
    expect(formatSchedule(null)).toBe(es.permits.scheduleAlways)
    expect(formatSchedule(undefined)).toBe(es.permits.scheduleAlways)
  })
})

describe('checking a schedule before it is sent', () => {
  it('accepts a normal one', () => {
    expect(checkSchedule([1, 3, 5], '07:00', '16:00')).toBeUndefined()
  })

  it('asks for at least one day', () => {
    expect(checkSchedule([], '07:00', '16:00')).toBe(es.validation.scheduleNeedsDay)
  })

  it('refuses a window that ends when it starts', () => {
    expect(checkSchedule([1], '07:00', '07:00')).toBe(es.validation.scheduleOutOfOrder)
  })

  it('says what to do about a night shift instead of just refusing it', () => {
    // Two permits, and the message says so — the person is trying to express
    // something real, and "no" on its own leaves them stuck.
    expect(checkSchedule([1], '22:00', '06:00')).toBe(es.validation.scheduleNoMidnight)
  })
})
