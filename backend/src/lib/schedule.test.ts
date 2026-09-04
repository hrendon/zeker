import { describe, expect, it } from 'vitest'
import { allowsEntryAt, readSchedule, scheduleOf } from './permits.js'
import { hhMmFromMinutes, isValidTimeZone, localMoment, minutesFromHhMm } from './time.js'

/**
 * Decision 016 — the weekly schedule on a permit.
 *
 * These tests are about one thing above all others: **a schedule is read in
 * the building's own clock, not in UTC.** Bogotá is five hours behind, so
 * every case below is chosen so that reading the instant as UTC gives the
 * wrong answer. If somebody ever removes the timezone and compares hours
 * directly, these fail rather than passing quietly.
 */

const BOGOTA = 'America/Bogota'
/** A zone that observes daylight saving, so the offset is not a constant. */
const SANTIAGO = 'America/Santiago'

/** Monday 2026-09-07, 12:00 UTC — 07:00 in Bogotá. */
const MONDAY_0700_BOGOTA = new Date('2026-09-07T12:00:00.000Z')

const WEEKDAY_MORNINGS = { days: [1, 3, 5], from: '07:00', to: '16:00' }

function permitWith(schedule: unknown) {
  return { schedule } as Parameters<typeof allowsEntryAt>[0]
}

describe('local time in a building', () => {
  it('reads the day and the minute in the building s own zone, not UTC', () => {
    // 12:00 UTC on a Monday is 07:00 on the same Monday in Bogotá.
    expect(localMoment(MONDAY_0700_BOGOTA, BOGOTA)).toEqual({ day: 1, minutes: 7 * 60 })
    expect(localMoment(MONDAY_0700_BOGOTA, 'UTC')).toEqual({ day: 1, minutes: 12 * 60 })
  })

  it('crosses into the previous day when the building is behind UTC', () => {
    // Tuesday 02:00 UTC is still Monday, 21:00, in Bogotá. A schedule read in
    // UTC would call this Tuesday and let the wrong visitor in.
    const instant = new Date('2026-09-08T02:00:00.000Z')
    expect(localMoment(instant, BOGOTA)).toEqual({ day: 1, minutes: 21 * 60 })
    expect(localMoment(instant, 'UTC')).toEqual({ day: 2, minutes: 2 * 60 })
  })

  it('follows daylight saving where a zone has it', () => {
    // Santiago is UTC-4 in January (southern summer) and UTC-3 in July. A
    // stored offset would be an hour wrong for half the year.
    const january = new Date('2026-01-15T15:00:00.000Z')
    const july = new Date('2026-07-15T15:00:00.000Z')
    expect(localMoment(january, SANTIAGO).minutes).toBe(12 * 60)
    expect(localMoment(july, SANTIAGO).minutes).toBe(11 * 60)
  })

  it('accepts a real zone and refuses one that does not exist', () => {
    expect(isValidTimeZone(BOGOTA)).toBe(true)
    expect(isValidTimeZone('America/Bogotá')).toBe(false)
    expect(isValidTimeZone('')).toBe(false)
  })

  it('reads and writes HH:MM', () => {
    expect(minutesFromHhMm('07:30')).toBe(450)
    expect(minutesFromHhMm('00:00')).toBe(0)
    expect(minutesFromHhMm('24:00')).toBeNull()
    expect(minutesFromHhMm('7:30')).toBeNull()
    expect(minutesFromHhMm('07:60')).toBeNull()
    expect(hhMmFromMinutes(450)).toBe('07:30')
  })
})

describe('a permit with no schedule', () => {
  it('is allowed at any hour of any day — which is every permit issued before Decision 016', () => {
    const middleOfTheNight = new Date('2026-09-06T07:00:00.000Z') // Sunday 02:00 in Bogotá
    expect(allowsEntryAt(permitWith(undefined), middleOfTheNight, BOGOTA)).toBe(true)
    expect(allowsEntryAt(permitWith(null), middleOfTheNight, BOGOTA)).toBe(true)
    expect(scheduleOf(permitWith(undefined))).toBeNull()
  })
})

describe('a permit with a schedule', () => {
  it('lets the visitor in on a listed day, inside the hours', () => {
    expect(allowsEntryAt(permitWith(WEEKDAY_MORNINGS), MONDAY_0700_BOGOTA, BOGOTA)).toBe(true)
  })

  it('refuses a day that is not listed', () => {
    // Tuesday 12:00 UTC — 07:00 in Bogotá, the right hour on the wrong day.
    const tuesday = new Date('2026-09-08T12:00:00.000Z')
    expect(allowsEntryAt(permitWith(WEEKDAY_MORNINGS), tuesday, BOGOTA)).toBe(false)
  })

  it('refuses before the window opens and after it closes', () => {
    const monday0659 = new Date('2026-09-07T11:59:00.000Z')
    const monday1559 = new Date('2026-09-07T20:59:00.000Z')
    const monday1600 = new Date('2026-09-07T21:00:00.000Z')

    expect(allowsEntryAt(permitWith(WEEKDAY_MORNINGS), monday0659, BOGOTA)).toBe(false)
    expect(allowsEntryAt(permitWith(WEEKDAY_MORNINGS), monday1559, BOGOTA)).toBe(true)
    // Inclusive at the start, exclusive at the end: 16:00 on a window that
    // ends at 16:00 is refused, which is how a person reads "hasta las 4".
    expect(allowsEntryAt(permitWith(WEEKDAY_MORNINGS), monday1600, BOGOTA)).toBe(false)
  })

  it('is decided by the building s clock, so the same instant differs by zone', () => {
    // 12:00 UTC on Monday: 07:00 in Bogotá (inside), 12:00 in UTC (inside),
    // and 22:00 in Sydney on Monday (outside).
    expect(allowsEntryAt(permitWith(WEEKDAY_MORNINGS), MONDAY_0700_BOGOTA, BOGOTA)).toBe(true)
    expect(allowsEntryAt(permitWith(WEEKDAY_MORNINGS), MONDAY_0700_BOGOTA, 'Australia/Sydney')).toBe(
      false,
    )
  })

  it('treats a stored schedule it cannot read as no schedule, never as a closed door', () => {
    expect(allowsEntryAt(permitWith({ days: [], from: '07:00', to: '16:00' }), MONDAY_0700_BOGOTA, BOGOTA)).toBe(true)
    expect(allowsEntryAt(permitWith({ days: [1], from: 'siempre', to: '16:00' }), MONDAY_0700_BOGOTA, BOGOTA)).toBe(true)
    expect(allowsEntryAt(permitWith('lunes'), MONDAY_0700_BOGOTA, BOGOTA)).toBe(true)
  })
})

describe('reading a schedule somebody sent', () => {
  it('accepts a valid one and sorts and de-duplicates the days', () => {
    const read = readSchedule({ days: [5, 1, 1, 3], from: '07:00', to: '16:00' })
    expect(read).toEqual({ schedule: { days: [1, 3, 5], from: '07:00', to: '16:00' } })
  })

  it('reads nothing as no schedule', () => {
    expect(readSchedule(undefined)).toEqual({ schedule: null })
    expect(readSchedule(null)).toEqual({ schedule: null })
  })

  it('refuses a schedule with no days', () => {
    expect(readSchedule({ days: [], from: '07:00', to: '16:00' })).toHaveProperty('error')
  })

  it('refuses a day that is not a day of the week', () => {
    expect(readSchedule({ days: [7], from: '07:00', to: '16:00' })).toHaveProperty('error')
    expect(readSchedule({ days: [-1], from: '07:00', to: '16:00' })).toHaveProperty('error')
  })

  it('refuses hours that are not HH:MM', () => {
    expect(readSchedule({ days: [1], from: '7am', to: '16:00' })).toHaveProperty('error')
  })

  it('refuses a window that ends before it starts, and one that crosses midnight', () => {
    expect(readSchedule({ days: [1], from: '16:00', to: '07:00' })).toHaveProperty('error')
    expect(readSchedule({ days: [1], from: '07:00', to: '07:00' })).toHaveProperty('error')
    // 22:00–06:00 is a night shift, and it is deliberately not expressible.
    expect(readSchedule({ days: [1], from: '22:00', to: '06:00' })).toHaveProperty('error')
  })
})
