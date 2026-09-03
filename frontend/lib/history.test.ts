import { describe, expect, it } from 'vitest'
import { formatWhen, groupByCheck, lineFor, whoFor } from './history'
import { es } from './strings'
import type { AccessEvent } from './api'

function event(extra: Partial<AccessEvent> = {}): AccessEvent {
  return {
    id: 'event_1',
    action: 'entry',
    result: 'allowed',
    deny_reason: null,
    note: null,
    about_event_id: null,
    entry_returned: null,
    visitor_name: 'Ana Ruiz',
    permit_id: 'auth_1',
    interior_id: 'int_302',
    interior_number: '302',
    location_id: 'loc_1',
    location_name: 'Portería principal',
    created_at: '2026-09-03T14:05:00.000Z',
    ...extra,
  }
}

describe('what one line of the history says', () => {
  it('says somebody came in', () => {
    expect(lineFor(event())).toBe(es.history.allowed)
  })

  it('names which refusal it was, not just "no"', () => {
    // Somebody reading this a week later is asking the same question the guard
    // asked at the door. "No" on its own answers nothing.
    const line = lineFor(event({ result: 'denied', deny_reason: 'already_used' }))
    expect(line).toBe(es.gate.reasonAlreadyUsed)
    expect(line).not.toBe(es.errors.unknown)
  })

  it('gives each refusal its own words', () => {
    const reasons = ['invalid_code', 'revoked', 'already_used', 'expired', 'wrong_location'] as const
    const lines = reasons.map((reason) => lineFor(event({ result: 'denied', deny_reason: reason })))
    expect(new Set(lines).size).toBe(reasons.length)
  })

  it('reads a guard’s note as what the guard tapped', () => {
    const line = lineFor(
      event({ action: 'note', note: 'returning_later', entry_returned: false }),
    )
    expect(line).toBe(es.gate.noteReturningLater)
  })

  it('says when a note gave the entry back', () => {
    const line = lineFor(event({ action: 'note', note: 'no_entry', entry_returned: true }))
    expect(line).toContain(es.gate.noteNoEntry)
    expect(line).toContain(es.history.entryReturned)
  })
})

describe('who the line is about', () => {
  it('names the visitor', () => {
    expect(whoFor(event())).toBe('Ana Ruiz')
  })

  it('says "sin permiso" when the code matched nothing', () => {
    // Nothing is known about whoever typed it, and inventing a name would be
    // worse than saying so.
    expect(whoFor(event({ permit_id: null, visitor_name: '' }))).toBe(es.history.unknownVisitor)
  })

  it('says nothing rather than guessing when the permit was deleted', () => {
    // The check still happened and the row must stay; the name is simply gone.
    expect(whoFor(event({ permit_id: 'auth_1', visitor_name: '' }))).toBe('')
  })
})

describe('a guard’s note sits under the check it corrects', () => {
  it('attaches the note to its check instead of listing it twice', () => {
    const rows = groupByCheck([
      event({ id: 'note_1', action: 'note', note: 'no_entry', about_event_id: 'check_1' }),
      event({ id: 'check_1' }),
    ])

    expect(rows).toHaveLength(1)
    expect(rows[0]!.event.id).toBe('check_1')
    expect(rows[0]!.notes.map((one) => one.id)).toEqual(['note_1'])
  })

  it('never drops a note whose check is on another page', () => {
    // Losing it is the one thing a history must not do.
    const rows = groupByCheck([
      event({ id: 'note_1', action: 'note', note: 'no_entry', about_event_id: 'check_far_away' }),
      event({ id: 'check_2' }),
    ])

    expect(rows.map((row) => row.event.id)).toEqual(['note_1', 'check_2'])
  })

  it('keeps the checks in the order they arrived', () => {
    const rows = groupByCheck([event({ id: 'c3' }), event({ id: 'c2' }), event({ id: 'c1' })])
    expect(rows.map((row) => row.event.id)).toEqual(['c3', 'c2', 'c1'])
  })

  it('handles an empty page', () => {
    expect(groupByCheck([])).toEqual([])
  })
})

describe('when it happened', () => {
  it('shows a day and a time', () => {
    expect(formatWhen('2026-09-03T14:05:00.000Z')).not.toBe('')
  })

  it('shows nothing rather than "Invalid Date"', () => {
    expect(formatWhen(null)).toBe('')
    expect(formatWhen('no es una fecha')).toBe('')
  })
})
