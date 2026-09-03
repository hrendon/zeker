import { es } from './strings'
import { denyMessage, noteLabel } from './gate'
import type { AccessEvent } from './api'

/**
 * The entry history: turning what the server answered into what a person reads.
 *
 * Kept out of the screen so it can be tested on its own, like `gate.ts` and
 * `permits.ts` next to their own screens.
 */

/** A day and a time, in the reader's own timezone. Never "Invalid Date". */
export function formatWhen(iso: string | null): string {
  if (!iso) return ''
  const at = new Date(iso)
  if (Number.isNaN(at.getTime())) return ''
  return at.toLocaleString('es-CO', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
}

/**
 * One line, in one sentence.
 *
 * A refusal says which refusal it was: somebody reading the history a week
 * later is asking the same question the guard asked at the door, and "no" on
 * its own answers nothing — the same rule the gate screen follows.
 */
export function lineFor(event: AccessEvent): string {
  if (event.action === 'note') {
    const said = event.note ? noteLabel(event.note) : ''
    return event.entry_returned ? `${said} · ${es.history.entryReturned}` : said
  }
  return event.result === 'allowed' ? es.history.allowed : denyMessage(event.deny_reason ?? '')
}

/** Who the line is about. A check that matched no permit has nobody to name. */
export function whoFor(event: AccessEvent): string {
  if (event.visitor_name) return event.visitor_name
  return event.permit_id ? '' : es.history.unknownVisitor
}

/**
 * A guard's note belongs under the check it corrects, not floating on its own
 * (Decision 015: a correction is a new record, never an edit — so both are
 * shown, and the pairing is done here).
 *
 * A note whose check fell outside this page stays as its own row rather than
 * being dropped. Losing it would be the one thing a history must never do.
 */
export interface HistoryRow {
  event: AccessEvent
  notes: AccessEvent[]
}

export function groupByCheck(events: AccessEvent[]): HistoryRow[] {
  const notes = new Map<string, AccessEvent[]>()
  for (const event of events) {
    if (event.action !== 'note' || !event.about_event_id) continue
    const held = notes.get(event.about_event_id) ?? []
    held.push(event)
    notes.set(event.about_event_id, held)
  }

  const checks = new Set(events.filter((one) => one.action !== 'note').map((one) => one.id))

  const rows: HistoryRow[] = []
  for (const event of events) {
    if (event.action === 'note') {
      // Kept as its own row only when its check is not on this page.
      if (!event.about_event_id || !checks.has(event.about_event_id)) {
        rows.push({ event, notes: [] })
      }
      continue
    }
    rows.push({ event, notes: notes.get(event.id) ?? [] })
  }
  return rows
}
