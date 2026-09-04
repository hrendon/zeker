/**
 * Local time for an organization.
 *
 * Everything else in this product stores instants in UTC and never thinks
 * about a calendar. A weekly schedule on a permit is the first thing that
 * cannot: "Monday, 7:00 to 16:00" is a statement about the building's own
 * clock, and the same instant is Monday in Bogotá and Tuesday in Sydney.
 *
 * Decision 007 removed the daily time window partly for this reason — it
 * "needs each building's local time", and no building had one. Decision 016
 * gives the organization a timezone, and this file is where an instant is
 * turned into that building's day and minute.
 *
 * **Why IANA names and not a stored offset.** An offset in minutes would be
 * enough for Colombia, which has never had daylight saving. It is wrong the
 * first time a customer is in Santiago or Mexico City, and it is wrong
 * silently: a permit for "7:00" would admit somebody at 6:00 for half the
 * year. `Intl` carries the whole history of each zone's rules, so asking it
 * for the local parts of an instant is correct across a change we would
 * otherwise have to remember.
 */

/** Minutes from midnight to midnight. Used to bound a window. */
export const MINUTES_IN_DAY = 24 * 60

/**
 * Whether the runtime knows this timezone.
 *
 * There is no list to check against — `Intl.supportedValuesOf` exists but is
 * not present everywhere, and the set differs between runtimes. Constructing
 * a formatter is the question actually being asked: can *this* process resolve
 * this name? An unknown name throws `RangeError`.
 */
export function isValidTimeZone(timeZone: string): boolean {
  if (typeof timeZone !== 'string' || timeZone.trim().length === 0) return false
  try {
    new Intl.DateTimeFormat('en-US', { timeZone })
    return true
  } catch {
    return false
  }
}

/** Day numbers as `Date.getDay()` uses them, so nothing has to be translated. */
const DAY_NUMBERS: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
}

/**
 * One formatter per timezone. Building an `Intl.DateTimeFormat` is the
 * expensive part, and the gate calls this on a person's held-out phone with
 * somebody waiting — so the formatters are made once and kept. The map is
 * bounded in practice by the number of organizations this process serves.
 */
const formatters = new Map<string, Intl.DateTimeFormat>()

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  const existing = formatters.get(timeZone)
  if (existing) return existing

  const created = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  formatters.set(timeZone, created)
  return created
}

export interface LocalMoment {
  /** 0 = Sunday … 6 = Saturday, in the given zone. */
  day: number
  /** Minutes since local midnight. 7:30 in the morning is 450. */
  minutes: number
}

/**
 * What day and time it is, in one building's own clock, at a given instant.
 *
 * Throws if the timezone is unknown — the caller is expected to have stored a
 * valid one, and guessing a zone at a door would be worse than failing.
 */
export function localMoment(at: Date, timeZone: string): LocalMoment {
  const parts = formatterFor(timeZone).formatToParts(at)

  let day = -1
  let hour = -1
  let minute = -1

  for (const part of parts) {
    if (part.type === 'weekday') day = DAY_NUMBERS[part.value] ?? -1
    // `hour12: false` yields 00–23 everywhere except that some runtimes emit
    // "24" for midnight. Folding it here costs nothing and removes a class of
    // bug that would only appear at one minute of the day.
    else if (part.type === 'hour') hour = Number(part.value) % 24
    else if (part.type === 'minute') minute = Number(part.value)
  }

  if (day < 0 || !Number.isFinite(hour) || !Number.isFinite(minute)) {
    throw new Error(`Could not read the local time in ${timeZone}.`)
  }

  return { day, minutes: hour * 60 + minute }
}

/** `"07:30"` → 450. Returns null for anything that is not a 24-hour HH:MM. */
export function minutesFromHhMm(value: string): number | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(value).trim())
  if (!match) return null
  return Number(match[1]) * 60 + Number(match[2])
}

/** 450 → `"07:30"`. */
export function hhMmFromMinutes(minutes: number): string {
  const whole = Math.max(0, Math.min(MINUTES_IN_DAY - 1, Math.trunc(minutes)))
  const hours = Math.floor(whole / 60)
  const rest = whole % 60
  return `${String(hours).padStart(2, '0')}:${String(rest).padStart(2, '0')}`
}
