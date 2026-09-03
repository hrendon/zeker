import { describe, expect, it } from 'vitest'
import { tabsFor } from './navigation'
import type { Org } from './api'

function org(role: Org['role']): Org {
  return {
    id: 'org_1',
    name: 'Conjunto Los Cedros',
    type: 'residence',
    plan: 'free',
    role,
    limits: { max_locations: 3, max_interiors: 10 },
    counts: { locations: 1, interiors: 1 },
  } as Org
}

const keys = (role: Org['role']) => tabsFor(org(role)).map((tab) => tab.key)

describe('what each role can even open', () => {
  it('gives a guard the gate and nothing else', () => {
    // Decision 007 kept a guard from listing permits, because whoever can list
    // them knows who is expected where all day. The entry history is the same
    // knowledge after the fact — who came into which apartment, at what time,
    // for ninety days — so it is not offered either.
    expect(keys('security')).toEqual(['gate'])
  })

  it('never shows a guard the entry history', () => {
    expect(keys('security')).not.toContain('history')
  })

  it('gives an administrator everything, including the gate', () => {
    // In a small building the person who runs it is often the person at the
    // door, and somebody has to be able to test a gate without a second account.
    expect(keys('admin')).toEqual([
      'locations',
      'interiors',
      'members',
      'permits',
      'history',
      'gate',
    ])
  })

  it('gives a responsable the history, but not the gate and not the people screen', () => {
    // The history is safe to offer because the API scopes it to their own
    // interiors in the query itself. Adding and removing people is an
    // administrator's job, and a resident checking codes at the entrance is
    // not what this product describes.
    expect(keys('responsable')).toEqual(['locations', 'interiors', 'permits', 'history'])
  })
})
