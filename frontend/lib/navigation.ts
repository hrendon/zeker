import { es } from './strings'
import type { Org } from './api'

/**
 * Which tabs one person may actually use.
 *
 * Lives here rather than in the header component for the same reason
 * `gate.ts`, `permits.ts` and `history.ts` do: it is a rule, it decides
 * something that matters, and a rule inside a screen cannot be tested.
 */

export type OrgTab = 'locations' | 'interiors' | 'members' | 'permits' | 'history' | 'gate'

/**
 * The tabs one person may actually use.
 *
 * This is convenience, never a control — the API refuses each of these on its
 * own, and that refusal is the real rule. But offering a guard a tab that
 * answers 403 teaches them the product is broken, so the bar shows only what
 * their role can open.
 *
 * A guard sees the gate and nothing else. That is deliberate: security staff
 * are refused the permit screens because someone who can list a building's
 * permits knows who is expected where, all day (Decision 007).
 */
export function tabsFor(org: Org): Array<{ key: OrgTab; label: string; href: string }> {
  const base = `/organizaciones/${org.id}`
  const gate = { key: 'gate' as const, label: es.nav.gate, href: `${base}/porteria` }

  if (org.role === 'security') return [gate]

  const tabs = [
    { key: 'locations' as const, label: es.nav.locations, href: `${base}/sedes` },
    { key: 'interiors' as const, label: es.nav.interiors, href: `${base}/interiores` },
    // Adding and removing people is an administrator's job; the API refuses
    // everyone else, so the tab would only ever show an error.
    ...(org.role === 'admin'
      ? [{ key: 'members' as const, label: es.nav.members, href: `${base}/personas` }]
      : []),
    { key: 'permits' as const, label: es.nav.permits, href: `${base}/permisos` },
    // A responsable sees only their own interiors here; the API scopes it in
    // the query itself, so the tab is safe to offer to both.
    { key: 'history' as const, label: es.nav.history, href: `${base}/entradas` },
  ]

  // An administrator may also staff the gate — in a small building they often
  // are the person at the door.
  return org.role === 'admin' ? [...tabs, gate] : tabs
}
