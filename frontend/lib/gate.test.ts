import { describe, expect, it } from 'vitest'
import { cleanCode, denyMessage, groupCode } from './gate'
import { es } from './strings'

describe('what a guard types', () => {
  it('drops the separators a person naturally types', () => {
    expect(cleanCode('a1b2-c3d4')).toBe('A1B2C3D4')
    expect(cleanCode('A1B2 C3D4')).toBe('A1B2C3D4')
    expect(cleanCode('  a1b2c3d4  ')).toBe('A1B2C3D4')
  })

  it('does not correct the confusable characters itself', () => {
    // The server folds I, L, O and U when it looks the code up. Doing it here
    // as well is how two copies of one rule drift apart, so this only tidies.
    expect(cleanCode('O1B2C3D4')).toBe('O1B2C3D4')
    expect(cleanCode('I1B2C3D4')).toBe('I1B2C3D4')
  })

  it('refuses to hold a pasted paragraph', () => {
    expect(cleanCode('A'.repeat(200))).toHaveLength(12)
  })

  it('shows the code grouped the same way the permit does', () => {
    expect(groupCode('a1b2c3d4')).toBe('A1B2-C3D4')
    // Still readable half-typed, without a dash appearing too early.
    expect(groupCode('a1b')).toBe('A1B')
    expect(groupCode('a1b2')).toBe('A1B2')
    expect(groupCode('')).toBe('')
  })
})

describe('why someone was turned away', () => {
  it('names the actual reason, one sentence each', () => {
    expect(denyMessage('invalid_code')).toBe(es.gate.reasonInvalidCode)
    expect(denyMessage('revoked')).toBe(es.gate.reasonRevoked)
    expect(denyMessage('not_started')).toBe(es.gate.reasonNotStarted)
    expect(denyMessage('expired')).toBe(es.gate.reasonExpired)
    expect(denyMessage('wrong_location')).toBe(es.gate.reasonWrongLocation)
  })

  it('never leaves a guard with a blank screen', () => {
    // A reason we have not seen before still has to say something truthful,
    // rather than showing nothing at a gate with a visitor waiting.
    expect(denyMessage('something_new')).toBe(es.errors.unknown)
    expect(denyMessage('')).toBe(es.errors.unknown)
  })

  it('every reason is in Spanish and says something', () => {
    for (const reason of ['invalid_code', 'revoked', 'not_started', 'expired', 'wrong_location']) {
      expect(denyMessage(reason).length).toBeGreaterThan(10)
      expect(denyMessage(reason)).not.toBe(es.errors.unknown)
    }
  })
})

describe('the refusal for a permit that was already used (Decision 014)', () => {
  it('names it, instead of falling through to the generic answer', () => {
    expect(denyMessage('already_used')).toBe(es.gate.reasonAlreadyUsed)
    expect(denyMessage('already_used')).not.toBe(es.errors.unknown)
  })

  it('tells the guard what can be done about it', () => {
    // Unlike every other refusal, there is a way out of this one, and the
    // person at the gate should hear it rather than just "no".
    expect(es.gate.reasonAlreadyUsed).toContain('nuevo')
  })

  it('is not confused with a revoked or expired permit', () => {
    expect(denyMessage('already_used')).not.toBe(denyMessage('revoked'))
    expect(denyMessage('already_used')).not.toBe(denyMessage('expired'))
  })
})

