import { describe, expect, it } from 'vitest'
import { checkRequiredText } from './validate'
import { ApiError, toSpanish } from './errors'
import { es } from './strings'

/**
 * The setup screens' pure logic. Everything else about them — a list actually
 * rendering, a menu opening, a delete button firing — is only honestly
 * checkable by a person driving a browser, and is verified that way instead of
 * being faked here.
 */

describe('required text fields', () => {
  it('asks for the specific thing that is missing', () => {
    // A generic "this field is required" makes a person hunt for which one.
    expect(checkRequiredText('', es.validation.orgNameRequired)).toBe(
      es.validation.orgNameRequired,
    )
    expect(checkRequiredText('   ', es.validation.numberRequired, 40)).toBe(
      es.validation.numberRequired,
    )
    expect(checkRequiredText('302', es.validation.numberRequired, 40)).toBeUndefined()
  })

  it('refuses text longer than the API will accept', () => {
    // The API caps an interior number at 40 characters and a name at 120.
    expect(checkRequiredText('a'.repeat(41), es.validation.numberRequired, 40)).toBe(
      es.validation.textTooLong,
    )
    expect(checkRequiredText('a'.repeat(40), es.validation.numberRequired, 40)).toBeUndefined()
    expect(checkRequiredText('a'.repeat(121), es.validation.orgNameRequired, 120)).toBe(
      es.validation.textTooLong,
    )
  })
})

describe('telling apart the two refusals that are both 403', () => {
  it('says "upgrade your plan" for a quota refusal', () => {
    const error = new ApiError(403, {
      error: 'quota_exceeded',
      message: 'Organization has reached its plan limit of 10 interiors.',
      request_id: 'req_1',
    })

    expect(toSpanish(error)).toBe(es.errors.quotaExceeded)
  })

  it('says "you are not allowed" for a permission refusal', () => {
    // Same 403 status. Only the code separates them, so the frontend must
    // branch on the code — a member who is not an admin is not out of room.
    const error = new ApiError(403, { error: 'forbidden', message: 'Admin role required.' })

    expect(toSpanish(error)).toBe(es.errors.notAllowed)
    expect(toSpanish(error)).not.toBe(es.errors.quotaExceeded)
  })

  it('explains a conflict rather than blaming the plan', () => {
    // Deleting a site that still has interiors comes back as 409, not 403.
    const error = new ApiError(409, {
      error: 'conflict',
      message: 'Location still has interiors.',
    })

    expect(toSpanish(error)).toBe(es.errors.conflict)
  })

  it('sends someone back to sign in when the session died mid-task', () => {
    const error = new ApiError(401, { error: 'unauthorized' })
    expect(toSpanish(error)).toBe(es.errors.sessionExpired)
  })
})

describe('the Spanish is complete', () => {
  it('has no empty text anywhere the setup screens read from', () => {
    // A missing string renders as blank space, which looks like a bug and
    // gives the person nothing to act on.
    const groups = [es.orgs, es.org, es.locations, es.interiors, es.usage, es.actions, es.nav]

    for (const group of groups) {
      for (const [key, value] of Object.entries(group)) {
        expect(typeof value, key).toBe('string')
        expect((value as string).trim(), key).not.toBe('')
      }
    }
  })
})
