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

describe('when the app is opened from an address the API key does not allow', () => {
  /**
   * The real code observed in a browser on 2026-09-02. Google's refusal is a
   * sentence, and the SDK turns the whole sentence into the error code — so the
   * address the person used is part of the code itself.
   */
  const blocked = {
    code: 'auth/requests-from-referer-https://zeker-web-krsxkgch7q-uc.a.run.app/entrar-are-blocked.',
  }

  it('recognises it however the address changes', () => {
    expect(toSpanish(blocked)).toBe(es.errors.originBlocked)
    expect(
      toSpanish({ code: 'auth/requests-from-referer-https://otra.direccion/-are-blocked.' }),
    ).toBe(es.errors.originBlocked)
  })

  it('does not tell the person to wait and try again', () => {
    // This is exactly what happened: the generic message invited a retry, and
    // the Founder retried against something that could never succeed.
    expect(toSpanish(blocked)).not.toBe(es.errors.unknown)
    expect(es.errors.originBlocked).toContain('esperar no lo va a resolver')
  })

  it('still leaves every other auth failure alone', () => {
    expect(toSpanish({ code: 'auth/invalid-credential' })).toBe(es.errors.badCredentials)
    expect(toSpanish({ code: 'auth/expired-action-code' })).toBe(es.errors.expiredLink)
  })
})


describe('the two refusals a guard can hit after a check (Decision 015)', () => {
  // Both are 409s. Telling a guard "esa acción choca con algo que ya existe"
  // while somebody waits at the gate is the same failure Decision 008 fixed
  // for refusals: a person who is only told "no" can explain nothing.
  it('says the window has passed, and what to do instead', () => {
    const message = toSpanish(
      new ApiError(409, { error: 'note_too_late', message: 'too old' }),
    )
    expect(message).toBe(es.gate.noteTooLate)
    expect(message).not.toBe(es.errors.conflict)
    expect(message).not.toBe(es.errors.unknown)
  })

  it('says somebody already recorded it', () => {
    const message = toSpanish(
      new ApiError(409, { error: 'note_already_recorded', message: 'already noted' }),
    )
    expect(message).toBe(es.gate.noteAlready)
    expect(message).not.toBe(es.errors.conflict)
  })

  it('does not give the two the same words', () => {
    expect(es.gate.noteTooLate).not.toBe(es.gate.noteAlready)
  })
})

describe('the limits on adding people (R-02)', () => {
  it('says the day s allowance is used up, not that something went wrong', () => {
    // Both are 429s. Telling an administrator "demasiados intentos" when the
    // truth is "hoy ya no, mañana sí" sends them to look for a mistake they
    // did not make.
    const message = toSpanish(
      new ApiError(429, { error: 'invite_limit_reached', message: 'x', request_id: 'req_1' }),
    )

    expect(message).toBe(es.errors.inviteLimitReached)
    expect(message).not.toBe(es.errors.tooManyAttempts)
  })

  it('says the same about the day s permits, and not "algo salio mal"', () => {
    // Sin su propia linea, permit_limit_reached cae en es.errors.unknown y la
    // persona reintenta contra un limite que solo se abre manana.
    const message = toSpanish(
      new ApiError(429, { error: 'permit_limit_reached', message: 'x', request_id: 'req_1' }),
    )

    expect(message).toBe(es.errors.permitLimitReached)
    expect(message).not.toBe(es.errors.unknown)
    expect(message).not.toBe(es.errors.inviteLimitReached)
  })

  it('keeps the plan limit and the daily limit as different sentences', () => {
    const planLimit = toSpanish(
      new ApiError(403, { error: 'quota_exceeded', message: 'x', request_id: 'req_1' }),
    )
    const dailyLimit = toSpanish(
      new ApiError(429, { error: 'invite_limit_reached', message: 'x', request_id: 'req_1' }),
    )

    expect(planLimit).not.toBe(dailyLimit)
  })
})
