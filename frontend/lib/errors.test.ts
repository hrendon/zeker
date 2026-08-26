import { describe, expect, it } from 'vitest'
import { ApiError, NetworkError, toSpanish } from './errors'
import { es } from './strings'

describe('toSpanish', () => {
  it('gives the same answer for a wrong password and an unknown account', () => {
    // Different answers would let anyone check who has an account with us.
    const wrongPassword = toSpanish({ code: 'auth/wrong-password' })
    const noSuchUser = toSpanish({ code: 'auth/user-not-found' })
    const modernCombined = toSpanish({ code: 'auth/invalid-credential' })

    expect(wrongPassword).toBe(es.errors.badCredentials)
    expect(noSuchUser).toBe(wrongPassword)
    expect(modernCombined).toBe(wrongPassword)
  })

  it('translates the API error codes the backend actually returns', () => {
    // These eight are the full contract in backend/src/lib/errors.ts.
    const codes = [
      'invalid_request',
      'unauthorized',
      'forbidden',
      'quota_exceeded',
      'not_found',
      'conflict',
      'rate_limited',
      'internal_server_error',
    ]

    for (const code of codes) {
      const message = toSpanish(new ApiError(400, { error: code }))
      expect(message, code).not.toBe(es.errors.unknown)
      expect(message, code).not.toBe('')
    }
  })

  it('never shows the English text the API sends for developers', () => {
    const error = new ApiError(403, {
      error: 'quota_exceeded',
      message: 'Organization has reached its plan limit of 10 interiors.',
    })

    expect(toSpanish(error)).toBe(es.errors.quotaExceeded)
    expect(toSpanish(error)).not.toContain('plan limit')
  })

  it('explains a lost connection rather than blaming the user', () => {
    expect(toSpanish(new NetworkError())).toBe(es.errors.network)
    expect(toSpanish({ code: 'auth/network-request-failed' })).toBe(es.errors.network)
  })

  it('always returns something for an error it has never seen', () => {
    expect(toSpanish(new Error('boom'))).toBe(es.errors.unknown)
    expect(toSpanish(undefined)).toBe(es.errors.unknown)
    expect(toSpanish(new ApiError(503, { error: 'gateway_down' }))).toBe(es.errors.serverError)
  })
})
