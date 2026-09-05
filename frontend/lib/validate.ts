import { es } from './strings'

/**
 * Form checks that run in the browser before anything is sent.
 *
 * These exist to give a fast, clear answer in Spanish — not to enforce
 * anything. Firebase enforces password rules and the Zeker API validates every
 * field again on arrival. A browser check is a convenience, never a control.
 */

/** Firebase and the API both reject longer names. */
const MAX_NAME_LENGTH = 60

// Deliberately loose. The only reliable test of an address is sending mail to
// it; a strict pattern mostly rejects valid, unusual addresses.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const MIN_PASSWORD_LENGTH = 8

export function checkEmail(value: string): string | undefined {
  const trimmed = value.trim()
  if (!trimmed) return es.validation.emailRequired
  if (!EMAIL_PATTERN.test(trimmed)) return es.validation.emailInvalid
  return undefined
}

/** Used when signing in: any non-empty password is worth trying. */
export function checkPasswordPresent(value: string): string | undefined {
  if (!value) return es.validation.passwordRequired
  return undefined
}

/** Used when creating an account, where a weak password is worth blocking. */
export function checkNewPassword(value: string): string | undefined {
  if (!value) return es.validation.passwordRequired
  if (value.length < MIN_PASSWORD_LENGTH) return es.validation.passwordTooShort
  return undefined
}

export function checkName(
  value: string,
  which: 'first' | 'last',
): string | undefined {
  const trimmed = value.trim()
  if (!trimmed) {
    return which === 'first'
      ? es.validation.firstNameRequired
      : es.validation.lastNameRequired
  }
  if (trimmed.length > MAX_NAME_LENGTH) return es.validation.nameTooLong
  return undefined
}

/**
 * Un apellido, que desde el 2026-09-05 puede no existir (Decisión 020).
 *
 * En blanco está bien; lo único que se revisa es que no sea más largo de lo
 * que el servidor acepta. Quien no quiera dejar su apellido guardado no tiene
 * por qué inventarse uno.
 */
export function checkOptionalName(value: string): string | undefined {
  if (value.trim().length > MAX_NAME_LENGTH) return es.validation.nameTooLong
  return undefined
}

/**
 * A required free-text field: present, and not longer than the API accepts.
 * `missing` is the Spanish sentence shown when it is blank.
 */
export function checkRequiredText(
  value: string,
  missing: string,
  maxLength = MAX_NAME_LENGTH,
): string | undefined {
  const trimmed = value.trim()
  if (!trimmed) return missing
  if (trimmed.length > maxLength) return es.validation.textTooLong
  return undefined
}
