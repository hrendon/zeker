import { describe, expect, it } from 'vitest'
import {
  checkEmail,
  checkName,
  checkNewPassword,
  checkOptionalName,
  checkPasswordPresent,
} from './validate'
import { es } from './strings'

describe('form checks', () => {
  it('accepts a normal address and rejects an obviously broken one', () => {
    expect(checkEmail('juan@example.com')).toBeUndefined()
    expect(checkEmail('  juan@example.com  ')).toBeUndefined()
    expect(checkEmail('')).toBe(es.validation.emailRequired)
    expect(checkEmail('juan@')).toBe(es.validation.emailInvalid)
    expect(checkEmail('juan example.com')).toBe(es.validation.emailInvalid)
  })

  it('blocks a short password when creating an account', () => {
    expect(checkNewPassword('1234567')).toBe(es.validation.passwordTooShort)
    expect(checkNewPassword('12345678')).toBeUndefined()
  })

  it('accepts any password when signing in', () => {
    // The old account may predate the 8-character rule. Refusing to even try
    // would lock that person out of their own account.
    expect(checkPasswordPresent('short')).toBeUndefined()
    expect(checkPasswordPresent('')).toBe(es.validation.passwordRequired)
  })

  it('requires a name and refuses an unreasonably long one', () => {
    expect(checkName('María', 'first')).toBeUndefined()
    expect(checkName('   ', 'first')).toBe(es.validation.firstNameRequired)
    expect(checkName('   ', 'last')).toBe(es.validation.lastNameRequired)
    expect(checkName('a'.repeat(61), 'last')).toBe(es.validation.nameTooLong)
  })

  // 2026-09-04. El apellido dejó de ser obligatorio: un apellido al lado de un
  // número de apartamento es la mitad que le sirve a quien no debería tenerla.
  it('acepta un apellido en blanco y sigue midiendo el largo', () => {
    expect(checkOptionalName('')).toBeUndefined()
    expect(checkOptionalName('   ')).toBeUndefined()
    expect(checkOptionalName('García')).toBeUndefined()
    expect(checkOptionalName('x'.repeat(101))).toBe(es.validation.nameTooLong)
  })
})
