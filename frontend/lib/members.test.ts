import { describe, expect, it } from 'vitest'
import { checkEmail, checkRequiredText } from './validate'
import { ApiError, toSpanish } from './errors'
import { es } from './strings'
import { memberLabel } from './members'

/**
 * The people screen's pure logic (Decision 006). Whether a list renders or a
 * dialog opens is only honestly checkable by a person driving a browser, and is
 * verified that way instead of being faked here.
 */

describe('adding a person', () => {
  it('asks for each missing thing by name', () => {
    expect(checkRequiredText('', es.validation.firstNameRequired, 100)).toBe(
      es.validation.firstNameRequired,
    )
    expect(checkRequiredText('  ', es.validation.lastNameRequired, 100)).toBe(
      es.validation.lastNameRequired,
    )
    expect(checkEmail('')).toBe(es.validation.emailRequired)
    expect(checkEmail('maria@')).toBe(es.validation.emailInvalid)
    expect(checkEmail('maria@example.com')).toBeUndefined()
  })

  it('refuses a name longer than the API will accept', () => {
    // The API caps a first or last name at 100 characters.
    expect(checkRequiredText('a'.repeat(101), es.validation.firstNameRequired, 100)).toBe(
      es.validation.textTooLong,
    )
    expect(checkRequiredText('a'.repeat(100), es.validation.firstNameRequired, 100)).toBeUndefined()
  })
})

describe('the refusals the people screen must tell apart', () => {
  it('explains that an administrator cannot add themselves', () => {
    // 409, not 403. A generic "not allowed" would leave the administrator
    // hunting for a permission problem that does not exist.
    const error = new ApiError(409, {
      error: 'conflict',
      message: 'You are an administrator of this organization.',
    })

    expect(toSpanish(error)).toBe(es.errors.conflict)
    expect(es.members.selfConflict).not.toBe(es.errors.notAllowed)
  })

  it('names the reason a person cannot be removed', () => {
    // The API refuses while they are still in charge of an interior. The
    // message has to say what to do about it, not just that it failed.
    expect(es.members.removeConflict).toContain('responsable')
    expect(es.members.removeConflict).not.toBe(es.errors.conflict)
  })

  it('does not promise an email that was not sent', () => {
    // Firebase sends the "set your password" email, not our API. If that call
    // fails the person is still a member, and the screen says so honestly.
    expect(es.members.added).not.toBe(es.members.addedNoEmail)
    expect(es.members.addedNoEmail).toContain('no pudimos')
  })
})

describe('what the screens promise about stored data', () => {
  it('does not claim we keep the email address', () => {
    // Decision 002 and 006: Firebase holds the email, our database does not.
    expect(es.members.privacyNote).toContain('Firebase')
    expect(es.members.emailHint).toContain('contraseña')
  })
})

describe('what to call a person on screen', () => {
  it('uses the name when there is one', () => {
    expect(memberLabel({ first_name: 'María', last_name: 'Gómez', email: 'm@example.com' })).toBe(
      'María Gómez',
    )
  })

  it('falls back to the email when the account has no name', () => {
    // Found in live use on 2026-08-31: an account created by signing up carries
    // no name until someone fills one in, so building the label from the name
    // alone produced an empty string. In the responsable selector that rendered
    // as a blank option — one that works when chosen but shows nothing.
    expect(memberLabel({ first_name: '', last_name: '', email: 'hola@example.com' })).toBe(
      'hola@example.com',
    )
    expect(memberLabel({ first_name: '  ', last_name: '  ', email: 'hola@example.com' })).toBe(
      'hola@example.com',
    )
  })

  it('never returns an empty string, even with no name and no email', () => {
    // Whatever it returns, something has to be visible: an option a person
    // cannot see is an option they cannot choose.
    expect(memberLabel({ first_name: '', last_name: '', email: null })).toBe(
      es.common.unnamedPerson,
    )
    expect(memberLabel({ first_name: '', last_name: '', email: null })).not.toBe('')
  })
})
