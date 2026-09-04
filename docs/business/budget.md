# Budget — Zeker

**Owner:** Founder (the ceiling itself). FP&A Manager owns monitoring against it once activated.
**Set:** 2026-08-31
**Status:** Active

---

## The ceiling

**20,000 COP per month, total, across every service the project pays for.**

That is roughly US$5 at the exchange rates of late 2026 — the rate moves, the
peso figure is the binding one.

## The rule this expresses

Spend as little as possible. Use free tiers wherever a free tier does the job.
A paid plan is not chosen because it is more comfortable; it is chosen when the
free tier has actually run out and the work cannot continue without it.

The ceiling is a hard limit, not a target to grow into. Being far under it is
the expected state, not an opportunity.

## Why it is this low, deliberately

The project has no customers and no revenue. Until it does, every peso spent is
the Founder's own money funding an unvalidated bet. A low ceiling keeps that bet
small while the question that matters — will anyone pay for this — is still
unanswered.

## When it gets reviewed

**On real revenue, not on a calendar.** Once customers are paying, the ceiling is
reconsidered against actual income rather than against hope. At that point the
finance role decides what of that income is profit and what is reinvested into
the budget — that split is a finance decision under the Founder's approval, not
an engineering one.

Purchases recorded against this budget are part of the same review.

## What is being spent today

Everything currently in use sits inside a free tier:

| Service | What it does | Cost today |
|---|---|---|
| Cloud Run (`zeker-api`, `zeker-web`) | Runs the API and the site | Free tier; both scale to zero when idle |
| Firestore | The database | Free tier |
| Firebase Auth | Sign-in | Free tier |
| Cloud KMS | Encryption key | Free tier at one key |
| Artifact Registry | Stores the built containers | Free tier at this size |

**Both Cloud Run services scale to zero on purpose.** Keeping an instance warm
would remove the slow first load a visitor sees, and would also be the first
recurring charge this project takes on. That trade-off belongs to the Founder
under this ceiling, not to an engineering preference for a faster page.

## How this is enforced

`mantis/execution.md`'s Budget Gate: introducing a tool, service or dependency
with a recurring or usage-based cost is 🟡 — it is proposed with its cost stated
and checked against this file, never adopted silently. Without this file it
would be a 🔴 hard stop.

**Open action:** the GCP billing alert created on 2026-08-19 has never been
checked against this ceiling. It should be set to warn well below 20,000 COP so
the alert arrives while there is still room, not after.

---

## Updated 2026-09-01 — the first MBR, and the first recurring cost

**FP&A Manager was activated on 2026-09-01, effective 2026-08-19.** This file had
named that role as the owner of monitoring since it was written, and the role did
not exist: the project registry gated finance on revenue, contradicting the
framework, which gates it on the first spend. **The ceiling had a number and no
monitor for thirteen days.**

### The claim above is UNVERIFIED, and is not repeated as fact

The "cost today" table is a service-by-service inference, not an observation. **No
billing report has been read since this project was created.** Recorded as
`D-FPA-1` in `docs/meetings/2026-09-01-mbr-comite-gasto.md`: repeating an
unverified claim in a finance artifact is how it becomes a fact by repetition.

### Measured on 2026-09-01, for the first time

    cd backend && npm run costs

This reads how full each free tier is — the quantities that turn into charges.
**It is not the bill**, and it says so; the invoice needs console access.

| Surface | Measured | Note |
|---|---|---|
| Artifact Registry | **133.2 MB of ~500 MB (27%)** | Was 107.4 MB earlier the same day. **One deploy added ~26 MB — about 5% of the allowance.** At that rate ~14 more deploys fill it, with no customers involved |
| Cloud KMS | 1 version ≈ **240 COP/month** | **Decision 005 left this key unused.** This would be the project's first charge, for a resource the product does not need |
| Cloud Run egress | 2 services | Free tier is North-America egress; we serve Bogotá, which is South America and costs more. Scales with customers |
| Billing alert | **The Budget API is not enabled** | Strong signal the 2026-08-19 alert is not real. Not proof |

### The first recurring cost

**`zeker.com.co`, Cloudflare, US$15/year ≈ 5,000 COP/month = 25% of the ceiling.**
Bought 2026-09-01. Details and renewal controls in `vendors.md`.

**The spend floor is no longer zero, permanently.** Until today, any non-zero charge
was a signal. From now on ~5,000 COP/month is expected noise, which is exactly why
the alert threshold matters and why it should have been set first.

### The convention this file still lacks

**How does an annual charge count against a monthly ceiling?** Amortized, the domain
is 25% and fits. As cash, it is 3× the monthly ceiling in the month it is paid.
Both readings are defensible from the text above and they give opposite answers.

**Recommended, and the Founder's to accept:** amortize — the ceiling is a run-rate
control on recurring commitments, not a cash-flow limit — **with a guardrail: any
single cash outlay above 50,000 COP needs explicit approval regardless of how it
amortizes.** Record the cash outlay separately from the run rate, so a month
containing a renewal is not later misread as a breach.

### What is still not known, and matters more than anything above

1. ~~Is a US$300 free-trial credit active, and when does it expire?~~ **ANSWERED
   2026-09-01 by the Founder: yes, and it expires 2026-11-17** — and it is
   **shared with the Founder's other projects.**

   This is now a dated event, not an unknown. Three consequences:
   - **Every reading of "US$0.00" between now and 2026-11-17 proves nothing.** A
     stack inside Always Free and a stack billed-then-credited-to-zero are
     indistinguishable in a top-line total. They diverge on one day.
   - **On 2026-11-17, whatever is silently being charged starts hitting the card**,
     with no prior signal unless an alert exists first.
   - **The credit is shared.** Another project can exhaust it before November, and
     nothing in this repository knows those projects exist. The budget alert must
     therefore be set **on the billing account, not only on this project**, or it
     watches the wrong pool.

   The distinguishing evidence takes minutes: the billing report grouped **by SKU**
   with the **credits column shown**. Until someone reads it, the "everything is
   free" claim above stays UNVERIFIED — not because it is doubted, but because the
   only number that could confirm it is currently masked by design.
2. **Does the 2026-08-19 alert have a threshold, a currency and a recipient?**
   ⚠️ If the billing account is denominated in USD, the budget amount is **US$5**,
   not 20,000 — entering "20000" would create a US$20,000 budget that never fires.

Both need the console. Both are the Founder's to close.


---

## Updated 2026-09-04 — read live from the billing account, not inferred

Three things were read directly from Google on 2026-09-04, at the Founder's
request for a consolidated figure. Two of them close open questions in this file.

### 1. ✅ The billing account is denominated in **COP**

    gcloud billing accounts describe 01C0F1-38F3BC-DE3AFA → currencyCode: COP

**This closes the ⚠️ warning above.** The budget alert amount is **20,000**, and
the 25% threshold is **5,000** — both in pesos, as written. There was a real risk
of entering "20000" into a USD-denominated budget and creating a US$20,000
ceiling that would never fire. That risk is now gone, and the Founder can create
the alert with the numbers exactly as this file states them.

### 2. 🔴 The billing alert still does not exist

    gcloud billing budgets list → Cloud Billing Budget API has not been used
    in project zeker-505918 before or it is disabled

The API a budget is created through has **never been enabled**. That is not
absolute proof no budget exists — a budget lives on the billing account, not the
project — but combined with `cost-watch`'s own reading it is as close as this
repository can get without the console. **Treat the 2026-08-19 alert as not
real** until the Founder sees it in the console.

### 3. 🟡 Artifact Registry doubled in three days

| Date | Measured | Share of the 500 MB free tier |
|---|---|---|
| 2026-09-01 | 107.4 MB → 133.2 MB | 21% → 27% |
| **2026-09-04** | **267.4 MB** | **53%** |

Nothing else in this project grows on its own. **Every megabyte of that is our
own deploys**, with zero customers — seven publishes since 2026-09-02. At this
rate the free tier is full in roughly a dozen more, and the first Google charge
this project ever takes will be for storing container images nobody runs.

The fix is already named and not done: an Artifact Registry cleanup policy
(step 11 on the ordered list). It costs nothing and it is not the Founder's
hands — it is mine.

### What can still not be read from here, and it is the important one

**The actual bill.** Google exposes cost through the console or a BigQuery
export this project does not have; there is no `gcloud` command for it. So the
consolidated position remains:

| | Amount | Confidence |
|---|---|---|
| Domain (`zeker.com.co`, Cloudflare, annual) | **~60,000 COP paid 2026-09-01**, plus ~2–3% card and FX | **Confirmed.** A card was charged |
| Everything at Google, since 2026-08-19 | **Unknown** | **Never read.** Believed inside free tiers; a shared US$300 credit expiring **2026-11-17** makes any "US$0.00" unreadable either way |
| **Committed run rate** | **~5,000 COP/month** = 25% of the ceiling | Confirmed, amortized |

**The one action that changes this line from "unknown" to a number** is still
the same one: the billing report grouped **by SKU**, with the **credits column
shown**. Minutes, in the console, and only the Founder can do it.


### Puesto el mismo día: la regla de limpieza

**Aplicada 2026-09-04 sobre `cloud-run-source-deploy`**, con la aprobación del
Fundador después de ver exactamente qué se borraría:

* **Conservar las 3 versiones más recientes** de cada servicio — la que está
  viva, más dos para volver atrás al instante.
* **Borrar el resto**, sin condición de antigüedad. Ocho imágenes de catorce.

Confirmado leyendo el repositorio después de aplicarla: las dos reglas están
puestas y **el modo de prueba está apagado**, así que borra de verdad.

**Y aquí está la parte que este proyecto tiene que dejar de repetir:** en el
momento de escribir esto **no ha borrado nada**. El repositorio marca 300,9 MB,
más que antes, porque la publicación de hoy entró primero. Google ejecuta estas
reglas por su cuenta, normalmente dentro de un día.

Así que hoy esto es **declarado y confirmado configurado, con su efecto sin
comprobar** — la quinta vez que aparece la misma forma (R-16, R-25, R-26, R-28).
La diferencia es que esta vez está escrito antes de que alguien lo dé por hecho.

**La comprobación, para la próxima sesión:** correr `npm run costs` o pedir el
tamaño del repositorio. **Pasa** si bajó de 300 MB a cerca de 150 MB y quedan
seis imágenes. **Falla** si sigue en 300 y hay catorce — y entonces la regla
está puesta y no está corriendo, que es peor que no tenerla, porque parece
resuelto.
