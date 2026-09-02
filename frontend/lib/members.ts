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

/**
 * Whether this person was given an account but has never got in.
 *
 * The account existing and the person having access are two different things:
 * an administrator creates the account, Firebase emails them, and until they
 * open that email and set a password they cannot use Zeker at all. The people
 * list showed them identically to everyone else, so an administrator had no way
 * to tell a working colleague from one who never received the email.
 *
 * Only a plain `false` counts. `has_signed_in` is `null` when Firebase did not
 * return the account, and calling that "has not entered" would be inventing an
 * answer we do not have.
 */
export function invitePending(member: Pick<Member, 'has_signed_in'>): boolean {
  return member.has_signed_in === false
}

/**
 * Whether the "send the email again" action belongs on this person's row.
 *
 * Only for someone still waiting to get in, and only when there is an address
 * to send to. It is a re-invitation, not a way for an administrator to reset
 * the password of somebody who already has access.
 */
export function canResendInvite(member: Pick<Member, 'has_signed_in' | 'email'>): boolean {
  return invitePending(member) && Boolean(member.email)
}
