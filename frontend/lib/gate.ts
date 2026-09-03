import { es } from './strings'
import type { DenyReason } from './api'

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
