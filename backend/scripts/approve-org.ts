import { db } from '../src/lib/firebase.js'
import { isApproved } from '../src/lib/orgs.js'
import type { OrgDocument } from '../src/lib/orgs.js'

/**
 * Approving a new building (Decision 018).
 *
 *     npm run aprobar              # what is waiting
 *     npm run aprobar -- org_abc   # approve that one
 *
 * **An operator tool, not part of the product**, and that is the whole design.
 *
 * A route inside the API that could approve any customer's organization would
 * be a privileged role living *inside* the product — and since Decision 004 the
 * backend's own membership check is the only thing keeping one customer out of
 * another's data. A privileged role inside that wall is a hole in it, and it is
 * a hole that can be stolen with one password.
 *
 * So this reads and writes Firestore directly, as whoever runs it, through
 * Application Default Credentials. Access is governed by Google IAM: take away
 * that person's project access and this stops working, with no code change,
 * nothing to revoke inside Zeker, and no account that ever existed to be
 * phished. The same reasoning as `platform-report.ts`.
 *
 * **What it prints, and what it does not.** Enough to decide — the building's
 * name, its city, when it was created, how far it has been set up — and never
 * a resident's name, a visitor's name or a permit code. Deciding whether a
 * building is real needs none of those, and a tool that quietly becomes a list
 * of who lives where is exactly what `docs/security/data-minimization.md`
 * exists to prevent.
 */

const target = process.argv[2]

function asDate(value: unknown): Date | undefined {
  if (value && typeof (value as { toDate?: unknown }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate()
  }
  return undefined
}

function when(value: unknown): string {
  const at = asDate(value)
  return at ? at.toISOString().replace('T', ' ').slice(0, 16) : '—'
}

/** Who created it, as an email — read from Firebase Auth, never from our database. */
async function creatorEmail(uid: string): Promise<string> {
  if (!uid) return '—'
  try {
    const { auth } = await import('../src/lib/firebase.js')
    const user = await auth().getUser(uid)
    return user.email ?? '—'
  } catch {
    return '—'
  }
}

async function pending(): Promise<void> {
  const snapshot = await db().collection('orgs').where('approved', '==', false).get()

  const rows = snapshot.docs
    .map((doc) => ({ id: doc.id, ...(doc.data() as Partial<OrgDocument>) }))
    .filter((org) => org.status !== 'deleted')

  if (rows.length === 0) {
    console.log('\n  No hay edificios esperando aprobación.\n')
    console.log('  Eso puede significar dos cosas, y vale la pena saber cuál:')
    console.log('   · nadie se ha registrado, o')
    console.log('   · ya aprobó a todos.')
    console.log('\n  `npm run report` dice cuántas organizaciones existen en total.\n')
    return
  }

  console.log(`\n  ${rows.length} edificio(s) esperando su aprobación:\n`)

  for (const org of rows) {
    const email = await creatorEmail(String(org.created_by ?? ''))
    console.log(`  ${org.id}`)
    console.log(`    Nombre:     ${org.name ?? '—'}`)
    console.log(`    Tipo:       ${org.type ?? '—'}   Ciudad: ${org.city ?? '—'}`)
    console.log(`    Creado:     ${when(org.created_at)}  por ${email}`)
    console.log(
      `    Armado:     ${org.counts?.locations ?? 0} sede(s), ${org.counts?.interiors ?? 0} interior(es)`,
    )
    console.log('')
  }

  console.log('  Para aprobar uno:\n')
  console.log(`    npm run aprobar -- ${rows[0]!.id}\n`)
  console.log('  Mientras no lo apruebe, ese edificio NO puede agregar personas')
  console.log('  ni crear permisos. Sí puede armar sus sedes e interiores.\n')
}

async function approve(orgId: string): Promise<void> {
  const ref = db().collection('orgs').doc(orgId)
  const snapshot = await ref.get()

  if (!snapshot.exists) {
    console.error(`\n  No existe ninguna organización con id ${orgId}.\n`)
    process.exitCode = 1
    return
  }

  const org = snapshot.data() as Partial<OrgDocument>

  if (org.status === 'deleted') {
    console.error(`\n  ${orgId} está borrada. No se aprueba.\n`)
    process.exitCode = 1
    return
  }

  if (isApproved(org)) {
    console.log(`\n  ${org.name} ya estaba aprobada. No se cambió nada.\n`)
    return
  }

  const email = await creatorEmail(String(org.created_by ?? ''))

  await ref.update({
    approved: true,
    approved_at: new Date(),
    // Whoever is running this, as Google knows them. Not a Zeker account.
    approved_by: process.env.USER ?? process.env.USERNAME ?? 'operator',
    updated_at: new Date(),
  })

  console.log(`\n  ✅ ${org.name} (${orgId}) quedó aprobada.`)
  console.log(`     Creada por ${email}.`)
  console.log('\n  Ya puede agregar personas y crear permisos.')
  console.log('  Nadie le va a avisar: Zeker no envía correos propios.')
  console.log('  Si quiere que esa persona lo sepa hoy, escríbale usted.\n')
}

async function main(): Promise<void> {
  if (target) {
    await approve(target)
  } else {
    await pending()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
