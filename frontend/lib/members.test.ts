import { describe, expect, it } from 'vitest'
import { checkEmail, checkRequiredText } from './validate'
import { ApiError, toSpanish } from './errors'
import { es } from './strings'
import { canResendInvite, invitePending, memberLabel } from './members'

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

describe('telling apart an account and actual access', () => {
  it('marks somebody who was invited and never got in', () => {
    expect(invitePending({ has_signed_in: false })).toBe(true)
    expect(invitePending({ has_signed_in: true })).toBe(false)
  })

  it('says nothing about a person Firebase did not return', () => {
    // `null` is "we do not know", and the screen must not turn that into
    // "has not entered". A label that is sometimes invented is a label an
    // administrator learns to ignore.
    expect(invitePending({ has_signed_in: null })).toBe(false)
    expect(canResendInvite({ has_signed_in: null, email: 'maria@example.com' })).toBe(false)
  })

  it('offers to send the email again only to someone still locked out', () => {
    expect(canResendInvite({ has_signed_in: false, email: 'maria@example.com' })).toBe(true)
    // Already inside: this would be an administrator resetting someone else's
    // password, which is not what the action is for.
    expect(canResendInvite({ has_signed_in: true, email: 'maria@example.com' })).toBe(false)
    // Nowhere to send it.
    expect(canResendInvite({ has_signed_in: false, email: null })).toBe(false)
  })
})

describe('what the people screen says about the email', () => {
  it('warns that the email can land in spam, and names the sender', () => {
    // The first thing that goes wrong with an invitation nobody received.
    expect(es.members.emailDeliveryNote).toContain('spam')
    expect(es.members.emailDeliveryNote).toContain('noreply')
  })

  it('explains what the label means and what to do about it', () => {
    // A badge that only labels the problem leaves the administrator stuck.
    expect(es.members.neverSignedInHint).toContain(es.members.neverSignedIn)
    expect(es.members.neverSignedInHint).toContain('contraseña')
  })

  it('does not answer a missing account with a password error', () => {
    // The shared translation for auth/user-not-found is "wrong credentials",
    // which on this screen would send an administrator hunting for a typo in a
    // password nobody typed.
    expect(es.members.resendNoAccount).not.toBe(es.errors.badCredentials)
    expect(es.members.resendNoAccount).toContain('ya no existe')
  })
})
