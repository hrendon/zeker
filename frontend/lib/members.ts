import type { Member } from './api'
import { es } from './strings'

/**
 * What to call a person on screen.
 *
 * An account created by signing up carries no name until someone fills one in —
 * the Founder's own account is the first example. Building the label from the
 * name alone produced an empty string, which rendered as a blank row in the
 * people list and, worse, as a blank option in the responsable selector: an
 * option that works when chosen but shows nothing to choose. Found in live use
 * on 2026-08-31.
 *
 * The email is the fallback because it is the one thing every account has and
 * the one the administrator used to create it.
 */
export function memberLabel(member: Pick<Member, 'first_name' | 'last_name' | 'email'>): string {
  const name = `${member.first_name ?? ''} ${member.last_name ?? ''}`.trim()
  if (name) return name
  if (member.email) return member.email
  return es.common.unnamedPerson
}
