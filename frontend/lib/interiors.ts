import { es } from './strings'
import type { Interior } from './api'

/**
 * Who is in charge of an interior, as a person reads it.
 *
 * **Whether somebody is assigned is `responsable_user_id`, never the name.**
 * The screen used to fall back to "sin asignar" whenever the name came back
 * empty, which happens whenever that person's account has no first or last
 * name recorded — so an apartment with a real responsable read as an
 * unclaimed one. An administrator acting on that would hand somebody else's
 * apartment away. Found on 2026-09-03, on the Founder's own account.
 */
export function responsableLabel(
  interior: Pick<Interior, 'responsable_user_id' | 'responsable_name'>,
): string {
  if (!interior.responsable_user_id) return es.interiors.noResponsable
  return interior.responsable_name.trim() || es.interiors.responsableWithoutName
}
