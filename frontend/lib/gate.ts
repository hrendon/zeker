import { es } from './strings'
import type { CheckNote, DenyReason } from './api'

/**
 * The gate: turning what the server answered into what the guard reads.
 *
 * Kept out of the screen so it can be tested on its own, the same reason
 * `permits.ts` exists next to the permit screens.
 */

/**
 * One sentence per refusal.
 *
 * A guard who is only told "no" cannot explain anything to the person standing
 * in front of them, and an unexplained refusal at a gate turns into an
 * argument. Each reason names what is actually wrong.
 */
const DENY_MESSAGES: Record<DenyReason, string> = {
  invalid_code: es.gate.reasonInvalidCode,
  revoked: es.gate.reasonRevoked,
  already_used: es.gate.reasonAlreadyUsed,
  not_started: es.gate.reasonNotStarted,
  expired: es.gate.reasonExpired,
  outside_schedule: es.gate.reasonOutsideSchedule,
  wrong_location: es.gate.reasonWrongLocation,
}

/** Never empty: an unknown reason still has to say something truthful. */
export function denyMessage(reason: string): string {
  return DENY_MESSAGES[reason as DenyReason] ?? es.errors.unknown
}

/**
 * Tidies what a guard typed, for display only.
 *
 * Nothing is corrected here. The server folds the four confusable characters
 * (I, L, O, U onto 1, 1, 0, V) when it looks the code up, and doing it twice
 * in two places is how the two drift apart. This only drops the separators a
 * person naturally types and raises the case, so the field looks like the code
 * on the visitor's phone.
 *
 * Capped at twelve characters — a real code is eight, and the cap keeps a
 * pasted paragraph out of the field.
 */
export function cleanCode(input: string): string {
  return input.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 12)
}

/** How a code is shown back: `A1B2-C3D4`, the same grouping as the permit. */
export function groupCode(code: string): string {
  const clean = cleanCode(code)
  return clean.length > 4 ? `${clean.slice(0, 4)}-${clean.slice(4)}` : clean
}

/**
 * What a guard may record after a check (Decision 015).
 *
 * Four fixed options and no text box. What lands in a free field at a real
 * gate is cedulas, phone numbers and descriptions of people who consented to
 * nothing — the thing this project has now refused four times. A closed list
 * is also the only version an administrator can count.
 *
 * The list lives here rather than in the screen so it can be checked against
 * the API's own list: if the two ever drift, a guard taps a button and is
 * handed an error at a gate.
 */
const NOTE_LABELS: Record<CheckNote, string> = {
  no_entry: es.gate.noteNoEntry,
  sent_to_other_entrance: es.gate.noteSentToOtherEntrance,
  returning_later: es.gate.noteReturningLater,
  asked_resident: es.gate.noteAskedResident,
}

/** Never empty, for the same reason a refusal is never empty. */
export function noteLabel(note: CheckNote): string {
  return NOTE_LABELS[note] ?? es.errors.unknown
}

/**
 * Which reasons to offer, given what the check answered.
 *
 * "El visitante no entró" only appears after a "puede entrar": under a refusal
 * it would ask the guard to record what the screen just said, and there would
 * be no entry to give back anyway.
 */
export function notesFor(allowed: boolean): CheckNote[] {
  const rest: CheckNote[] = ['sent_to_other_entrance', 'returning_later', 'asked_resident']
  return allowed ? ['no_entry', ...rest] : rest
}
