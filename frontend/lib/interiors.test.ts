import { describe, expect, it } from 'vitest'
import { responsableLabel } from './interiors'
import { es } from './strings'

describe('who is in charge of an interior', () => {
  it('names the person when there is a name', () => {
    expect(
      responsableLabel({ responsable_user_id: 'user_1', responsable_name: 'Ana Ruiz' }),
    ).toBe('Ana Ruiz')
  })

  it('says "sin asignar" only when nobody is assigned', () => {
    expect(responsableLabel({ responsable_user_id: null, responsable_name: '' })).toBe(
      es.interiors.noResponsable,
    )
  })

  it('never calls an assigned interior unassigned because the name is missing', () => {
    // The defect, found 2026-09-03 on the Founder's own account: the screen
    // decided from the name instead of from the assignment, so an apartment
    // with a real responsable read as unclaimed — and an administrator acting
    // on that hands somebody else's apartment away.
    const label = responsableLabel({ responsable_user_id: 'user_1', responsable_name: '' })
    expect(label).not.toBe(es.interiors.noResponsable)
    expect(label).toBe(es.interiors.responsableWithoutName)
  })

  it('treats a name of only spaces as no name, not as a name', () => {
    expect(
      responsableLabel({ responsable_user_id: 'user_1', responsable_name: '   ' }),
    ).toBe(es.interiors.responsableWithoutName)
  })

  it('keeps the two states saying different things', () => {
    expect(es.interiors.noResponsable).not.toBe(es.interiors.responsableWithoutName)
  })
})
