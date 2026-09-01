import { execFileSync } from 'node:child_process'

/**
 * What this project is costing, and what is about to start costing.
 *
 * Run it:
 *
 *     npm run costs
 *
 * **Why this exists.** `docs/business/budget.md` sets a ceiling of 20,000 COP a
 * month and says every service sits inside a free tier. On 2026-09-01 the first
 * MBR found that claim had never been checked once in the thirteen days since
 * the project started incurring cost, and recorded it as UNVERIFIED rather than
 * repeating it. FP&A Manager was activated the same day — but a role recorded in
 * a document does not read a bill. This is the thing that reads it.
 *
 * **What it can and cannot see, stated plainly.** It reads resource *state* from
 * Google Cloud as whoever runs it, through Application Default Credentials — the
 * same trust model as `npm run report`, governed by IAM, with no privileged
 * account inside Zeker.
 *
 * It cannot read the invoice. Actual charges live in Cloud Billing, which needs
 * either a BigQuery export this project has not set up or console access. So
 * this measures **the quantities that turn into charges** — how full each free
 * tier is — and tells you which one runs out first. That is genuinely useful and
 * it is genuinely not the bill; the difference is printed at the end rather than
 * left for the reader to assume.
 *
 * The four surfaces below are not a generic checklist. They are the ranking the
 * MBR produced for where this specific stack's first real charge comes from.
 */

const PROJECT = 'zeker-505918'
const CEILING_COP = 20_000
const COP_PER_USD = 4_000 // budget.md's own equivalence: US$5 ≈ 20,000 COP

/** Free allowances, in the units each service actually meters. */
const FREE = {
  artifactRegistryMb: 500,
  kmsVersions: 0, // there is no always-free allowance for key versions
}

/** Monthly price of one KMS key version, in USD. Approximate list price. */
const KMS_USD_PER_VERSION = 0.06

type Row = {
  what: string
  measured: string
  limit: string
  status: 'ok' | 'watch' | 'over' | 'unknown'
  note: string
}

// On Windows `gcloud` is a .cmd shim, which execFile cannot resolve on its own.
// Getting this wrong is quiet rather than loud: every call fails, every row
// reads "no se pudo leer", and the report looks like a permissions problem.
const GCLOUD = process.platform === 'win32' ? 'gcloud.cmd' : 'gcloud'

function gcloud(args: string[]): string | undefined {
  try {
    return execFileSync(GCLOUD, [...args, '--project', PROJECT], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 60_000,
      shell: process.platform === 'win32',
    }).trim()
  } catch {
    // A missing permission, a disabled API and an absent gcloud all land here.
    // They are reported as "unknown", never silently as zero — a cost surface
    // nobody could read is the one most likely to surprise us.
    return undefined
  }
}

/** Same call, without the trailing `--project`: some subcommands take it positionally. */
function gcloudRaw(args: string[]): string | undefined {
  try {
    return execFileSync(GCLOUD, args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 60_000,
      shell: process.platform === 'win32',
    }).trim()
  } catch {
    return undefined
  }
}

function copPerMonth(usd: number): number {
  return Math.round(usd * COP_PER_USD)
}

function pctOfCeiling(cop: number): string {
  return `${((cop / CEILING_COP) * 100).toFixed(1)}% del techo`
}

const rows: Row[] = []

// 1. Artifact Registry — the line that goes non-zero first, because it grows
//    with the number of deploys rather than with the number of customers, and
//    nothing in this repository deletes an old image.
{
  // JSON, not value(): gcloud's value() projection silently reformats
  // sizeBytes into rounded units, so the number that came back was neither
  // bytes nor the MB figure the console shows.
  const raw = gcloud(['artifacts', 'repositories', 'list', '--format=json'])
  if (raw === undefined) {
    rows.push({
      what: 'Artifact Registry (imágenes de cada despliegue)',
      measured: 'no se pudo leer',
      limit: `${FREE.artifactRegistryMb} MB gratis`,
      status: 'unknown',
      note: 'Falta permiso, o la API está apagada. No asuma que es cero.',
    })
  } else {
    const repos = JSON.parse(raw) as Array<{ sizeBytes?: string | number }>
    const totalBytes = repos.reduce((sum, r) => sum + Number(r.sizeBytes ?? 0), 0)
    const mb = totalBytes / 1_000_000
    const pct = (mb / FREE.artifactRegistryMb) * 100
    rows.push({
      what: 'Artifact Registry (imágenes de cada despliegue)',
      measured: `${mb.toFixed(1)} MB (${pct.toFixed(0)}%)`,
      limit: `${FREE.artifactRegistryMb} MB gratis`,
      status: pct >= 100 ? 'over' : pct >= 60 ? 'watch' : 'ok',
      note:
        'Crece con CADA despliegue y no hay política de limpieza. Es la única ' +
        'línea que sube sin que llegue un solo cliente.',
    })
  }
}

// 2. Cloud KMS — versions bill per month, and Decision 005 removed the only
//    thing that would have used this key. A charge for a resource the product
//    does not use is worse than a charge for one it does.
{
  const keyrings = gcloud([
    'kms',
    'keyrings',
    'list',
    '--location=us-central1',
    '--format=value(name.basename())',
  ])
  if (keyrings === undefined) {
    rows.push({
      what: 'Cloud KMS (llave de cifrado)',
      measured: 'no se pudo leer',
      limit: 'sin capa gratis por versión',
      status: 'unknown',
      note: 'Decisión 005 dejó esta llave sin uso. Verifíquela.',
    })
  } else {
    let versions = 0
    for (const kr of keyrings.split('\n').filter(Boolean)) {
      const keys = gcloud([
        'kms',
        'keys',
        'list',
        `--keyring=${kr}`,
        '--location=us-central1',
        '--format=value(name.basename())',
      ])
      for (const key of (keys ?? '').split('\n').filter(Boolean)) {
        const vs = gcloud([
          'kms',
          'keys',
          'versions',
          'list',
          `--key=${key}`,
          `--keyring=${kr}`,
          '--location=us-central1',
          '--filter=state=ENABLED',
          '--format=value(name)',
        ])
        versions += (vs ?? '').split('\n').filter(Boolean).length
      }
    }
    const cop = copPerMonth(versions * KMS_USD_PER_VERSION)
    rows.push({
      what: 'Cloud KMS (llave de cifrado)',
      measured: `${versions} versión(es) ≈ ${cop.toLocaleString('es-CO')} COP/mes`,
      limit: 'sin capa gratis por versión',
      status: versions > 0 ? 'watch' : 'ok',
      note:
        versions > 0
          ? `${pctOfCeiling(cop)}. Decisión 005 dejó esta llave SIN USO: sería ` +
            'pagar por algo que el producto no necesita. Rota cada 90 días, ' +
            'así que las versiones se acumulan.'
          : 'Sin versiones activas.',
    })
  }
}

// 3. Cloud Run — the free tier covers requests and compute; egress does not,
//    and we serve us-central1 to Bogotá, which is South America egress. The
//    multiplier is the browser bundle, which has no owner and no limit.
{
  const svcs = gcloud([
    'run',
    'services',
    'list',
    '--region=us-central1',
    '--format=value(metadata.name,spec.template.spec.containers[0].resources.limits.memory)',
  ])
  rows.push({
    what: 'Cloud Run (egress hacia Colombia)',
    measured: svcs
      ? `${svcs.split('\n').filter(Boolean).length} servicio(s), escalan a cero`
      : 'no se pudo leer',
    limit: 'peticiones y cómputo gratis; **el egress se cobra aparte**',
    status: 'unknown',
    note:
      'La capa gratis de egress es de Norteamérica. Servimos us-central1 → ' +
      'Bogotá, que es Suramérica y cuesta más. Escala con clientes, y el ' +
      'multiplicador es el peso del sitio, que hoy no tiene dueño ni límite.',
  })
}

// 4. The billing alert. This is the control that was created on 2026-08-19,
//    marked complete, and never verified to have a threshold, a currency or a
//    recipient — the third occurrence of this project declaring a thing without
//    checking it took effect.
{
  const account = gcloudRaw([
    'billing',
    'projects',
    'describe',
    PROJECT,
    '--format=value(billingAccountName)',
  ])
  const budgets =
    account === undefined
      ? undefined
      : gcloud(['services', 'list', '--enabled', '--filter=billingbudgets', '--format=value(config.name)'])
  rows.push({
    what: 'Alerta de facturación',
    measured:
      account === undefined
        ? 'no se pudo leer'
        : budgets
          ? 'API de presupuestos activa — verifique el umbral en la consola'
          : 'la API de presupuestos NO está activa',
    limit: `avisar en 5.000 COP (25% de ${CEILING_COP.toLocaleString('es-CO')})`,
    status: budgets ? 'watch' : 'over',
    note:
      'Una alerta puesta en el techo llega cuando ya no queda margen. El gasto ' +
      'esperado hoy es cero, así que su trabajo no es "¿estamos cerca del ' +
      'límite?" sino "¿esto ya empezó a costar?".',
  })
}

const icon = { ok: '🟢', watch: '🟡', over: '🔴', unknown: '⚪' } as const

console.log(`\n  GASTO — Zeker (${PROJECT})`)
console.log(`  Techo: ${CEILING_COP.toLocaleString('es-CO')} COP/mes · docs/business/budget.md\n`)

for (const r of rows) {
  console.log(`  ${icon[r.status]} ${r.what}`)
  console.log(`     medido:  ${r.measured}`)
  console.log(`     límite:  ${r.limit}`)
  console.log(`     ${r.note}\n`)
}

console.log('  ─────────────────────────────────────────────────────────────')
console.log('  LO QUE ESTO **NO** ES: la factura.')
console.log('  Mide qué tan llenas están las capas gratis, que es lo que se')
console.log('  convierte en cobro. El cargo real vive en Cloud Billing y')
console.log('  necesita la consola o una exportación a BigQuery que este')
console.log('  proyecto no tiene.')
console.log('')
console.log('  DOS PREGUNTAS QUE ESTE SCRIPT NO PUEDE RESPONDER, y que siguen')
console.log('  siendo lo más importante:')
console.log('   1. ¿Hay un crédito de prueba de US$300 activo? Si lo hay, el')
console.log('      gasto real está tapado y hay un precipicio en una fecha que')
console.log('      nadie tiene escrita.  (risks.md R-10)')
console.log('   2. ¿La alerta creada el 2026-08-19 tiene umbral, moneda y')
console.log('      destinatario? Nunca se verificó.  (risks.md R-16)')
console.log('')
console.log(`  Facturación:  https://console.cloud.google.com/billing?project=${PROJECT}`)
console.log(`  Presupuestos: https://console.cloud.google.com/billing/budgets?project=${PROJECT}`)
console.log('  Renovaciones de terceros: docs/business/vendors.md\n')
